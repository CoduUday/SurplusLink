import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import MealSchedule from '../src/models/MealSchedule.js';
import MealOutcome from '../src/models/MealOutcome.js';
import {
  predictMealSurplus,
  calculateBaselineSurplus,
  calculateHistoricalWeightedSurplus,
  calculateMenuSimilarity,
  calculateDurationMinutes,
  extractFeatureVector,
  RandomForestRegressor,
  MEAL_PREDICTION_CONFIG
} from '../src/services/prediction/mealSurplusPrediction.service.js';
import {
  getMealSchedules,
  getMealScheduleById,
  getMealSchedulePrediction
} from '../src/controllers/mealSchedule.controller.js';

// Helper to mock express res object
const createMockRes = () => {
  const res = {
    statusCode: null,
    jsonData: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(data) {
      res.jsonData = data;
      return res;
    }
  };
  return res;
};

describe('Feature 2: AI Food Surplus Prediction Engine — Unit & Integration Tests', () => {
  let donorUserA;
  let donorUserB;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SurplusLink_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Cleanup past test data
    await User.deleteMany({ email: { $in: ['donor_pred_a@test.com', 'donor_pred_b@test.com'] } });

    donorUserA = await User.create({
      name: 'Grand Banquet Donor',
      email: 'donor_pred_a@test.com',
      password: 'Password123!',
      role: 'DONOR',
      organization: 'Heritage Banquet Hall',
      contact: '9876543210'
    });

    donorUserB = await User.create({
      name: 'Hostel Dining Hall',
      email: 'donor_pred_b@test.com',
      password: 'Password123!',
      role: 'DONOR',
      organization: 'Campus Dining Service',
      contact: '9876543211'
    });

    await MealOutcome.deleteMany({ donorId: { $in: [donorUserA._id, donorUserB._id] } });
    await MealSchedule.deleteMany({ donorId: { $in: [donorUserA._id, donorUserB._id] } });
  });

  after(async () => {
    if (donorUserA && donorUserB) {
      await MealOutcome.deleteMany({ donorId: { $in: [donorUserA._id, donorUserB._id] } });
      await MealSchedule.deleteMany({ donorId: { $in: [donorUserA._id, donorUserB._id] } });
      await User.deleteMany({ email: { $in: [donorUserA.email, donorUserB.email] } });
    }
  });

  describe('1. Baseline Prediction Strategy (Cases A & B)', () => {
    test('Case A: Standard surplus calculation = max(0, prepared - eating)', () => {
      const schedule = {
        expectedMealsPrepared: 150,
        expectedPeopleEating: 120,
        typicalLeftoverQuantity: null
      };
      const result = calculateBaselineSurplus(schedule);
      assert.equal(result.surplus, 30);
      assert.equal(result.strategy, 'baseline_initial');
    });

    test('Case A: Zero or negative diner deficit strictly yields 0 surplus (never negative)', () => {
      const schedule = {
        expectedMealsPrepared: 100,
        expectedPeopleEating: 120, // Diners exceed prepared
        typicalLeftoverQuantity: null
      };
      const result = calculateBaselineSurplus(schedule);
      assert.equal(result.surplus, 0, 'Surplus must not be negative');
    });

    test('Case B: Conservative adjustment using donor provided typical leftover quantity', () => {
      const schedule = {
        expectedMealsPrepared: 200,
        expectedPeopleEating: 180, // buffer = 20
        typicalLeftoverQuantity: 25
      };
      const result = calculateBaselineSurplus(schedule);
      assert.equal(result.strategy, 'baseline_typical');
      // 0.65 * 25 + 0.35 * 20 = 16.25 + 7 = 23.25 -> 23
      assert.equal(result.surplus, 23);
      assert.ok(result.explanation.includes('typical leftover history'));
    });

    test('Case B: Missing or blank typical leftover safely falls back to Case A', () => {
      const schedule1 = { expectedMealsPrepared: 50, expectedPeopleEating: 40, typicalLeftoverQuantity: '' };
      const schedule2 = { expectedMealsPrepared: 50, expectedPeopleEating: 40, typicalLeftoverQuantity: null };
      assert.equal(calculateBaselineSurplus(schedule1).surplus, 10);
      assert.equal(calculateBaselineSurplus(schedule2).surplus, 10);
    });
  });

  describe('2. Historical Weighted Adjustment (Case C)', () => {
    test('Menu similarity tokenization and Jaccard comparison', () => {
      const menuA = 'Steamed Basmati Rice, Paneer Tikka, Roti, Salad';
      const menuB = 'Jeera Rice, Paneer Butter Masala, Roti, Gulab Jamun';
      const menuC = 'Chicken Biryani, Mutton Kebab, Raitha';

      const simAB = calculateMenuSimilarity(menuA, menuB);
      const simAC = calculateMenuSimilarity(menuA, menuC);

      assert.ok(simAB > 0, 'Shared items (rice, paneer, roti) should produce positive similarity');
      assert.ok(simAB > simAC, 'Paneer meal should be more similar to paneer meal than non-veg biryani');
    });

    test('Weights matching meal type and preparation scale more heavily', () => {
      const currentSchedule = {
        mealType: 'Lunch',
        expectedMealsPrepared: 100,
        expectedPeopleEating: 80,
        menuItems: 'Rice, Dal, Mixed Veg',
        isSpecialEvent: false
      };

      const historical = [
        // Exact Lunch match, similar scale (100 prepared, 15 actual leftover = 15% rate)
        {
          mealType: 'Lunch',
          expectedMealsPrepared: 100,
          expectedPeopleEating: 85,
          menuItems: 'Rice, Dal, Paneer',
          isSpecialEvent: false,
          outcome: { actualLeftoverQuantity: 15 }
        },
        // Breakfast match, completely different meal type and scale
        {
          mealType: 'Breakfast',
          expectedMealsPrepared: 30,
          expectedPeopleEating: 20,
          menuItems: 'Idli, Vada, Chutney',
          isSpecialEvent: true,
          outcome: { actualLeftoverQuantity: 1 }
        }
      ];

      const result = calculateHistoricalWeightedSurplus(currentSchedule, historical);
      assert.ok(result !== null);
      assert.equal(result.recordsUsed, 2);
      // Because Lunch match has higher weight (+2.0 +1.5), weighted rate will be much closer to 15%
      assert.ok(result.rate >= 0.10 && result.rate <= 0.16);
      assert.ok(result.surplus > 0 && result.surplus <= 100);
    });
  });

  describe('3. Random Forest Regressor & ML Upgrade Path (Section 3)', () => {
    test('Extracts feature vector using ONLY pre-meal inputs (No outcome data leakage)', () => {
      const schedule = {
        expectedMealsPrepared: 150,
        expectedPeopleEating: 130,
        mealType: 'Dinner',
        scheduledStartTime: '19:00',
        scheduledEndTime: '21:30',
        menuItems: 'Biryani, Mirchi ka Salan, Raitha',
        isSpecialEvent: true,
        typicalLeftoverQuantity: 15,
        mealDate: '2026-10-25'
      };

      const vec = extractFeatureVector(schedule);
      assert.equal(Array.isArray(vec), true);
      assert.equal(vec[0], 150); // prep
      assert.equal(vec[1], 130); // eating
      assert.equal(vec[2], 20);  // buffer = 150 - 130
      assert.equal(vec[6], 1);   // isDinner = 1
      assert.equal(vec[7], 1);   // isSpecialEvent = 1
      assert.equal(vec[8], 15);  // typicalLeftover
      assert.equal(vec[10], 150);// duration = 2.5 hours = 150 mins
    });

    test('Random Forest Regressor fits and predicts bounded non-negative quantities', () => {
      const rf = new RandomForestRegressor(5, 3, 2);
      const X = [
        [100, 80, 20, 0.8, 0, 1, 0, 0, 20, 1, 120, 1, 3],
        [150, 120, 30, 0.8, 0, 1, 0, 0, 30, 1, 120, 2, 4],
        [200, 160, 40, 0.8, 0, 0, 1, 1, 40, 1, 150, 5, 5],
        [80, 70, 10, 0.875, 1, 0, 0, 0, 10, 1, 90, 0, 2]
      ];
      const y = [18, 28, 42, 8];

      rf.fit(X, y);
      const pred = rf.predictSingle([120, 100, 20, 0.83, 0, 1, 0, 0, 20, 1, 120, 3, 3]);

      assert.ok(typeof pred === 'number');
      assert.ok(pred >= 0, 'Predicted surplus must be non-negative');
      assert.ok(pred <= 120, 'Predicted surplus must not exceed planned prep');
    });
  });

  describe('4. Eligible Meals Lifecycle & Prediction Integration Tests', () => {
    let testScheduleNotStarted;
    let testScheduleInProgress;
    let testScheduleCompleted;

    before(async () => {
      // Create Schedule 1: Not Started (Eligible)
      testScheduleNotStarted = await MealSchedule.create({
        donorId: donorUserA._id,
        mealDate: '2026-10-25',
        mealType: 'Lunch',
        scheduledStartTime: '12:30',
        scheduledEndTime: '14:30',
        expectedMealsPrepared: 120,
        expectedPeopleEating: 95,
        menuItems: 'Steamed Rice, Dal Fry, Seasonal Subzi',
        isSpecialEvent: false,
        typicalLeftoverQuantity: 20,
        preparationStatus: 'Not Started'
      });

      // Create Schedule 2: In Progress (Eligible)
      testScheduleInProgress = await MealSchedule.create({
        donorId: donorUserA._id,
        mealDate: '2026-10-25',
        mealType: 'Dinner',
        scheduledStartTime: '19:30',
        scheduledEndTime: '22:00',
        expectedMealsPrepared: 200,
        expectedPeopleEating: 170,
        menuItems: 'Paneer Pulao, Chapati, Dal Makhani',
        isSpecialEvent: true,
        typicalLeftoverQuantity: null,
        preparationStatus: 'In Progress'
      });

      // Create Schedule 3: Completed with Actual Outcome (Ineligible for active prediction)
      testScheduleCompleted = await MealSchedule.create({
        donorId: donorUserA._id,
        mealDate: '2026-10-20',
        mealType: 'Lunch',
        scheduledStartTime: '12:00',
        scheduledEndTime: '14:00',
        expectedMealsPrepared: 100,
        expectedPeopleEating: 80,
        menuItems: 'Khichdi, Kadhi, Papad',
        isSpecialEvent: false,
        typicalLeftoverQuantity: 15,
        preparationStatus: 'Completed'
      });

      await MealOutcome.create({
        mealScheduleId: testScheduleCompleted._id,
        donorId: donorUserA._id,
        actualMealsServed: 78,
        actualLeftoverQuantity: 18,
        actualMealEndTime: '14:15',
        foodReadyForPickup: true
      });
    });

    test('Endpoint: GET /api/meal-schedules enriches eligible meals with predictedSurplusQuantity', async () => {
      const req = { user: donorUserA };
      const res = createMockRes();

      await getMealSchedules(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.ok(res.jsonData.data.length >= 3);

      const notStarted = res.jsonData.data.find(
        (s) => s._id.toString() === testScheduleNotStarted._id.toString()
      );
      assert.ok(notStarted, 'Not Started schedule should be returned');
      assert.ok(notStarted.prediction, 'Eligible Not Started meal must have prediction');
      assert.ok(
        typeof notStarted.prediction.predictedSurplusQuantity === 'number',
        'Must output predictedSurplusQuantity portion count'
      );
      assert.ok(notStarted.prediction.predictedSurplusQuantity >= 0);
      assert.ok(notStarted.prediction.isEstimate === true);

      const inProgress = res.jsonData.data.find(
        (s) => s._id.toString() === testScheduleInProgress._id.toString()
      );
      assert.ok(inProgress, 'In Progress schedule should be returned');
      assert.ok(inProgress.prediction, 'Eligible In Progress meal must have prediction');

      const completed = res.jsonData.data.find(
        (s) => s._id.toString() === testScheduleCompleted._id.toString()
      );
      assert.ok(completed, 'Completed schedule should be returned');
      assert.equal(
        completed.prediction,
        null,
        'Completed / outcome-recorded meal must NOT have an active prediction'
      );
    });

    test('Endpoint: GET /api/meal-schedules/:id/prediction returns prediction for eligible meal', async () => {
      const req = {
        user: donorUserA,
        params: { id: testScheduleNotStarted._id.toString() }
      };
      const res = createMockRes();

      await getMealSchedulePrediction(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.isEligible, true);
      assert.ok(res.jsonData.prediction);
      assert.equal(res.jsonData.prediction.mealScheduleId.toString(), testScheduleNotStarted._id.toString());
      assert.ok(res.jsonData.prediction.predictionMethod);
      assert.ok(res.jsonData.prediction.explanation);
    });

    test('Endpoint: GET /api/meal-schedules/:id/prediction handles completed meal gracefully without active prediction', async () => {
      const req = {
        user: donorUserA,
        params: { id: testScheduleCompleted._id.toString() }
      };
      const res = createMockRes();

      await getMealSchedulePrediction(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.isEligible, false);
      assert.ok(res.jsonData.message.includes('Completed') || res.jsonData.message.includes('recorded'));
      assert.equal(res.jsonData.actualOutcome.actualLeftoverQuantity, 18);
    });

    test('Security & Isolation: Donor B is blocked from retrieving Donor A schedule prediction (404)', async () => {
      const req = {
        user: donorUserB, // Different donor
        params: { id: testScheduleNotStarted._id.toString() }
      };
      const res = createMockRes();

      await getMealSchedulePrediction(req, res);

      assert.equal(res.statusCode, 404);
      assert.equal(res.jsonData.success, false);
    });
  });
});
