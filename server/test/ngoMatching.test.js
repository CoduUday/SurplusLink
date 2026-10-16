import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Donation from '../src/models/Donation.js';
import {
  calculateHaversineDistanceKm,
  scoreProximity,
  scoreCapacity,
  scoreOperatingSchedule,
  scoreFoodCompatibility,
  calculateNgoMatchScore,
  checkNgoEligibility,
  getRankedNgosForDonation,
  getRankedDonationsForNgo,
  DEFAULT_MATCHING_WEIGHTS
} from '../src/services/matching/ngoMatching.service.js';
import {
  getRecommendedNgos,
  getRecommendedDonations
} from '../src/controllers/matching.controller.js';

describe('Feature 4: Smart NGO Matching — Unit & Integration Tests', () => {
  let donorA;
  let donorB;
  let ngoA; // nearby, large capacity, veg
  let ngoB; // medium distance, small capacity, veg
  let ngoC; // far distance, non-veg only
  let ngoInactive; // inactive
  let validDonation;

  const createMockRes = () => {
    return {
      statusCode: null,
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
  };

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SurplusLink_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up any test users
    await User.deleteMany({
      email: {
        $in: [
          'test_donor_4a@surpluslink.org',
          'test_donor_4b@surpluslink.org',
          'test_ngo_4a@surpluslink.org',
          'test_ngo_4b@surpluslink.org',
          'test_ngo_4c@surpluslink.org',
          'test_ngo_inactive@surpluslink.org'
        ]
      }
    });

    donorA = await User.create({
      name: 'Chef Gordon',
      email: 'test_donor_4a@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Gordon Kitchens',
      contact: '+91 91000 11111',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716] // Bangalore Central
      }
    });

    donorB = await User.create({
      name: 'Chef Bobby',
      email: 'test_donor_4b@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Bobby Grills',
      contact: '+91 91000 22222',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716]
      }
    });

    // NGO A: ~1.5 km away, capacity 200, accepts VEGETARIAN, open 9-18
    ngoA = await User.create({
      name: 'Sister Teresa',
      email: 'test_ngo_4a@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Care & Nourish NGO',
      contact: '+91 99000 11111',
      location: {
        type: 'Point',
        coordinates: [77.6000, 12.9800] // ~1.3 km away
      },
      serviceRadiusKm: 15,
      servingCapacity: 200,
      acceptedFoodTypes: ['VEGETARIAN', 'NON_VEGETARIAN'],
      acceptedCategories: ['Cooked Meals', 'Bakery & Bread'],
      operatingHours: { start: '08:00', end: '20:00', days: ['All'] },
      isActive: true,
      isAvailable: true
    });

    // NGO B: ~4 km away, capacity 40, accepts only VEGETARIAN
    ngoB = await User.create({
      name: 'Brother Leo',
      email: 'test_ngo_4b@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Meals For Hope',
      contact: '+91 99000 22222',
      location: {
        type: 'Point',
        coordinates: [77.6300, 12.9700] // ~3.8 km away
      },
      serviceRadiusKm: 10,
      servingCapacity: 40,
      acceptedFoodTypes: ['VEGETARIAN'],
      acceptedCategories: [],
      operatingHours: { start: '09:00', end: '18:00', days: ['Mon-Fri'] },
      isActive: true,
      isAvailable: true
    });

    // NGO C: ~25 km away (outside typical 20km radius), strictly NON_VEGETARIAN
    ngoC = await User.create({
      name: 'Captain Dan',
      email: 'test_ngo_4c@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Farway Shelter',
      contact: '+91 99000 33333',
      location: {
        type: 'Point',
        coordinates: [77.8000, 13.1000] // ~26 km away
      },
      serviceRadiusKm: 10, // Stricter 10km radius
      servingCapacity: 100,
      acceptedFoodTypes: ['NON_VEGETARIAN'], // Strictly non-veg
      isActive: true,
      isAvailable: true
    });

    // Inactive NGO
    ngoInactive = await User.create({
      name: 'Suspended Shelter',
      email: 'test_ngo_inactive@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Inactive Foundation',
      contact: '+91 99000 44444',
      location: {
        type: 'Point',
        coordinates: [77.5950, 12.9720]
      },
      isActive: false
    });

    await Donation.deleteMany({ donor: { $in: [donorA._id, donorB._id] } });

    validDonation = await Donation.create({
      donor: donorA._id,
      foodName: 'Hot Veg Biryani & Curry',
      category: 'Cooked Meals',
      quantity: 20,
      quantityUnit: 'kg',
      foodType: 'VEGETARIAN',
      servings: 50,
      location: {
        address: 'MG Road, Bangalore',
        coordinates: [77.5946, 12.9716]
      },
      pickupDeadline: new Date(Date.now() + 18000000), // 5 hours in future
      contactPerson: 'Gordon',
      contactPhone: '9100011111',
      status: 'AVAILABLE'
    });
  });

  after(async () => {
    if (donorA && donorB) {
      await Donation.deleteMany({ donor: { $in: [donorA._id, donorB._id] } });
      await User.deleteMany({
        _id: { $in: [donorA._id, donorB._id, ngoA._id, ngoB._id, ngoC._id, ngoInactive._id] }
      });
    }
    await mongoose.disconnect();
  });

  describe('1. Haversine Distance Calculations', () => {
    test('accurately calculates distance between Bangalore and Mysore (~128 km)', () => {
      // Bangalore: [77.5946, 12.9716]
      // Mysore: [76.6394, 12.2958]
      const dist = calculateHaversineDistanceKm([77.5946, 12.9716], [76.6394, 12.2958]);
      assert.ok(dist >= 125 && dist <= 135, `Distance was ${dist}`);
    });

    test('calculates short distance in city coordinates (~1.3 km)', () => {
      const dist = calculateHaversineDistanceKm([77.5946, 12.9716], [77.6000, 12.9800]);
      assert.ok(dist >= 1.0 && dist <= 1.8, `Distance was ${dist}`);
    });

    test('returns null for missing, non-numeric, or out-of-range coordinates', () => {
      assert.equal(calculateHaversineDistanceKm(null, [77.5946, 12.9716]), null);
      assert.equal(calculateHaversineDistanceKm([77.5946, 12.9716], null), null);
      assert.equal(calculateHaversineDistanceKm([999, 12.9716], [77.5946, 12.9716]), null);
      assert.equal(calculateHaversineDistanceKm([0, 0], [77.5946, 12.9716]), null);
    });
  });

  describe('2. Score Calculation & Weight Totals', () => {
    test('weights sum exactly to 100 points', () => {
      const totalWeights =
        DEFAULT_MATCHING_WEIGHTS.proximity +
        DEFAULT_MATCHING_WEIGHTS.capacity +
        DEFAULT_MATCHING_WEIGHTS.schedule +
        DEFAULT_MATCHING_WEIGHTS.foodCompatibility;
      assert.equal(totalWeights, 100);
    });

    test('proximity scores bands award correct points', () => {
      assert.equal(scoreProximity(1.5).score, 35); // 0-2 km
      assert.equal(scoreProximity(3.5).score, 28); // 2-5 km
      assert.equal(scoreProximity(8.0).score, 20); // 5-10 km
      assert.equal(scoreProximity(15.0).score, 10); // 10-20 km
    });

    test('capacity scoring differentiates sufficient vs insufficient capacity', () => {
      // 50 servings vs 200 capacity -> sufficient (25)
      const sufficient = scoreCapacity(50, 200);
      assert.equal(sufficient.score, 25);
      assert.equal(sufficient.status, 'SUFFICIENT');

      // 50 servings vs 30 capacity -> partial (ratio 0.6 -> ~11)
      const partial = scoreCapacity(50, 30);
      assert.ok(partial.score <= 15);
      assert.equal(partial.status, 'PARTIAL');
    });

    test('missing NGO capacity assigns neutral score and flags honest warning', () => {
      const unknown = scoreCapacity(50, 0);
      assert.equal(unknown.score, 13); // Math.round(25 * 0.5)
      assert.equal(unknown.status, 'UNKNOWN');
      assert.ok(unknown.warning.includes('not available'));
    });

    test('unknown operating schedule assigns neutral score and flags uncertainty', () => {
      const futureDeadline = new Date(Date.now() + 18000000);
      const res = scoreOperatingSchedule(futureDeadline, {}, 2.0);
      assert.equal(res.score, 10); // 50% of 20
      assert.equal(res.status, 'UNKNOWN');
      assert.ok(res.warning.includes('not specified'));
    });
  });

  describe('3. Eligibility & Exclusion Rules', () => {
    test('excludes inactive NGOs', () => {
      const res = checkNgoEligibility(ngoInactive, validDonation, 1.0);
      assert.equal(res.eligible, false);
      assert.ok(res.reason.includes('inactive'));
    });

    test('excludes expired donations', () => {
      const pastDonation = { ...validDonation.toObject(), pickupDeadline: new Date(Date.now() - 60000) };
      const res = checkNgoEligibility(ngoA, pastDonation, 1.0);
      assert.equal(res.eligible, false);
      assert.ok(res.reason.includes('deadline has already passed'));
    });

    test('excludes food type incompatibility (strictly non-veg NGO rejecting veg food)', () => {
      const res = checkNgoEligibility(ngoC, validDonation, 2.0);
      assert.equal(res.eligible, false);
      assert.ok(res.reason.includes('incompatible with VEGETARIAN'));
    });

    test('excludes donations exceeding NGO configured service radius', () => {
      // ngoA has serviceRadiusKm = 15; distance = 18 km
      const res = checkNgoEligibility(ngoA, validDonation, 18.0);
      assert.equal(res.eligible, false);
      assert.ok(res.reason.includes('exceeding the NGO\'s configured maximum service radius'));
    });

    test('excludes NGOs with paused availability', () => {
      const pausedNgo = { ...ngoA.toObject(), isAvailable: false };
      const res = checkNgoEligibility(pausedNgo, validDonation, 2.0);
      assert.equal(res.eligible, false);
      assert.ok(res.reason.includes('paused accepting'));
    });
  });

  describe('4. Deterministic Ranking & End-to-End Scenarios', () => {
    test('Donor views ranked NGOs: closer, high-capacity NGO ranks above farther, lower-capacity NGO', async () => {
      const result = await getRankedNgosForDonation(validDonation._id.toString(), donorA._id.toString());

      assert.equal(result.totalEligible >= 2, true);
      assert.ok(result.rankedNgos.length >= 2);

      // NGO A should rank #1 ahead of NGO B
      const topNgo = result.rankedNgos[0];
      const secondNgo = result.rankedNgos[1];

      assert.equal(topNgo.ngo.organization, 'Care & Nourish NGO');
      assert.ok(topNgo.totalScore > secondNgo.totalScore);
      assert.ok(topNgo.distanceKm < secondNgo.distanceKm);

      // Verify explanation breakdown exists
      assert.ok(topNgo.reasons.length >= 3);
      assert.ok(topNgo.criteria.proximity.score >= 28);
      assert.ok(topNgo.criteria.capacity.score === 25);
    });

    test('stable, deterministic ranking for identical inputs on repeated runs', async () => {
      const run1 = await getRankedNgosForDonation(validDonation._id.toString(), donorA._id.toString());
      const run2 = await getRankedNgosForDonation(validDonation._id.toString(), donorA._id.toString());

      assert.equal(run1.rankedNgos.length, run2.rankedNgos.length);
      assert.equal(run1.rankedNgos[0].ngo._id.toString(), run2.rankedNgos[0].ngo._id.toString());
      assert.equal(run1.rankedNgos[0].totalScore, run2.rankedNgos[0].totalScore);
    });

    test('NGO views recommended donations: returns ranked available donations matching profile', async () => {
      const result = await getRankedDonationsForNgo(ngoA._id.toString(), ngoA._id.toString());

      assert.ok(result.rankedDonations.length >= 1);
      const topDonation = result.rankedDonations[0];
      assert.equal(topDonation.donation.foodName, 'Hot Veg Biryani & Curry');
      assert.ok(topDonation.totalScore > 70);
    });

    test('returns clear empty message when no eligible NGOs match criteria', async () => {
      // Create a remote donation 200 km away
      const remoteDonation = await Donation.create({
        donor: donorA._id,
        foodName: 'Remote Surplus Meal',
        category: 'Cooked Meals',
        quantity: 10,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 20,
        location: {
          address: 'Remote Hilltop 200km',
          coordinates: [75.0000, 15.0000] // Way outside any NGO service radius
        },
        pickupDeadline: new Date(Date.now() + 18000000),
        contactPerson: 'Gordon',
        contactPhone: '9100011111',
        status: 'AVAILABLE'
      });

      const result = await getRankedNgosForDonation(remoteDonation._id.toString(), donorA._id.toString());
      assert.equal(result.totalEligible, 0);
      assert.ok(result.message.includes('No eligible NGOs found'));
    });
  });

  describe('5. Authorization & Security Access Controls', () => {
    test('Donor B is blocked from retrieving Donor A matching results (403)', async () => {
      await assert.rejects(
        async () => {
          await getRankedNgosForDonation(validDonation._id.toString(), donorB._id.toString());
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.ok(err.message.includes('Access denied'));
          return true;
        }
      );
    });

    test('NGO B is blocked from retrieving recommendations for NGO A (403)', async () => {
      await assert.rejects(
        async () => {
          await getRankedDonationsForNgo(ngoA._id.toString(), ngoB._id.toString());
        },
        (err) => {
          assert.equal(err.status, 403);
          assert.ok(err.message.includes('Access denied'));
          return true;
        }
      );
    });

    test('rejects invalid ObjectId format with 400 Bad Request', async () => {
      await assert.rejects(
        async () => {
          await getRankedNgosForDonation('not-a-valid-id', donorA._id.toString());
        },
        (err) => {
          assert.equal(err.status, 400);
          return true;
        }
      );

      await assert.rejects(
        async () => {
          await getRankedDonationsForNgo('not-a-valid-id', donorA._id.toString());
        },
        (err) => {
          assert.equal(err.status, 400);
          return true;
        }
      );
    });
  });
});
