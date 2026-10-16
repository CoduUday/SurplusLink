import Prediction from '../../models/Prediction.js';
import PREDICTION_CONFIG from '../../config/prediction.config.js';

/**
 * Parses a date string and time string (HH:MM) into a local Date instance
 * without inadvertent UTC date shifts.
 * 
 * @param {string|Date} dateInput - YYYY-MM-DD or Date object
 * @param {string} timeString - HH:MM in 24-hour format
 * @returns {Date}
 */
export const combineDateAndTime = (dateInput, timeString) => {
  let year, month, day;

  if (dateInput instanceof Date) {
    year = dateInput.getFullYear();
    month = dateInput.getMonth();
    day = dateInput.getDate();
  } else {
    const dateParts = String(dateInput).split('T')[0].split('-');
    if (dateParts.length !== 3) {
      throw new Error(`Invalid date format: ${dateInput}. Expected YYYY-MM-DD.`);
    }
    year = parseInt(dateParts[0], 10);
    month = parseInt(dateParts[1], 10) - 1; // 0-indexed
    day = parseInt(dateParts[2], 10);
  }

  const [hoursStr, minutesStr] = String(timeString).split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    throw new Error(`Invalid time format: ${timeString}. Expected 24-hour HH:MM.`);
  }

  const result = new Date(year, month, day, hours, minutes, 0, 0);
  return result;
};

/**
 * Validates the raw input parameters for a surplus prediction request.
 * 
 * @param {Object} input
 * @returns {{isValid: boolean, errors: string[], sanitized: Object}}
 */
export const validatePredictionInput = (input) => {
  const errors = [];
  const {
    mealName,
    mealType = 'Lunch',
    foodCategory,
    mealDate,
    scheduledStartTime,
    expectedServingEndTime,
    expectedAttendance,
    plannedQuantityKg
  } = input || {};

  // Required field checks
  if (!mealName || typeof mealName !== 'string' || !mealName.trim()) {
    errors.push('Meal or event name is required.');
  } else if (mealName.trim().length > 120) {
    errors.push('Meal name cannot exceed 120 characters.');
  }

  const validCategories = ['Vegetarian', 'Non-vegetarian', 'Mixed'];
  if (!foodCategory || !validCategories.includes(foodCategory)) {
    errors.push(`Food category must be one of: ${validCategories.join(', ')}.`);
  }

  const validMealTypes = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Wedding',
    'College Event',
    'Corporate Event',
    'Other'
  ];
  if (mealType && !validMealTypes.includes(mealType)) {
    errors.push(`Meal type must be one of: ${validMealTypes.join(', ')}.`);
  }

  // Date validation
  if (!mealDate) {
    errors.push('Meal date is required.');
  } else {
    const parsedDate = new Date(mealDate);
    if (isNaN(parsedDate.getTime())) {
      errors.push('Invalid meal date provided.');
    }
  }

  // Time format validations
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!scheduledStartTime || !timeRegex.test(scheduledStartTime)) {
    errors.push('Scheduled start time is required in 24-hour HH:MM format (e.g. 13:00).');
  }

  if (expectedServingEndTime && !timeRegex.test(expectedServingEndTime)) {
    errors.push('Expected serving end time must be in 24-hour HH:MM format (e.g. 15:00).');
  }

  // Attendance validation
  const numAttendance = Number(expectedAttendance);
  if (
    expectedAttendance === undefined ||
    expectedAttendance === null ||
    isNaN(numAttendance) ||
    !Number.isInteger(numAttendance) ||
    numAttendance < PREDICTION_CONFIG.LIMITS.MIN_ATTENDANCE
  ) {
    errors.push(
      `Expected attendance must be a whole number of at least ${PREDICTION_CONFIG.LIMITS.MIN_ATTENDANCE}.`
    );
  } else if (numAttendance > PREDICTION_CONFIG.LIMITS.MAX_ATTENDANCE) {
    errors.push(`Expected attendance cannot exceed ${PREDICTION_CONFIG.LIMITS.MAX_ATTENDANCE}.`);
  }

  // Planned quantity validation
  const numQuantity = Number(plannedQuantityKg);
  if (
    plannedQuantityKg === undefined ||
    plannedQuantityKg === null ||
    isNaN(numQuantity) ||
    numQuantity < PREDICTION_CONFIG.LIMITS.MIN_PLANNED_QUANTITY_KG
  ) {
    errors.push(
      `Planned food quantity must be at least ${PREDICTION_CONFIG.LIMITS.MIN_PLANNED_QUANTITY_KG} kg.`
    );
  } else if (numQuantity > PREDICTION_CONFIG.LIMITS.MAX_PLANNED_QUANTITY_KG) {
    errors.push(
      `Planned food quantity cannot exceed ${PREDICTION_CONFIG.LIMITS.MAX_PLANNED_QUANTITY_KG} kg.`
    );
  }

  // Chronological sanity check: end time must not be earlier than start time on same day
  if (scheduledStartTime && expectedServingEndTime && errors.length === 0) {
    const [startH, startM] = scheduledStartTime.split(':').map(Number);
    const [endH, endM] = expectedServingEndTime.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (endMinutes <= startMinutes) {
      errors.push('Expected serving end time must be after the scheduled start time.');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? {
      mealName: mealName.trim(),
      mealType: mealType || 'Lunch',
      foodCategory,
      mealDate: new Date(mealDate),
      scheduledStartTime,
      expectedServingEndTime: expectedServingEndTime || null,
      expectedAttendance: numAttendance,
      plannedQuantityKg: Math.round(numQuantity * 100) / 100
    } : null
  };
};

/**
 * Filters and validates historical records.
 * Excludes records with missing actual surplus, negative quantities,
 * or surplus rates outside [0, 1].
 *
 * @param {Array} rawRecords - Raw prediction documents from database
 * @param {Date} cutoffDate - Maximum allowable timestamp (prevent data leakage)
 * @returns {Array} Validated historical records
 */
export const filterValidHistoricalRecords = (rawRecords, cutoffDate = new Date()) => {
  if (!Array.isArray(rawRecords)) return [];

  return rawRecords.filter((record) => {
    // 1. Must have had feedback submitted
    if (record.feedbackStatus !== 'submitted') return false;

    // 2. Must not leak future outcomes or the current prediction
    const recordTimestamp = record.createdAt ? new Date(record.createdAt) : new Date(record.mealDate);
    if (recordTimestamp >= cutoffDate) return false;

    // 3. Must have valid planned and actual quantities
    const planned = Number(record.plannedQuantityKg);
    const actual = Number(record.actualSurplusKg);

    if (isNaN(planned) || planned <= 0) return false;
    if (isNaN(actual) || actual < 0) return false;

    // 4. Rate must be strictly within [0, 1]
    const rate = actual / planned;
    if (rate < 0 || rate > 1) return false;

    return true;
  });
};

/**
 * Calculates a weighted historical surplus rate and measure of consistency.
 * 
 * Weighting rules:
 * - Base weight = 1.0
 * - Category match (+2.0): Cuisines (veg vs non-veg) have distinct preparation buffers and shelf-life.
 * - Meal type match (+2.0): Lunches behave differently from Dinners or Weddings.
 * - Attendance similarity (+1.5): If attendance is within +/- 25% of current meal.
 * - Quantity similarity (+1.0): If planned quantity is within +/- 30% of current meal.
 * - Recency boost (+0.0 to +1.0): Events within the last 60 days receive a recency boost.
 * 
 * @param {Array} validRecords
 * @param {Object} currentMeal
 * @returns {{weightedRate: number, recordCount: number, variance: number, stdDev: number, avgPerPersonKg: number|null}}
 */
export const calculateWeightedHistoricalRate = (validRecords, currentMeal) => {
  if (!validRecords || validRecords.length === 0) {
    return {
      weightedRate: null,
      recordCount: 0,
      variance: 0,
      stdDev: 0,
      avgPerPersonKg: null
    };
  }

  const { foodCategory, mealType, expectedAttendance, plannedQuantityKg } = currentMeal;
  const now = new Date();

  let totalWeightedRate = 0;
  let totalWeights = 0;
  const ratesWithWeights = [];
  let totalPerPersonKg = 0;
  let perPersonCount = 0;

  for (const record of validRecords) {
    const planned = Number(record.plannedQuantityKg);
    const actual = Number(record.actualSurplusKg);
    const rate = actual / planned;

    let weight = PREDICTION_CONFIG.WEIGHTS.BASE;

    // Food category match
    if (record.foodCategory === foodCategory) {
      weight += PREDICTION_CONFIG.WEIGHTS.CATEGORY_MATCH;
    }

    // Meal type match
    if (record.mealType === mealType) {
      weight += PREDICTION_CONFIG.WEIGHTS.MEAL_TYPE_MATCH;
    }

    // Attendance similarity (+/- 25%)
    if (record.expectedAttendance && expectedAttendance) {
      const attRatio = Math.abs(record.expectedAttendance - expectedAttendance) / expectedAttendance;
      if (attRatio <= 0.25) {
        weight += PREDICTION_CONFIG.WEIGHTS.ATTENDANCE_SIMILAR;
      }
    }

    // Quantity similarity (+/- 30%)
    const qtyRatio = Math.abs(planned - plannedQuantityKg) / plannedQuantityKg;
    if (qtyRatio <= 0.3) {
      weight += PREDICTION_CONFIG.WEIGHTS.QUANTITY_SIMILAR;
    }

    // Recency boost (within 60 days)
    const mealDate = new Date(record.mealDate || record.createdAt);
    const daysAgo = Math.max(0, (now.getTime() - mealDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysAgo <= 60) {
      const recencyBoost = (1 - daysAgo / 60) * PREDICTION_CONFIG.WEIGHTS.MAX_RECENCY_BOOST;
      weight += recencyBoost;
    }

    totalWeightedRate += rate * weight;
    totalWeights += weight;
    ratesWithWeights.push({ rate, weight });

    // Track historical consumption per attendee: (planned - actual) / attendance
    if (record.expectedAttendance && record.expectedAttendance > 0) {
      const consumedKg = Math.max(0, planned - actual);
      const perPerson = consumedKg / record.expectedAttendance;
      if (
        perPerson >= PREDICTION_CONFIG.CONSUMPTION_BOUNDS_KG.MIN_PER_PERSON &&
        perPerson <= PREDICTION_CONFIG.CONSUMPTION_BOUNDS_KG.MAX_PER_PERSON
      ) {
        totalPerPersonKg += perPerson;
        perPersonCount++;
      }
    }
  }

  const weightedRate = totalWeights > 0 ? totalWeightedRate / totalWeights : 0;

  // Calculate weighted variance to evaluate consistency
  let weightedVariance = 0;
  if (totalWeights > 0) {
    let sumSquaredDiff = 0;
    for (const item of ratesWithWeights) {
      sumSquaredDiff += item.weight * Math.pow(item.rate - weightedRate, 2);
    }
    weightedVariance = sumSquaredDiff / totalWeights;
  }
  const stdDev = Math.sqrt(weightedVariance);

  return {
    weightedRate: Math.max(0, Math.min(1, weightedRate)),
    recordCount: validRecords.length,
    variance: Math.round(weightedVariance * 10000) / 10000,
    stdDev: Math.round(stdDev * 10000) / 10000,
    avgPerPersonKg: perPersonCount > 0 ? totalPerPersonKg / perPersonCount : null
  };
};

/**
 * Estimates surplus availability time based on priority rules:
 * 1. Expected serving end time explicitly provided by donor.
 * 2. Historical median serving duration for comparable meals if sufficient records exist.
 * 3. Configurable default duration by meal type.
 * 
 * @param {Object} input - Sanitized prediction input
 * @param {Array} validHistoricalRecords - Validated historical records
 * @returns {{availabilityTime: Date, source: string, durationMinutes: number}}
 */
export const estimateAvailabilityTime = (input, validHistoricalRecords = []) => {
  const { mealDate, scheduledStartTime, expectedServingEndTime, mealType } = input;
  const startDateTime = combineDateAndTime(mealDate, scheduledStartTime);

  // Rule 1: Priority to explicit donor input
  if (expectedServingEndTime) {
    const endDateTime = combineDateAndTime(mealDate, expectedServingEndTime);
    const durationMinutes = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60));

    return {
      availabilityTime: endDateTime,
      source: 'donor_input',
      durationMinutes: Math.max(0, durationMinutes)
    };
  }

  // Rule 2: Historical median serving duration if at least 2 comparable records with actual availability exist
  const historicalDurations = [];
  for (const record of validHistoricalRecords) {
    if (record.actualAvailabilityTime && record.scheduledStartTime && record.mealDate) {
      try {
        const histStart = combineDateAndTime(record.mealDate, record.scheduledStartTime);
        const histEnd = new Date(record.actualAvailabilityTime);
        const durationMin = Math.round((histEnd.getTime() - histStart.getTime()) / (1000 * 60));
        if (
          durationMin >= PREDICTION_CONFIG.MIN_SERVE_DURATION_MINUTES &&
          durationMin <= PREDICTION_CONFIG.MAX_SERVE_DURATION_MINUTES
        ) {
          historicalDurations.push(durationMin);
        }
      } catch (err) {
        // Skip unparseable record
      }
    }
  }

  if (historicalDurations.length >= 2) {
    // Sort and calculate median
    historicalDurations.sort((a, b) => a - b);
    const mid = Math.floor(historicalDurations.length / 2);
    const medianMinutes =
      historicalDurations.length % 2 !== 0
        ? historicalDurations[mid]
        : Math.round((historicalDurations[mid - 1] + historicalDurations[mid]) / 2);

    const calculatedTime = new Date(startDateTime.getTime() + medianMinutes * 60 * 1000);
    return {
      availabilityTime: calculatedTime,
      source: 'historical_median',
      durationMinutes: medianMinutes
    };
  }

  // Rule 3: Configurable default duration by meal type
  const defaultMinutes =
    PREDICTION_CONFIG.DEFAULT_MEAL_DURATIONS_MINUTES[mealType] ||
    PREDICTION_CONFIG.DEFAULT_MEAL_DURATIONS_MINUTES.Other;

  const calculatedTime = new Date(startDateTime.getTime() + defaultMinutes * 60 * 1000);
  return {
    availabilityTime: calculatedTime,
    source: 'default_assumption',
    durationMinutes: defaultMinutes
  };
};

/**
 * Determines prediction reliability based on record quantity and outcome consistency.
 * 
 * @param {number} recordCount
 * @param {number} stdDev
 * @returns {'Low' | 'Medium' | 'High'}
 */
export const determineReliabilityLevel = (recordCount, stdDev) => {
  // Low reliability: Cold start (< 3 records) or high inconsistency
  if (recordCount < PREDICTION_CONFIG.LIMITED_DATA_THRESHOLD) {
    return 'Low';
  }

  // High reliability: Sufficient records (>= 7) and low variability
  if (
    recordCount >= PREDICTION_CONFIG.HIGH_CONFIDENCE_THRESHOLD &&
    stdDev <= PREDICTION_CONFIG.MAX_VARIANCE_FOR_HIGH_RELIABILITY
  ) {
    return 'High';
  }

  // If variance is high, downgrade to Low
  if (stdDev > PREDICTION_CONFIG.MAX_VARIANCE_FOR_MEDIUM_RELIABILITY) {
    return 'Low';
  }

  // Moderate history (3-6 records) or moderate variance
  return 'Medium';
};

/**
 * Core Surplus Prediction Engine.
 * Generates an explainable, bounded prediction for a food donor's upcoming meal.
 * 
 * @param {Object} rawInput - Form submission from donor
 * @param {string|mongoose.Types.ObjectId} donorId - Authenticated donor user ID
 * @returns {Promise<Object>} Complete prediction payload ready for persistence
 */
export const generateSurplusPrediction = async (rawInput, donorId) => {
  // 1. Validate inputs
  const validation = validatePredictionInput(rawInput);
  if (!validation.isValid) {
    const error = new Error(`Input validation failed: ${validation.errors.join(' ')}`);
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const currentMeal = validation.sanitized;

  // 2. Query historical records for this donor
  // Query only records with submitted actual surplus, created before now (prevents leakage)
  let rawHistoricalRecords = [];
  if (donorId) {
    rawHistoricalRecords = await Prediction.find({
      donor: donorId,
      feedbackStatus: 'submitted',
      actualSurplusKg: { $ne: null }
    }).sort({ mealDate: -1 }).limit(100).lean();
  }

  // 3. Filter valid historical records
  const validHistorical = filterValidHistoricalRecords(rawHistoricalRecords, new Date());
  const hasHistory = validHistorical.length >= PREDICTION_CONFIG.MIN_HISTORICAL_RECORDS_FOR_PERSONALIZATION;

  let estimatedSurplusRate;
  let predictionMethod;
  let reliabilityLevel;
  let historicalVariance = 0;
  let historicalStdDev = 0;
  let explanation = '';
  const assumptions = [];

  if (hasHistory) {
    // Personalized Historical Prediction
    const analysis = calculateWeightedHistoricalRate(validHistorical, currentMeal);
    let finalRate = analysis.weightedRate;
    historicalVariance = analysis.variance;
    historicalStdDev = analysis.stdDev;
    predictionMethod = 'historical_weighted_average';
    reliabilityLevel = determineReliabilityLevel(analysis.recordCount, historicalStdDev);

    // Complementary consumption sanity check
    if (analysis.avgPerPersonKg && currentMeal.expectedAttendance > 0) {
      const estimatedConsumptionKg = currentMeal.expectedAttendance * analysis.avgPerPersonKg;
      const expectedSurplusFromAttendance = Math.max(0, currentMeal.plannedQuantityKg - estimatedConsumptionKg);
      const consumptionImpliedRate = Math.max(0, Math.min(1, expectedSurplusFromAttendance / currentMeal.plannedQuantityKg));

      // Blend 70% weighted historical rate + 30% attendance-consumption rate
      finalRate = 0.7 * finalRate + 0.3 * consumptionImpliedRate;
      assumptions.push(
        `Attendance consumption factor: incorporates historical average consumption of ${analysis.avgPerPersonKg.toFixed(2)} kg per attendee.`
      );
    }

    estimatedSurplusRate = Math.max(0, Math.min(1, finalRate));

    if (analysis.recordCount < PREDICTION_CONFIG.LIMITED_DATA_THRESHOLD) {
      explanation = `Estimate is based on a limited history of ${analysis.recordCount} verified past meal outcome(s) for ${currentMeal.foodCategory} / ${currentMeal.mealType}.`;
      assumptions.push('Limited historical records; estimate will become more precise as more meal feedback is logged.');
    } else {
      explanation = `Personalized prediction calculated from ${analysis.recordCount} historical meals with comparable category (${currentMeal.foodCategory}), meal type (${currentMeal.mealType}), and attendance scale.`;
      assumptions.push(
        `Historical surplus rate consistency (standard deviation): ${(historicalStdDev * 100).toFixed(1)}%.`
      );
    }
  } else {
    // Cold-Start Baseline Fallback
    predictionMethod = 'baseline_fallback';
    reliabilityLevel = 'Low';
    estimatedSurplusRate =
      PREDICTION_CONFIG.BASELINE_SURPLUS_RATES[currentMeal.foodCategory] ||
      PREDICTION_CONFIG.BASELINE_SURPLUS_RATES.DEFAULT;

    explanation = `Baseline estimate — not yet personalized. As a first-time donor or new meal category, this forecast uses the standard institutional benchmark (${(estimatedSurplusRate * 100).toFixed(0)}%) for ${currentMeal.foodCategory} catering.`;
    assumptions.push('No historical donor feedback available yet; baseline catering surplus benchmarks applied.');
    assumptions.push('Future predictions will automatically adapt once actual meal outcomes are recorded.');
  }

  // 4. Calculate predicted surplus quantity with strict boundary enforcement
  let calculatedSurplusKg = currentMeal.plannedQuantityKg * estimatedSurplusRate;
  // Bounded between 0 and plannedQuantityKg
  calculatedSurplusKg = Math.max(0, Math.min(currentMeal.plannedQuantityKg, calculatedSurplusKg));
  const roundedSurplusKg = Math.round(calculatedSurplusKg * 100) / 100;

  // 5. Estimate Availability Time
  const availability = estimateAvailabilityTime(currentMeal, validHistorical);

  if (availability.source === 'donor_input') {
    assumptions.push(`Availability time based on donor's specified meal end time (${currentMeal.expectedServingEndTime}).`);
  } else if (availability.source === 'historical_median') {
    assumptions.push(`Availability time estimated from historical median serving duration of ${availability.durationMinutes} minutes.`);
  } else {
    assumptions.push(`Availability time estimated using standard ${currentMeal.mealType} duration of ${availability.durationMinutes} minutes.`);
  }

  assumptions.push('Actual surplus and availability may vary based on attendance and real-time consumption.');

  // 6. Return structured prediction result
  return {
    donor: donorId,
    mealName: currentMeal.mealName,
    mealType: currentMeal.mealType,
    foodCategory: currentMeal.foodCategory,
    mealDate: currentMeal.mealDate,
    scheduledStartTime: currentMeal.scheduledStartTime,
    expectedServingEndTime: currentMeal.expectedServingEndTime,
    expectedAttendance: currentMeal.expectedAttendance,
    plannedQuantityKg: currentMeal.plannedQuantityKg,
    predictedSurplusKg: roundedSurplusKg,
    estimatedSurplusRate: Math.round(estimatedSurplusRate * 1000) / 1000,
    predictedAvailabilityTime: availability.availabilityTime,
    availabilityTimeSource: availability.source,
    predictionMethod,
    reliabilityLevel,
    historicalRecordsUsed: validHistorical.length,
    historicalVariance,
    modelVersion: PREDICTION_CONFIG.MODEL_VERSION,
    explanation,
    assumptions,
    feedbackStatus: 'pending'
  };
};

export default {
  validatePredictionInput,
  filterValidHistoricalRecords,
  calculateWeightedHistoricalRate,
  estimateAvailabilityTime,
  determineReliabilityLevel,
  generateSurplusPrediction,
  combineDateAndTime
};
