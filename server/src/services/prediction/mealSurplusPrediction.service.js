import MealSchedule from '../../models/MealSchedule.js';
import MealOutcome from '../../models/MealOutcome.js';

export const MEAL_PREDICTION_CONFIG = {
  // Configurable minimum verified historical records required before training & evaluating ML model
  MIN_RECORDS_FOR_ML: 15,
  MIN_RECORDS_FOR_HISTORICAL: 1,
  MODEL_VERSION: 'v1.0.0-rf-heuristic-hybrid'
};

/**
 * Calculates scheduled duration in minutes between start time and end time
 */
export const calculateDurationMinutes = (startTime, endTime) => {
  if (!startTime || !endTime) return 120; // Default 2 hours
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const diff = (endH * 60 + endM) - (startH * 60 + startM);
  return diff > 0 ? diff : 120;
};

/**
 * Tokenizes menu items into meaningful words for similarity comparison
 */
export const tokenizeMenu = (menuString) => {
  if (!menuString || typeof menuString !== 'string') return new Set();
  const tokens = menuString
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
  return new Set(tokens);
};

/**
 * Calculates Jaccard similarity between two menu strings
 */
export const calculateMenuSimilarity = (menuA, menuB) => {
  const setA = tokenizeMenu(menuA);
  const setB = tokenizeMenu(menuB);
  if (setA.size === 0 || setB.size === 0) return 0;

  let intersectionCount = 0;
  for (const token of setA) {
    if (setB.has(token)) {
      intersectionCount++;
    }
  }
  const unionSize = new Set([...setA, ...setB]).size;
  return unionSize > 0 ? intersectionCount / unionSize : 0;
};

/**
 * Encodes schedule features into a numeric vector for ML regression.
 * STRICT: Only uses features available when prediction is made.
 * NO DATA LEAKAGE: Actual outcome fields are never included.
 */
export const extractFeatureVector = (schedule) => {
  const prep = Number(schedule.expectedMealsPrepared) || 0;
  const eating = Number(schedule.expectedPeopleEating) || 0;
  const prepBuffer = Math.max(0, prep - eating);
  const prepRatio = prep > 0 ? eating / prep : 1;

  // Meal type one-hot encoding
  const isBreakfast = schedule.mealType === 'Breakfast' ? 1 : 0;
  const isLunch = schedule.mealType === 'Lunch' ? 1 : 0;
  const isDinner = schedule.mealType === 'Dinner' ? 1 : 0;

  const isSpecialEvent = schedule.isSpecialEvent ? 1 : 0;

  // Typical leftover handling (safe fallback if missing)
  const hasTypical =
    schedule.typicalLeftoverQuantity !== null &&
    schedule.typicalLeftoverQuantity !== undefined &&
    schedule.typicalLeftoverQuantity !== '';
  const typicalLeftover = hasTypical ? Number(schedule.typicalLeftoverQuantity) : prepBuffer;

  const durationMin = calculateDurationMinutes(
    schedule.scheduledStartTime,
    schedule.scheduledEndTime
  );

  let dayOfWeek = 3; // Wednesday default
  if (schedule.mealDate) {
    const d = new Date(schedule.mealDate);
    if (!isNaN(d.getTime())) {
      dayOfWeek = d.getDay();
    }
  }

  const menuTokenCount = tokenizeMenu(schedule.menuItems).size;

  return [
    prep,
    eating,
    prepBuffer,
    prepRatio,
    isBreakfast,
    isLunch,
    isDinner,
    isSpecialEvent,
    typicalLeftover,
    hasTypical ? 1 : 0,
    durationMin,
    dayOfWeek,
    menuTokenCount
  ];
};

/**
 * Lightweight, robust Decision Tree Node for Random Forest Regression
 */
class RegressionTreeNode {
  constructor(depth = 0, maxDepth = 4, minSamplesSplit = 4) {
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.splitFeature = null;
    this.splitValue = null;
    this.left = null;
    this.right = null;
    this.prediction = null;
  }

  fit(X, y) {
    const numSamples = y.length;
    const mean = y.reduce((acc, val) => acc + val, 0) / (numSamples || 1);
    this.prediction = mean;

    if (this.depth >= this.maxDepth || numSamples < this.minSamplesSplit) {
      return;
    }

    const numFeatures = X[0].length;
    let bestVarianceReduction = -Infinity;
    let bestFeature = null;
    let bestValue = null;
    let bestSplits = null;

    const currentVariance =
      y.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / (numSamples || 1);

    // Random feature subspace sampling (select ~sqrt(numFeatures) or random subset)
    const featureIndices = Array.from({ length: numFeatures }, (_, i) => i);
    const sampledFeatures = featureIndices
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.max(3, Math.floor(Math.sqrt(numFeatures) * 1.5)));

    for (const fIdx of sampledFeatures) {
      const values = X.map((row) => row[fIdx]);
      // Sample unique split candidates
      const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
      if (uniqueValues.length <= 1) continue;

      for (let i = 0; i < uniqueValues.length - 1; i++) {
        const splitPoint = (uniqueValues[i] + uniqueValues[i + 1]) / 2;

        const leftX = [];
        const leftY = [];
        const rightX = [];
        const rightY = [];

        for (let j = 0; j < numSamples; j++) {
          if (X[j][fIdx] <= splitPoint) {
            leftX.push(X[j]);
            leftY.push(y[j]);
          } else {
            rightX.push(X[j]);
            rightY.push(y[j]);
          }
        }

        if (leftY.length === 0 || rightY.length === 0) continue;

        const leftMean = leftY.reduce((a, b) => a + b, 0) / leftY.length;
        const rightMean = rightY.reduce((a, b) => a + b, 0) / rightY.length;

        const leftVar =
          leftY.reduce((a, b) => a + Math.pow(b - leftMean, 2), 0) / leftY.length;
        const rightVar =
          rightY.reduce((a, b) => a + Math.pow(b - rightMean, 2), 0) / rightY.length;

        const weightedVar =
          (leftY.length / numSamples) * leftVar + (rightY.length / numSamples) * rightVar;
        const varianceReduction = currentVariance - weightedVar;

        if (varianceReduction > bestVarianceReduction) {
          bestVarianceReduction = varianceReduction;
          bestFeature = fIdx;
          bestValue = splitPoint;
          bestSplits = { leftX, leftY, rightX, rightY };
        }
      }
    }

    if (bestVarianceReduction > 0.001 && bestSplits) {
      this.splitFeature = bestFeature;
      this.splitValue = bestValue;
      this.left = new RegressionTreeNode(this.depth + 1, this.maxDepth, this.minSamplesSplit);
      this.right = new RegressionTreeNode(this.depth + 1, this.maxDepth, this.minSamplesSplit);

      this.left.fit(bestSplits.leftX, bestSplits.leftY);
      this.right.fit(bestSplits.rightX, bestSplits.rightY);
    }
  }

  predictOne(x) {
    if (this.splitFeature === null || !this.left || !this.right) {
      return this.prediction;
    }
    if (x[this.splitFeature] <= this.splitValue) {
      return this.left.predictOne(x);
    } else {
      return this.right.predictOne(x);
    }
  }
}

/**
 * Random Forest Regressor
 * Implements bagging of randomized regression trees
 */
export class RandomForestRegressor {
  constructor(numTrees = 15, maxDepth = 4, minSamplesSplit = 3) {
    this.numTrees = numTrees;
    this.maxDepth = maxDepth;
    this.minSamplesSplit = minSamplesSplit;
    this.trees = [];
  }

  fit(X, y) {
    this.trees = [];
    const n = X.length;

    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling (sampling with replacement)
      const bX = [];
      const bY = [];
      for (let i = 0; i < n; i++) {
        const randIdx = Math.floor(Math.random() * n);
        bX.push(X[randIdx]);
        bY.push(y[randIdx]);
      }

      const tree = new RegressionTreeNode(0, this.maxDepth, this.minSamplesSplit);
      tree.fit(bX, bY);
      this.trees.push(tree);
    }
  }

  predict(X) {
    return X.map((x) => {
      const preds = this.trees.map((tree) => tree.predictOne(x));
      const avg = preds.reduce((a, b) => a + b, 0) / (preds.length || 1);
      return Math.max(0, avg);
    });
  }

  predictSingle(x) {
    return this.predict([x])[0];
  }
}

/**
 * Baseline Surplus Estimation Strategies
 */
export const calculateBaselineSurplus = (schedule) => {
  const prepared = Number(schedule.expectedMealsPrepared) || 0;
  const eating = Number(schedule.expectedPeopleEating) || 0;

  // Case A: Simple initial estimate = max(0, prepared - eating)
  // Non-negative strictly enforced
  const initialEstimate = Math.max(0, prepared - eating);

  // Case B: Donor provided typicalLeftoverQuantity
  if (
    schedule.typicalLeftoverQuantity !== null &&
    schedule.typicalLeftoverQuantity !== undefined &&
    schedule.typicalLeftoverQuantity !== ''
  ) {
    const typical = Number(schedule.typicalLeftoverQuantity);
    if (!isNaN(typical) && typical >= 0) {
      // Conservative blend of donor typical leftover and current planned buffer
      const adjustedTypical = Math.round(0.65 * typical + 0.35 * initialEstimate);
      const boundedTypical = Math.max(0, Math.min(prepared, adjustedTypical));
      return {
        surplus: boundedTypical,
        strategy: 'baseline_typical',
        explanation: `Based on donor-provided typical leftover history (${typical} meals) adjusted for current planned batch (${prepared} prepared, ${eating} diners).`
      };
    }
  }

  return {
    surplus: initialEstimate,
    strategy: 'baseline_initial',
    explanation: `Calculated from planned meals (${prepared}) minus expected diners (${eating}).`
  };
};

/**
 * Historical records weighted adjustment (Case C)
 */
export const calculateHistoricalWeightedSurplus = (schedule, historicalRecords) => {
  if (!historicalRecords || historicalRecords.length === 0) {
    return null;
  }

  const prep = Number(schedule.expectedMealsPrepared) || 0;
  const eating = Number(schedule.expectedPeopleEating) || 0;
  const baseBuffer = Math.max(0, prep - eating);

  let totalWeightedSurplusRate = 0;
  let totalWeights = 0;
  let matchedRecordsCount = 0;

  for (const record of historicalRecords) {
    // Only records with valid actual outcome
    const outcome = record.outcome;
    if (!outcome || outcome.actualLeftoverQuantity === undefined || outcome.actualLeftoverQuantity === null) {
      continue;
    }

    const histPrep = Number(record.expectedMealsPrepared);
    const histEating = Number(record.expectedPeopleEating);
    const actualLeftover = Number(outcome.actualLeftoverQuantity);

    if (isNaN(histPrep) || histPrep <= 0 || isNaN(actualLeftover) || actualLeftover < 0) {
      continue;
    }

    // Historical leftover rate bounded in [0, 1]
    const histRate = Math.min(1, Math.max(0, actualLeftover / histPrep));

    let weight = 1.0;

    // 1. Meal type match (+2.0)
    if (record.mealType === schedule.mealType) {
      weight += 2.0;
    }

    // 2. Preparation scale similarity (+/- 25%) (+1.5)
    if (prep > 0) {
      const prepDiffRatio = Math.abs(histPrep - prep) / prep;
      if (prepDiffRatio <= 0.25) {
        weight += 1.5;
      }
    }

    // 3. Diner count similarity (+/- 25%) (+1.0)
    if (eating > 0 && histEating > 0) {
      const eatingDiffRatio = Math.abs(histEating - eating) / eating;
      if (eatingDiffRatio <= 0.25) {
        weight += 1.0;
      }
    }

    // 4. Special event match (+1.0)
    if (Boolean(record.isSpecialEvent) === Boolean(schedule.isSpecialEvent)) {
      weight += 1.0;
    }

    // 5. Menu similarity (up to +1.5)
    const menuSim = calculateMenuSimilarity(schedule.menuItems, record.menuItems);
    weight += menuSim * 1.5;

    totalWeightedSurplusRate += histRate * weight;
    totalWeights += weight;
    matchedRecordsCount++;
  }

  if (matchedRecordsCount === 0 || totalWeights === 0) {
    return null;
  }

  const weightedSurplusRate = totalWeightedSurplusRate / totalWeights;
  const rateBasedSurplus = prep * weightedSurplusRate;

  // Blend 75% weighted historical rate + 25% schedule planned buffer
  const blendedEstimate = Math.round(0.75 * rateBasedSurplus + 0.25 * baseBuffer);
  const boundedSurplus = Math.max(0, Math.min(prep, blendedEstimate));

  return {
    surplus: boundedSurplus,
    rate: Math.round(weightedSurplusRate * 1000) / 1000,
    recordsUsed: matchedRecordsCount,
    explanation: `Calculated from ${matchedRecordsCount} verified past meal outcome(s) factoring in ${schedule.mealType} trends, planned portions (${prep}), and diner patterns.`
  };
};

/**
 * Core Meal Surplus Prediction Engine
 * Predicts likely surplus portions for a scheduled meal.
 * Follows progressive upgrade lifecycle: Baseline -> Historical Baseline -> Random Forest ML.
 *
 * @param {Object} schedule - MealSchedule document or object
 * @param {string|ObjectId} donorId - Authenticated donor user ID
 * @returns {Promise<Object>} Formatted prediction result
 */
export const predictMealSurplus = async (schedule, donorId) => {
  if (!schedule) {
    throw new Error('Meal schedule is required for surplus prediction.');
  }

  const prep = Number(schedule.expectedMealsPrepared) || 0;
  const eating = Number(schedule.expectedPeopleEating) || 0;

  // 1. Calculate baseline surplus (Cases A & B)
  const baselineResult = calculateBaselineSurplus(schedule);

  // 2. Fetch verified historical records for this donor with actual outcomes
  // Strictly exclude the current schedule to prevent data leakage
  const historicalSchedules = await MealSchedule.find({
    donorId: donorId || schedule.donorId,
    _id: { $ne: schedule._id },
    preparationStatus: 'Completed'
  })
    .populate('outcome')
    .sort({ createdAt: -1 })
    .lean();

  // Filter schedules that actually have recorded outcomes
  const verifiedHistory = historicalSchedules.filter((s) => {
    return (
      s.outcome &&
      s.outcome.actualLeftoverQuantity !== undefined &&
      s.outcome.actualLeftoverQuantity !== null &&
      Number(s.outcome.actualLeftoverQuantity) >= 0 &&
      Number(s.expectedMealsPrepared) > 0
    );
  });

  const numVerifiedRecords = verifiedHistory.length;
  let predictedSurplusQuantity = baselineResult.surplus;
  let predictionMethod = 'baseline';
  let explanation = baselineResult.explanation;
  let sufficientHistoricalData = false;
  let modelMetadata = {
    baselineSurplus: baselineResult.surplus,
    historicalAverageRate: null,
    minRecordsForMl: MEAL_PREDICTION_CONFIG.MIN_RECORDS_FOR_ML,
    mlEvaluated: false,
    modelMae: null,
    baselineMae: null
  };

  // 3. Historical baseline adjustment (Case C)
  if (numVerifiedRecords >= MEAL_PREDICTION_CONFIG.MIN_RECORDS_FOR_HISTORICAL) {
    const histResult = calculateHistoricalWeightedSurplus(schedule, verifiedHistory);
    if (histResult) {
      predictedSurplusQuantity = histResult.surplus;
      predictionMethod = 'historical_baseline';
      explanation = histResult.explanation;
      modelMetadata.historicalAverageRate = histResult.rate;
    }
  }

  // 4. Machine learning upgrade path (Section 3)
  // Only evaluate and train if enough representative records exist
  if (numVerifiedRecords >= MEAL_PREDICTION_CONFIG.MIN_RECORDS_FOR_ML) {
    sufficientHistoricalData = true;

    try {
      // Build training dataset (features X and target y = actualLeftoverQuantity)
      const X = [];
      const y = [];
      const baselineActualDiffs = [];

      for (const hist of verifiedHistory) {
        const feat = extractFeatureVector(hist);
        const actualLeftover = Number(hist.outcome.actualLeftoverQuantity);
        X.push(feat);
        y.push(actualLeftover);

        // Track baseline prediction for this record
        const histPrep = Number(hist.expectedMealsPrepared) || 0;
        const histEating = Number(hist.expectedPeopleEating) || 0;
        const histBaseline = Math.max(0, histPrep - histEating);
        baselineActualDiffs.push(Math.abs(actualLeftover - histBaseline));
      }

      // Train / Test split (80% train, 20% test)
      const testSize = Math.max(2, Math.floor(X.length * 0.2));
      const trainSize = X.length - testSize;

      // Seeded-consistent shuffle
      const indices = Array.from({ length: X.length }, (_, i) => i);
      const shuffledIndices = indices.sort((a, b) => (a * 17 + 3) % 29 - (b * 17 + 3) % 29);

      const trainX = [];
      const trainY = [];
      const testX = [];
      const testY = [];
      const testBaselineErrors = [];

      for (let i = 0; i < shuffledIndices.length; i++) {
        const idx = shuffledIndices[i];
        if (i < trainSize) {
          trainX.push(X[idx]);
          trainY.push(y[idx]);
        } else {
          testX.push(X[idx]);
          testY.push(y[idx]);
          testBaselineErrors.push(baselineActualDiffs[idx]);
        }
      }

      // Train Random Forest Regressor
      const rf = new RandomForestRegressor(12, 4, 3);
      rf.fit(trainX, trainY);

      // Evaluate MAE on validation test set
      const testPredictions = rf.predict(testX);
      let totalModelError = 0;
      for (let i = 0; i < testX.length; i++) {
        totalModelError += Math.abs(testY[i] - testPredictions[i]);
      }
      const modelMae = totalModelError / (testX.length || 1);
      const baselineMae =
        testBaselineErrors.reduce((a, b) => a + b, 0) / (testBaselineErrors.length || 1);

      modelMetadata.mlEvaluated = true;
      modelMetadata.modelMae = Math.round(modelMae * 100) / 100;
      modelMetadata.baselineMae = Math.round(baselineMae * 100) / 100;

      // CRITICAL RULE: Do not use trained model if it performs worse than baseline
      if (modelMae < baselineMae) {
        // Use Random Forest prediction for current schedule
        const currentFeatures = extractFeatureVector(schedule);
        const rawMlPrediction = rf.predictSingle(currentFeatures);
        const boundedMl = Math.max(0, Math.min(prep, Math.round(rawMlPrediction)));

        predictedSurplusQuantity = boundedMl;
        predictionMethod = 'machine_learning';
        explanation = `Predicted using trained Random Forest Regressor evaluated against historical outcomes (Test MAE: ${modelMetadata.modelMae} portions vs Baseline MAE: ${modelMetadata.baselineMae}).`;
      } else {
        // Model underperformed baseline -> keep historical baseline
        explanation += ` (ML model evaluated on ${numVerifiedRecords} meals: test MAE ${modelMetadata.modelMae} portions vs baseline ${modelMetadata.baselineMae}; using historical baseline for higher accuracy).`;
      }
    } catch (mlErr) {
      console.warn('ML prediction evaluation encountered fallback to historical baseline:', mlErr);
    }
  } else {
    // Insufficient historical records for ML
    modelMetadata.mlEvaluated = false;
    if (predictionMethod === 'baseline') {
      explanation += ` Initial estimate (Machine Learning activates automatically after ${MEAL_PREDICTION_CONFIG.MIN_RECORDS_FOR_ML} verified meal outcomes are recorded; current: ${numVerifiedRecords}).`;
    } else {
      explanation += ` (Historical baseline active; Machine Learning model activates at ${MEAL_PREDICTION_CONFIG.MIN_RECORDS_FOR_ML} verified records; current: ${numVerifiedRecords}).`;
    }
  }

  // Final sanity clamp: Strictly bounded between 0 and planned meals prepared
  predictedSurplusQuantity = Math.max(0, Math.min(prep, Math.round(predictedSurplusQuantity)));

  return {
    mealScheduleId: schedule._id,
    predictedSurplusQuantity,
    predictionMethod,
    predictionGeneratedAt: new Date().toISOString(),
    sufficientHistoricalData,
    historicalRecordsCount: numVerifiedRecords,
    explanation,
    isEstimate: true,
    modelMetadata
  };
};

export default {
  predictMealSurplus,
  calculateBaselineSurplus,
  calculateHistoricalWeightedSurplus,
  extractFeatureVector,
  RandomForestRegressor,
  MEAL_PREDICTION_CONFIG
};
