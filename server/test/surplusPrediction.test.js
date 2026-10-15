import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validatePredictionInput,
  filterValidHistoricalRecords,
  calculateWeightedHistoricalRate,
  estimateAvailabilityTime,
  determineReliabilityLevel,
  combineDateAndTime,
  generateSurplusPrediction
} from '../src/services/prediction/surplusPrediction.service.js';
import PREDICTION_CONFIG from '../src/config/prediction.config.js';

describe('AI Food Surplus Prediction Engine — Unit Tests', () => {

  describe('1. Input Validation (validatePredictionInput)', () => {
    test('rejects missing required fields', () => {
      const result = validatePredictionInput({});
      assert.equal(result.isValid, false);
      assert.ok(result.errors.length >= 4);
    });

    test('rejects negative or zero planned quantity and attendance', () => {
      const result = validatePredictionInput({
        mealName: 'Lunch Catering',
        foodCategory: 'Vegetarian',
        mealDate: '2026-10-20',
        scheduledStartTime: '12:30',
        expectedAttendance: -10,
        plannedQuantityKg: -5
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('attendance')));
      assert.ok(result.errors.some(e => e.includes('quantity')));
    });

    test('rejects zero planned quantity', () => {
      const result = validatePredictionInput({
        mealName: 'Lunch Catering',
        foodCategory: 'Vegetarian',
        mealDate: '2026-10-20',
        scheduledStartTime: '12:30',
        expectedAttendance: 50,
        plannedQuantityKg: 0
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('Planned food quantity')));
    });

    test('rejects invalid time formats and end time before start time', () => {
      const result = validatePredictionInput({
        mealName: 'Dinner Party',
        foodCategory: 'Non-vegetarian',
        mealDate: '2026-10-20',
        scheduledStartTime: '25:99', // Invalid
        expectedAttendance: 100,
        plannedQuantityKg: 50
      });
      assert.equal(result.isValid, false);
      assert.ok(result.errors.some(e => e.includes('24-hour HH:MM')));

      const invertedTime = validatePredictionInput({
        mealName: 'Dinner Party',
        foodCategory: 'Non-vegetarian',
        mealDate: '2026-10-20',
        scheduledStartTime: '20:00',
        expectedServingEndTime: '19:00', // Before start
        expectedAttendance: 100,
        plannedQuantityKg: 50
      });
      assert.equal(invertedTime.isValid, false);
      assert.ok(invertedTime.errors.some(e => e.includes('after the scheduled start time')));
    });

    test('accepts valid input and returns sanitized data', () => {
      const result = validatePredictionInput({
        mealName: '  Community Lunch Banquet  ',
        mealType: 'Lunch',
        foodCategory: 'Vegetarian',
        mealDate: '2026-10-20',
        scheduledStartTime: '12:30',
        expectedServingEndTime: '14:30',
        expectedAttendance: 150,
        plannedQuantityKg: 75.5
      });
      assert.equal(result.isValid, true);
      assert.equal(result.sanitized.mealName, 'Community Lunch Banquet');
      assert.equal(result.sanitized.expectedAttendance, 150);
      assert.equal(result.sanitized.plannedQuantityKg, 75.5);
    });
  });

  describe('2. Historical Records Filtering (filterValidHistoricalRecords)', () => {
    test('excludes unverified records, data leakage, and out-of-range rates', () => {
      const cutoff = new Date('2026-10-15T00:00:00.000Z');
      const sampleRecords = [
        // Valid past record
        {
          createdAt: new Date('2026-10-10'),
          feedbackStatus: 'submitted',
          plannedQuantityKg: 100,
          actualSurplusKg: 15 // Rate = 0.15 (valid)
        },
        // Unsubmitted feedback (pending) -> MUST BE EXCLUDED
        {
          createdAt: new Date('2026-10-09'),
          feedbackStatus: 'pending',
          plannedQuantityKg: 100,
          actualSurplusKg: 10
        },
        // Future record / data leakage -> MUST BE EXCLUDED
        {
          createdAt: new Date('2026-10-16'),
          feedbackStatus: 'submitted',
          plannedQuantityKg: 100,
          actualSurplusKg: 12
        },
        // Invalid rate > 1 (actual surplus exceeds prepared quantity) -> MUST BE EXCLUDED
        {
          createdAt: new Date('2026-10-08'),
          feedbackStatus: 'submitted',
          plannedQuantityKg: 50,
          actualSurplusKg: 75 // Rate = 1.5
        },
        // Missing or negative actual surplus -> MUST BE EXCLUDED
        {
          createdAt: new Date('2026-10-07'),
          feedbackStatus: 'submitted',
          plannedQuantityKg: 50,
          actualSurplusKg: -5
        },
        // Zero planned quantity -> MUST BE EXCLUDED
        {
          createdAt: new Date('2026-10-06'),
          feedbackStatus: 'submitted',
          plannedQuantityKg: 0,
          actualSurplusKg: 0
        }
      ];

      const valid = filterValidHistoricalRecords(sampleRecords, cutoff);
      assert.equal(valid.length, 1);
      assert.equal(valid[0].actualSurplusKg, 15);
    });
  });

  describe('3. Historical Weighted Rate Calculation', () => {
    test('weights comparable category and meal type more heavily', () => {
      const records = [
        // Category match + MealType match
        {
          foodCategory: 'Vegetarian',
          mealType: 'Lunch',
          expectedAttendance: 100,
          plannedQuantityKg: 50,
          actualSurplusKg: 5, // Rate = 0.10
          mealDate: new Date('2026-10-10')
        },
        // Different category & different meal type
        {
          foodCategory: 'Non-vegetarian',
          mealType: 'Dinner',
          expectedAttendance: 500,
          plannedQuantityKg: 250,
          actualSurplusKg: 50, // Rate = 0.20
          mealDate: new Date('2026-08-01')
        }
      ];

      const currentMeal = {
        foodCategory: 'Vegetarian',
        mealType: 'Lunch',
        expectedAttendance: 100,
        plannedQuantityKg: 50
      };

      const result = calculateWeightedHistoricalRate(records, currentMeal);
      // The vegetarian lunch record has much higher weight, so weighted rate should be closer to 0.10 than 0.20
      assert.ok(result.weightedRate < 0.14, `Expected weighted rate < 0.14, got ${result.weightedRate}`);
      assert.ok(result.weightedRate >= 0.10);
      assert.equal(result.recordCount, 2);
    });

    test('returns null when no valid historical records are provided', () => {
      const result = calculateWeightedHistoricalRate([], {
        foodCategory: 'Vegetarian',
        mealType: 'Lunch'
      });
      assert.equal(result.weightedRate, null);
      assert.equal(result.recordCount, 0);
    });
  });

  describe('4. Availability Time Prediction Rules', () => {
    const mealDate = '2026-10-25';
    const scheduledStartTime = '13:00';

    test('Priority 1: Uses donor specified end time when available', () => {
      const result = estimateAvailabilityTime({
        mealDate,
        scheduledStartTime,
        expectedServingEndTime: '15:30',
        mealType: 'Lunch'
      }, []);

      assert.equal(result.source, 'donor_input');
      assert.equal(result.durationMinutes, 150);
      const expectedDate = combineDateAndTime(mealDate, '15:30');
      assert.equal(result.availabilityTime.getTime(), expectedDate.getTime());
    });

    test('Priority 2: Uses historical median duration when >= 2 valid records exist', () => {
      const historicalRecords = [
        {
          mealDate: '2026-10-01',
          scheduledStartTime: '12:00',
          actualAvailabilityTime: combineDateAndTime('2026-10-01', '13:40') // 100 mins
        },
        {
          mealDate: '2026-10-02',
          scheduledStartTime: '12:00',
          actualAvailabilityTime: combineDateAndTime('2026-10-02', '14:00') // 120 mins
        },
        {
          mealDate: '2026-10-03',
          scheduledStartTime: '12:00',
          actualAvailabilityTime: combineDateAndTime('2026-10-03', '14:20') // 140 mins
        }
      ];

      const result = estimateAvailabilityTime({
        mealDate,
        scheduledStartTime,
        expectedServingEndTime: null,
        mealType: 'Lunch'
      }, historicalRecords);

      assert.equal(result.source, 'historical_median');
      assert.equal(result.durationMinutes, 120); // Median of 100, 120, 140
    });

    test('Priority 3: Falls back to default meal duration when no donor time or history exists', () => {
      const result = estimateAvailabilityTime({
        mealDate,
        scheduledStartTime,
        expectedServingEndTime: null,
        mealType: 'Breakfast'
      }, []);

      assert.equal(result.source, 'default_assumption');
      assert.equal(result.durationMinutes, PREDICTION_CONFIG.DEFAULT_MEAL_DURATIONS_MINUTES.Breakfast); // 90 min
    });
  });

  describe('5. Reliability Assessment (determineReliabilityLevel)', () => {
    test('returns Low for fewer than 3 records (cold-start / limited data)', () => {
      assert.equal(determineReliabilityLevel(0, 0.02), 'Low');
      assert.equal(determineReliabilityLevel(2, 0.01), 'Low');
    });

    test('returns Medium for 3 to 6 records with moderate variance', () => {
      assert.equal(determineReliabilityLevel(4, 0.05), 'Medium');
    });

    test('returns High for 7+ records with low variance', () => {
      assert.equal(determineReliabilityLevel(8, 0.03), 'High');
    });

    test('downgrades to Low if variance is excessively high regardless of sample size', () => {
      assert.equal(determineReliabilityLevel(10, 0.15), 'Low');
    });
  });

  describe('6. Full End-to-End Prediction Scenarios', () => {
    test('Cold-start donor: Triggers baseline fallback without claiming ML training', async () => {
      const input = {
        mealName: 'Welcome Dinner',
        mealType: 'Dinner',
        foodCategory: 'Non-vegetarian',
        mealDate: '2026-10-22',
        scheduledStartTime: '19:30',
        expectedAttendance: 80,
        plannedQuantityKg: 40.0
      };

      // Mock donorId with no previous DB history
      const prediction = await generateSurplusPrediction(input, null);

      assert.equal(prediction.predictionMethod, 'baseline_fallback');
      assert.equal(prediction.reliabilityLevel, 'Low');
      assert.equal(prediction.historicalRecordsUsed, 0);
      assert.equal(prediction.estimatedSurplusRate, PREDICTION_CONFIG.BASELINE_SURPLUS_RATES['Non-vegetarian']);
      // 40 kg * 0.15 = 6.0 kg
      assert.equal(prediction.predictedSurplusKg, 6.0);
      assert.ok(prediction.explanation.includes('Baseline estimate — not yet personalized'));
    });

    test('Predicted surplus strictly stays within [0, plannedQuantityKg]', async () => {
      const input = {
        mealName: 'Hostel Breakfast',
        mealType: 'Breakfast',
        foodCategory: 'Vegetarian',
        mealDate: '2026-10-22',
        scheduledStartTime: '08:00',
        expectedAttendance: 50,
        plannedQuantityKg: 20.0
      };

      const prediction = await generateSurplusPrediction(input, null);
      assert.ok(prediction.predictedSurplusKg >= 0, 'Surplus must be >= 0');
      assert.ok(prediction.predictedSurplusKg <= input.plannedQuantityKg, 'Surplus must not exceed planned quantity');
    });
  });
});
