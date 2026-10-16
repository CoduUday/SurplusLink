import express from 'express';
import {
  getRecommendedNgos,
  getRecommendedDonations
} from '../controllers/matching.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All matching endpoints require authentication
router.use(protect);

/**
 * GET /api/matching/donations/:donationId/ngos
 * Returns ranked eligible NGOs for a donation. Authorized donors only.
 */
router.get(
  '/donations/:donationId/ngos',
  authorize('DONOR'),
  getRecommendedNgos
);

/**
 * GET /api/matching/ngos/:ngoId/donations
 * Returns ranked available donations for an NGO. Authorized NGO only.
 */
router.get(
  '/ngos/:ngoId/donations',
  authorize('NGO'),
  getRecommendedDonations
);

export default router;
