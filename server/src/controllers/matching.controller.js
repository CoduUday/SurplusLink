import {
  getRankedNgosForDonation,
  getRankedDonationsForNgo
} from '../services/matching/ngoMatching.service.js';

/**
 * Controller to handle Smart NGO Matching endpoints.
 */

/**
 * GET /api/matching/donations/:donationId/ngos
 * Returns ranked eligible NGOs for a food surplus donation.
 * Accessible to authorized donors who own the listing (or Admins).
 */
export const getRecommendedNgos = async (req, res, next) => {
  try {
    const { donationId } = req.params;
    const { page, limit } = req.query;

    const result = await getRankedNgosForDonation(donationId, req.user._id, {
      userRole: req.user.role,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Matching controller error (getRecommendedNgos):', error);
    next(error);
  }
};

/**
 * GET /api/matching/ngos/:ngoId/donations
 * Returns ranked available donations suitable for the authenticated NGO.
 * Accessible to the authenticated NGO account (or Admins).
 */
export const getRecommendedDonations = async (req, res, next) => {
  try {
    const { ngoId } = req.params;
    const { page, limit } = req.query;

    const result = await getRankedDonationsForNgo(ngoId, req.user._id, {
      userRole: req.user.role,
      page,
      limit
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    console.error('Matching controller error (getRecommendedDonations):', error);
    next(error);
  }
};

export default {
  getRecommendedNgos,
  getRecommendedDonations
};
