import test, { describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Donation from '../src/models/Donation.js';
import {
  validateDonationPayload,
  createDonationListing,
  getAvailableDonationsFeed,
  getDonorListings,
  getDonationDetails,
  updateDonationListing,
  cancelDonationListing,
  expirePastDueDonations
} from '../src/services/donations/donation.service.js';
import {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  updateDonation,
  cancelDonation
} from '../src/controllers/donation.controller.js';

describe('Feature 3: Food Surplus Listing — Unit & Integration Tests', () => {
  let donorUserA;
  let donorUserB;
  let ngoUser;

  // Helper for mock Express responses
  const createMockRes = () => {
    return {
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
  };

  before(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/SurplusLink_test';
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    // Clean up test data
    await User.deleteMany({
      email: {
        $in: [
          'test_donor_3a@surpluslink.org',
          'test_donor_3b@surpluslink.org',
          'test_ngo_3@surpluslink.org'
        ]
      }
    });

    donorUserA = await User.create({
      name: 'Chef Mario',
      email: 'test_donor_3a@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Trattoria Mario',
      contact: '+91 91234 56789'
    });

    donorUserB = await User.create({
      name: 'Chef Luigi',
      email: 'test_donor_3b@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Banquets Luigi',
      contact: '+91 91234 56780'
    });

    ngoUser = await User.create({
      name: 'Sister Clara',
      email: 'test_ngo_3@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Hope Community Kitchen',
      contact: '+91 99887 76655',
      servingCapacity: 200
    });

    await Donation.deleteMany({ donor: { $in: [donorUserA._id, donorUserB._id] } });
  });

  after(async () => {
    if (donorUserA && donorUserB && ngoUser) {
      await Donation.deleteMany({ donor: { $in: [donorUserA._id, donorUserB._id] } });
      await User.deleteMany({ _id: { $in: [donorUserA._id, donorUserB._id, ngoUser._id] } });
    }
    await mongoose.disconnect();
  });

  describe('1. Payload Validation Rules', () => {
    test('rejects missing required fields', () => {
      const res = validateDonationPayload({});
      assert.equal(res.isValid, false);
      assert.ok(res.errors.length >= 6);
    });

    test('rejects zero or negative quantities', () => {
      const res = validateDonationPayload({
        foodName: 'Rice & Curry',
        category: 'Cooked Meals',
        quantity: -5,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 20,
        pickupDeadline: new Date(Date.now() + 3600000),
        location: { address: '123 Main St' },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('positive number')));
    });

    test('rejects invalid or non-integer servings', () => {
      const res = validateDonationPayload({
        foodName: 'Rice & Curry',
        category: 'Cooked Meals',
        quantity: 10,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 12.5, // Not integer
        pickupDeadline: new Date(Date.now() + 3600000),
        location: { address: '123 Main St' },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('whole integer')));
    });

    test('rejects past pickup deadlines', () => {
      const pastDate = new Date(Date.now() - 3600000); // 1 hour ago
      const res = validateDonationPayload({
        foodName: 'Bread & Pastries',
        category: 'Bakery & Bread',
        quantity: 5,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 15,
        pickupDeadline: pastDate,
        location: { address: '123 Baker St' },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
      });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.some(e => e.includes('future date and time')));
    });

    test('validates allergen information and never defaults to allergen-free without explicit verification', () => {
      const res = validateDonationPayload({
        foodName: 'Pasta Primavera',
        category: 'Cooked Meals',
        quantity: 15,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 40,
        pickupDeadline: new Date(Date.now() + 7200000),
        location: {
          address: '45 Pasta Lane',
          coordinates: [77.5946, 12.9716]
        },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
        // No allergenInfo provided
      });
      assert.equal(res.isValid, true);
      assert.equal(res.sanitized.allergenInfo.declarationStatus, 'UNKNOWN_UNVERIFIED');
      assert.deepEqual(res.sanitized.allergenInfo.allergensDeclared, []);
    });

    test('rejects missing or invalid pickup coordinates', () => {
      const resWithoutCoords = validateDonationPayload({
        foodName: 'Pasta Primavera',
        category: 'Cooked Meals',
        quantity: 15,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 40,
        pickupDeadline: new Date(Date.now() + 7200000),
        location: { address: '45 Pasta Lane' },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
      });
      assert.equal(resWithoutCoords.isValid, false);
      assert.ok(resWithoutCoords.errors.some(e => e.includes('Pickup coordinates')));

      const resWithInvalidCoords = validateDonationPayload({
        foodName: 'Pasta Primavera',
        category: 'Cooked Meals',
        quantity: 15,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 40,
        pickupDeadline: new Date(Date.now() + 7200000),
        location: { address: '45 Pasta Lane', coordinates: [999, 999] },
        contactPerson: 'Mario',
        contactPhone: '9876543210'
      });
      assert.equal(resWithInvalidCoords.isValid, false);
      assert.ok(resWithInvalidCoords.errors.some(e => e.includes('Pickup coordinates')));
    });
  });

  describe('2. Creation & Lifecycle Workflows', () => {
    let createdDonationId;

    test('Donor creates valid food surplus listing with status AVAILABLE', async () => {
      const req = {
        user: donorUserA,
        body: {
          foodName: 'Fresh Vegetable Pulao & Raita',
          category: 'Cooked Meals',
          quantity: 25.5,
          quantityUnit: 'kg',
          foodType: 'VEGETARIAN',
          servings: 75,
          allergenInfo: {
            allergensDeclared: ['Dairy'],
            ingredientNotes: 'Contains cow milk curd in raita',
            declarationStatus: 'DECLARED_ALLERGENS'
          },
          location: {
            address: 'Trattoria Mario, 88 Food Court St, Bangalore',
            coordinates: [77.5946, 12.9716]
          },
          pickupDeadline: new Date(Date.now() + 10800000), // 3 hours in future
          contactPerson: 'Mario Rossi',
          contactPhone: '+91 91234 56789',
          pickupInstructions: 'Collect from the kitchen back door near parking area.'
        }
      };
      const res = createMockRes();

      await createDonation(req, res);

      assert.equal(res.statusCode, 201);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.donation.status, 'AVAILABLE');
      assert.equal(res.jsonData.donation.foodName, 'Fresh Vegetable Pulao & Raita');
      assert.equal(res.jsonData.donation.servings, 75);
      assert.equal(res.jsonData.donation.quantity, 25.5);
      assert.equal(res.jsonData.donation.quantityUnit, 'kg');

      createdDonationId = res.jsonData.donation._id;
    });

    test('Donor retrieves their own listings via /api/donations/mine', async () => {
      const req = {
        user: donorUserA,
        query: {}
      };
      const res = createMockRes();

      await getMyDonations(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.ok(res.jsonData.donations.length >= 1);
      assert.equal(res.jsonData.donations[0]._id.toString(), createdDonationId.toString());
    });

    test('Donor updates an eligible listing in AVAILABLE status', async () => {
      const req = {
        user: donorUserA,
        params: { id: createdDonationId.toString() },
        body: {
          servings: 80,
          quantity: 28.0,
          pickupInstructions: 'Updated: Ring bell at loading dock B.'
        }
      };
      const res = createMockRes();

      await updateDonation(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.donation.servings, 80);
      assert.equal(res.jsonData.donation.quantity, 28.0);
      assert.equal(res.jsonData.donation.pickupInstructions, 'Updated: Ring bell at loading dock B.');
    });

    test('Donor B is blocked from modifying Donor A listing (403)', async () => {
      const req = {
        user: donorUserB, // Unauthorized donor
        params: { id: createdDonationId.toString() },
        body: {
          servings: 10
        }
      };
      const res = createMockRes();

      await updateDonation(req, res);

      assert.equal(res.statusCode, 403);
      assert.equal(res.jsonData.success, false);
      assert.ok(res.jsonData.message.includes('Access denied'));
    });

    test('NGO browses available donations feed and sees the listing', async () => {
      const req = {
        user: ngoUser,
        query: { category: 'Cooked Meals', foodType: 'VEGETARIAN' }
      };
      const res = createMockRes();

      await getAvailableDonations(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.ok(res.jsonData.donations.some(d => d._id.toString() === createdDonationId.toString()));
    });

    test('NGO views details of the available donation', async () => {
      const req = {
        user: ngoUser,
        params: { id: createdDonationId.toString() }
      };
      const res = createMockRes();

      await getDonationById(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.donation.foodName, 'Fresh Vegetable Pulao & Raita');
      assert.equal(res.jsonData.donation.donor.organization, 'Trattoria Mario');
    });

    test('Donor cancels an eligible listing in AVAILABLE status', async () => {
      const req = {
        user: donorUserA,
        params: { id: createdDonationId.toString() },
        body: { cancellationReason: 'Excess food was unexpectedly needed for staff.' }
      };
      const res = createMockRes();

      await cancelDonation(req, res);

      assert.equal(res.statusCode, 200);
      assert.equal(res.jsonData.success, true);
      assert.equal(res.jsonData.donation.status, 'CANCELLED');
      assert.equal(res.jsonData.donation.cancellationReason, 'Excess food was unexpectedly needed for staff.');
    });

    test('Cancelled donation is excluded from the NGO available feed', async () => {
      const req = {
        user: ngoUser,
        query: {}
      };
      const res = createMockRes();

      await getAvailableDonations(req, res);

      assert.equal(res.statusCode, 200);
      // Cancelled donation MUST NOT appear in available feed
      assert.ok(!res.jsonData.donations.some(d => d._id.toString() === createdDonationId.toString()));
    });

    test('Cannot edit a CANCELLED donation (409 Conflict)', async () => {
      const req = {
        user: donorUserA,
        params: { id: createdDonationId.toString() },
        body: { servings: 90 }
      };
      const res = createMockRes();

      await updateDonation(req, res);

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.ok(res.jsonData.message.includes("Cannot edit donation. Current status is 'CANCELLED'"));
    });

    test('Cannot cancel a donation that is already ACCEPTED or COLLECTED (409 Conflict)', async () => {
      // Create a test donation and simulate ACCEPTED status
      const testDonation = await Donation.create({
        donor: donorUserA._id,
        foodName: 'Sandwiches',
        category: 'Bakery & Bread',
        quantity: 10,
        quantityUnit: 'packets',
        foodType: 'VEGETARIAN',
        servings: 20,
        location: {
          address: '123 Street',
          coordinates: [77.5946, 12.9716]
        },
        pickupDeadline: new Date(Date.now() + 3600000),
        contactPerson: 'Mario',
        contactPhone: '9876543210',
        status: 'ACCEPTED'
      });

      const req = {
        user: donorUserA,
        params: { id: testDonation._id.toString() }
      };
      const res = createMockRes();

      await cancelDonation(req, res);

      assert.equal(res.statusCode, 409);
      assert.equal(res.jsonData.success, false);
      assert.ok(res.jsonData.message.includes("Cannot cancel donation. It has already progressed to 'ACCEPTED'"));
    });
  });

  describe('3. Expiration Sweep Logic', () => {
    test('Expired donations (past deadline) are excluded from NGO available feed and updated to EXPIRED', async () => {
      // Create an available donation with past deadline
      const pastDeadline = new Date(Date.now() - 5000);
      const expiredDoc = await Donation.create({
        donor: donorUserA._id,
        foodName: 'Stale Bread (Past Deadline)',
        category: 'Bakery & Bread',
        quantity: 8,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 15,
        location: {
          address: 'Old Warehouse St',
          coordinates: [77.5946, 12.9716]
        },
        pickupDeadline: pastDeadline,
        contactPerson: 'Mario',
        contactPhone: '9876543210',
        status: 'AVAILABLE'
      });

      // Run feed query (which triggers expiration check)
      const feed = await getAvailableDonationsFeed({});
      assert.ok(!feed.donations.some(d => d._id.toString() === expiredDoc._id.toString()));

      // Check database status
      const refreshedDoc = await Donation.findById(expiredDoc._id);
      assert.equal(refreshedDoc.status, 'EXPIRED');
    });

    test('Expiration sweep never overwrites ACCEPTED or COLLECTED donations', async () => {
      const pastDeadline = new Date(Date.now() - 5000);
      const acceptedDoc = await Donation.create({
        donor: donorUserA._id,
        foodName: 'Scheduled Catering',
        category: 'Cooked Meals',
        quantity: 30,
        quantityUnit: 'kg',
        foodType: 'VEGETARIAN',
        servings: 50,
        location: {
          address: 'Banquets Lane',
          coordinates: [77.5946, 12.9716]
        },
        pickupDeadline: pastDeadline,
        contactPerson: 'Mario',
        contactPhone: '9876543210',
        status: 'ACCEPTED' // Must remain ACCEPTED
      });

      await expirePastDueDonations();

      const refreshedDoc = await Donation.findById(acceptedDoc._id);
      assert.equal(refreshedDoc.status, 'ACCEPTED');
    });
  });

  describe('4. ObjectId & Error Handling', () => {
    test('Rejects invalid ObjectId format on get, update, and cancel', async () => {
      const req = {
        user: donorUserA,
        params: { id: 'invalid-id-123' }
      };
      const res = createMockRes();

      await getDonationById(req, res);
      assert.equal(res.statusCode, 400);

      await updateDonation(req, res);
      assert.equal(res.statusCode, 400);

      await cancelDonation(req, res);
      assert.equal(res.statusCode, 400);
    });
  });
});
