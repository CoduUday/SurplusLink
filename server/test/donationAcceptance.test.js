import { describe, test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Donation from '../src/models/Donation.js';
import {
  acceptDonationListing,
  getDonorListings,
  getDonationDetails,
  getNgoAcceptedDonations,
  getAvailableDonationsFeed
} from '../src/services/donations/donation.service.js';
import {
  acceptDonation,
  getMyAcceptedDonations
} from '../src/controllers/donation.controller.js';

describe('Feature 5: Donation Acceptance & Reflection Workflow — Tests', () => {
  let donorUser;
  let ngoUserA;
  let ngoUserB;
  let availableDonation;

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

    // Clean up test data
    await User.deleteMany({
      email: {
        $in: [
          'test_accept_donor@surpluslink.org',
          'test_accept_ngoa@surpluslink.org',
          'test_accept_ngob@surpluslink.org'
        ]
      }
    });

    donorUser = await User.create({
      name: 'Chef Antonio',
      email: 'test_accept_donor@surpluslink.org',
      password: 'password123',
      role: 'DONOR',
      organization: 'Trattoria Antonio',
      contact: '+91 98765 43210',
      location: {
        type: 'Point',
        coordinates: [77.5946, 12.9716]
      }
    });

    ngoUserA = await User.create({
      name: 'Sister Teresa',
      email: 'test_accept_ngoa@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Hope Care Foundation',
      contact: '+91 91234 56789',
      servingCapacity: 250,
      location: {
        type: 'Point',
        coordinates: [77.6000, 12.9800]
      }
    });

    ngoUserB = await User.create({
      name: 'Brother Leo',
      email: 'test_accept_ngob@surpluslink.org',
      password: 'password123',
      role: 'NGO',
      organization: 'Bread of Life Kitchen',
      contact: '+91 99887 76655',
      servingCapacity: 100,
      location: {
        type: 'Point',
        coordinates: [77.6100, 12.9900]
      }
    });

    await Donation.deleteMany({ donor: donorUser._id });

    availableDonation = await Donation.create({
      donor: donorUser._id,
      foodName: 'Fresh Penne Arrabiata & Rolls',
      category: 'Cooked Meals',
      quantity: 15,
      quantityUnit: 'kg',
      foodType: 'VEGETARIAN',
      servings: 45,
      location: {
        address: '10 Italian Way, Bangalore',
        coordinates: [77.5946, 12.9716]
      },
      pickupDeadline: new Date(Date.now() + 10800000), // 3 hours in future
      contactPerson: 'Chef Antonio',
      contactPhone: '+91 98765 43210',
      pickupInstructions: 'Pick up at side delivery door',
      status: 'AVAILABLE'
    });
  });

  after(async () => {
    if (donorUser) {
      await Donation.deleteMany({ donor: donorUser._id });
      await User.deleteMany({
        _id: { $in: [donorUser._id, ngoUserA._id, ngoUserB._id] }
      });
    }
    await mongoose.disconnect();
  });

  test('1. NGO successfully accepts an available food donation', async () => {
    const req = {
      user: ngoUserA,
      params: { id: availableDonation._id.toString() },
      body: {
        estimatedPickupTime: 'Within 45 minutes (approx 2:30 PM)',
        acceptNotes: 'Team of 2 volunteers arriving in blue refrigerated van'
      }
    };
    const res = createMockRes();

    await acceptDonation(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.equal(res.jsonData.donation.status, 'ACCEPTED');
    assert.equal(res.jsonData.donation.acceptedBy._id.toString(), ngoUserA._id.toString());
    assert.equal(res.jsonData.donation.acceptedBy.organization, 'Hope Care Foundation');
    assert.equal(res.jsonData.donation.estimatedPickupTime, 'Within 45 minutes (approx 2:30 PM)');
    assert.equal(res.jsonData.donation.acceptNotes, 'Team of 2 volunteers arriving in blue refrigerated van');
    assert.ok(res.jsonData.donation.acceptedAt);
  });

  test('2. Accepted donation reflects immediately in donor listings (/api/donations/mine)', async () => {
    const donorFeed = await getDonorListings(donorUser._id);

    const match = donorFeed.donations.find(d => d._id.toString() === availableDonation._id.toString());
    assert.ok(match, 'Donation should exist in donor listings');
    assert.equal(match.status, 'ACCEPTED');
    assert.ok(match.acceptedBy, 'acceptedBy should be populated');
    assert.equal(match.acceptedBy.organization, 'Hope Care Foundation');
    assert.equal(match.acceptedBy.contact, '+91 91234 56789');
  });

  test('3. Donor views donation details and sees accepting NGO details and pickup notes', async () => {
    const details = await getDonationDetails(availableDonation._id.toString(), donorUser);

    assert.equal(details.status, 'ACCEPTED');
    assert.equal(details.acceptedBy.organization, 'Hope Care Foundation');
    assert.equal(details.acceptedBy.name, 'Sister Teresa');
    assert.equal(details.acceptedBy.contact, '+91 91234 56789');
    assert.equal(details.estimatedPickupTime, 'Within 45 minutes (approx 2:30 PM)');
    assert.equal(details.acceptNotes, 'Team of 2 volunteers arriving in blue refrigerated van');
  });

  test('4. Accepting NGO views donation details and sees unlocked donor contact details', async () => {
    const details = await getDonationDetails(availableDonation._id.toString(), ngoUserA);

    assert.equal(details.status, 'ACCEPTED');
    assert.equal(details.contactPhone, '+91 98765 43210');
    assert.equal(details.contactPerson, 'Chef Antonio');
    assert.equal(details.pickupInstructions, 'Pick up at side delivery door');
  });

  test('5. Accepted donation is excluded from general available NGO feed', async () => {
    const feed = await getAvailableDonationsFeed({});
    const exists = feed.donations.some(d => d._id.toString() === availableDonation._id.toString());
    assert.equal(exists, false, 'Accepted donation must not appear in available feed');
  });

  test('6. Second NGO attempting to accept already accepted donation gets 409 Conflict', async () => {
    const req = {
      user: ngoUserB,
      params: { id: availableDonation._id.toString() },
      body: {}
    };
    const res = createMockRes();

    await acceptDonation(req, res);

    assert.equal(res.statusCode, 409);
    assert.equal(res.jsonData.success, false);
    assert.ok(res.jsonData.message.includes('already been accepted'));
  });

  test('7. Accepting NGO retrieves accepted donations via /api/donations/accepted', async () => {
    const req = {
      user: ngoUserA,
      query: {}
    };
    const res = createMockRes();

    await getMyAcceptedDonations(req, res);

    assert.equal(res.statusCode, 200);
    assert.equal(res.jsonData.success, true);
    assert.ok(res.jsonData.donations.length >= 1);
    const claimed = res.jsonData.donations.find(d => d._id.toString() === availableDonation._id.toString());
    assert.ok(claimed);
    assert.equal(claimed.foodName, 'Fresh Penne Arrabiata & Rolls');
  });

  test('8. Rejects acceptance of expired or cancelled listings with 409 Conflict', async () => {
    // Create an expired donation
    const expiredDonation = await Donation.create({
      donor: donorUser._id,
      foodName: 'Old Soup',
      category: 'Cooked Meals',
      quantity: 5,
      quantityUnit: 'litres',
      foodType: 'VEGETARIAN',
      servings: 10,
      location: {
        address: '10 Italian Way',
        coordinates: [77.5946, 12.9716]
      },
      pickupDeadline: new Date(Date.now() - 10000), // Past
      contactPerson: 'Antonio',
      contactPhone: '9876543210',
      status: 'AVAILABLE'
    });

    await assert.rejects(
      async () => {
        await acceptDonationListing(expiredDonation._id.toString(), ngoUserB);
      },
      (err) => {
        assert.equal(err.status, 409);
        assert.ok(err.message.includes('expired') || err.message.includes('passed'));
        return true;
      }
    );
  });
});
