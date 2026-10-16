import express from 'express';
import {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  updateDonation,
  cancelDonation,
  acceptDonation,
  getMyAcceptedDonations
} from '../controllers/donation.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All donation endpoints require authentication
router.use(protect);

// Donors: Create a donation | NGOs: Browse available donations
router.route('/')
  .post(authorize('DONOR'), createDonation)
  .get(authorize('NGO'), getAvailableDonations);

// Donors: Retrieve authenticated donor's own listings (Must precede /:id)
router.get(['/mine', '/my'], authorize('DONOR'), getMyDonations);

// NGOs: Retrieve donations accepted by this NGO (Must precede /:id)
router.get('/accepted', authorize('NGO'), getMyAcceptedDonations);

// Authorized users: Retrieve details of specific donation
router.get('/:id', getDonationById);

// NGOs: Accept and claim an available food surplus listing
router.post('/:id/accept', authorize('NGO'), acceptDonation);

// Donors: Update or Cancel eligible listing
router.route('/:id')
  .patch(authorize('DONOR'), updateDonation)
  .delete(authorize('DONOR'), cancelDonation);

export default router;
