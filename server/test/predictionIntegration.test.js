import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Prediction from '../src/models/Prediction.js';
import { generateSurplusPrediction } from '../src/services/prediction/surplusPrediction.service.js';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  submitPredictionFeedback
} from '../src/controllers/prediction.controller.js';

describe('Prediction API & Feedback Integration Tests', () => {
  let donorUserA;
  let donorUserB;

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SurplusLink_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up previous test artifacts
    await User.deleteMany({ email: { $in: ['test_donor_a@surpluslink.org', 'test_donor_b@surpluslink.org'] } });

    donorUserA = await User.create({
      name: 'Test Donor A',
      email: 'test_donor_a@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Green Valley Catering',
      contact: '9876543210'
    });

    donorUserB = await User.create({
      name: 'Test Donor B',
      email: 'test_donor_b@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Blue Ocean Banquets',
      contact: '9876543211'
    });

    await Prediction.deleteMany({ donor: { $in: [donorUserA._id, donorUserB._id] } });
  });

  after(async () => {
    if (donorUserA && donorUserB) {
      await Prediction.deleteMany({ donor: { $in: [donorUserA._id, donorUserB._id] } });
      await User.deleteMany({ _id: { $in: [donorUserA._id, donorUserB._id] } });
    }
    await mongoose.disconnect();
  });

  // Helper to simulate Express res object
  const createMockRes = () => {
    const res = {
      statusCode: 200,
      jsonData: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(data) {
        this.jsonData = data;
        return this;
      }
    };
    return res;
  };

  test('Step 1: Donor A generates initial cold-start prediction', async () => {
    const req = {
      user: donorUserA,
      body: {
        mealName: 'Community Lunch Event',
        mealType: 'Lunch',
        foodCategory: 'Vegetarian',
        mealDate: '2026-10-25',
        scheduledStartTime: '12:30',
        expectedAttendance: 100,
        plannedQuantityKg: 60.0
      }
    };
    const res = createMockRes();

    await createPrediction(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.prediction.predictionMethod, 'baseline_fallback');
    assert.equal(res.jsonData.prediction.historicalRecordsUsed, 0);
    assert.equal(res.jsonData.prediction.feedbackStatus, 'pending');

    // Save prediction ID for subsequent steps
    donorUserA.lastPredictionId = res.jsonData.prediction._id;
  });

  test('Step 2: Donor B is blocked from reading Donor A prediction (403)', async () => {
    const req = {
      user: donorUserB, // Different donor
      params: { id: donorUserA.lastPredictionId.toString() }
    };
    const res = createMockRes();

    await getPredictionById(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('Access denied'));
  });

  test('Step 3: Donor B is blocked from submitting feedback on Donor A prediction (403)', async () => {
    const req = {
      user: donorUserB, // Different donor
      params: { id: donorUserA.lastPredictionId.toString() },
      body: {
        actualSurplusKg: 5.0,
        actualAvailabilityTime: '2026-10-25T14:30:00.000Z'
      }
    };
    const res = createMockRes();

    await submitPredictionFeedback(req, res);

    assert.equal(res.statusCode, 403);
    assert.equal(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('Access denied'));
  });

  test('Step 4: Donor A successfully submits outcome feedback after meal', async () => {
    const req = {
      user: donorUserA,
      params: { id: donorUserA.lastPredictionId.toString() },
      body: {
        actualSurplusKg: 6.0, // 6kg surplus from 60kg planned (10% rate)
        actualAvailabilityTime: '2026-10-25T14:30:00.000Z',
        feedbackNotes: 'Meal finished smoothly. Surplus collected on time.'
      }
    };
    const res = createMockRes();

    await submitPredictionFeedback(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.prediction.feedbackStatus, 'submitted');
    assert.equal(res.jsonData.prediction.actualSurplusKg, 6.0);
    assert.equal(res.jsonData.prediction.feedbackNotes, 'Meal finished smoothly. Surplus collected on time.');
  });

  test('Step 5: Subsequent prediction for Donor A automatically incorporates logged feedback', async () => {
    const req = {
      user: donorUserA,
      body: {
        mealName: 'Next Week Lunch',
        mealType: 'Lunch',
        foodCategory: 'Vegetarian',
        mealDate: '2026-11-01',
        scheduledStartTime: '12:30',
        expectedAttendance: 100,
        plannedQuantityKg: 50.0
      }
    };
    const res = createMockRes();

    await createPrediction(req, res);

    assert.equal(res.statusCode, 201);
    assert.equal(res.jsonData.success, true);
    // Now it uses personalized weighted average instead of cold-start baseline fallback!
    assert.equal(res.jsonData.prediction.predictionMethod, 'historical_weighted_average');
    assert.equal(res.jsonData.prediction.historicalRecordsUsed, 1);
    assert.ok(res.jsonData.prediction.explanation.includes('1 verified past meal outcome'));
  });

  test('Step 6: Rejection of invalid feedback quantities (> planned quantity buffer)', async () => {
    const req = {
      user: donorUserA,
      params: { id: donorUserA.lastPredictionId.toString() },
      body: {
        actualSurplusKg: 500.0 // Prepared was 60kg!
      }
    };
    const res = createMockRes();

    await submitPredictionFeedback(req, res);

    assert.equal(res.statusCode, 400);
    assert.equal(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('cannot realistically exceed'));
  });
});
