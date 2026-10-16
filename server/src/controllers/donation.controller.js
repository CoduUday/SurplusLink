import {
  createDonationListing,
  getAvailableDonationsFeed,
  getDonorListings,
  getDonationDetails,
  updateDonationListing,
  cancelDonationListing,
  acceptDonationListing,
  getNgoAcceptedDonations
} from '../services/donations/donation.service.js';

/**
 * @desc    Create and publish a new food surplus donation listing
 * @route   POST /api/donations
 * @access  Private (DONOR only)
 */
export const createDonation = async (req, res) => {
  try {
    const donorId = req.user._id;
    const donation = await createDonationListing(donorId, req.body);

    return res.status(201).json({
      success: true,
      message: 'Surplus food donation listed successfully.',
      donation
    });
  } catch (error) {
    console.error('Create donation error:', error);
    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        details: error.details || []
      });
    }
    return res.status(500).json({
      success: false,
      message: error.message || 'Server error occurred while creating donation listing.'
    });
  }
};

/**
 * @desc    Browse available, unexpired food donations
 * @route   GET /api/donations
 * @access  Private (NGO only)
 */
export const getAvailableDonations = async (req, res) => {
  try {
    const result = await getAvailableDonationsFeed(req.query);

    return res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      donations: result.donations
    });
  } catch (error) {
    console.error('Get available donations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve available donations.'
    });
  }
};

/**
 * @desc    Retrieve the authenticated donor's own listings
 * @route   GET /api/donations/mine
 * @access  Private (DONOR only)
 */
export const getMyDonations = async (req, res) => {
  try {
    const donorId = req.user._id;
    const result = await getDonorListings(donorId, req.query);

    return res.status(200).json({
      success: true,
      count: result.count,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      donations: result.donations
    });
  } catch (error) {
    console.error('Get my donations error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve your donation listings.'
    });
  }
};

/**
 * @desc    Retrieve an authorized donation's details
 * @route   GET /api/donations/:id
 * @access  Private (Authorized Donor or NGO)
 */
export const getDonationById = async (req, res) => {
  try {
    const { id } = req.params;
    const donation = await getDonationDetails(id, req.user);

    return res.status(200).json({
      success: true,
      donation
    });
  } catch (error) {
    console.error('Get donation details error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Failed to retrieve donation details.'
    });
  }
};

/**
 * @desc    Update an eligible donation owned by the donor
 * @route   PATCH /api/donations/:id
 * @access  Private (DONOR only)
 */
export const updateDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donorId = req.user._id;
    const updated = await updateDonationListing(id, donorId, req.body);

    return res.status(200).json({
      success: true,
      message: 'Donation listing updated successfully.',
      donation: updated
    });
  } catch (error) {
    console.error('Update donation error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message,
      details: error.details || []
    });
  }
};

/**
 * @desc    Cancel an eligible donation owned by the donor
 * @route   DELETE /api/donations/:id
 * @access  Private (DONOR only)
 */
export const cancelDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const donorId = req.user._id;
    const { cancellationReason } = req.body || {};

    const cancelled = await cancelDonationListing(id, donorId, cancellationReason);

    return res.status(200).json({
      success: true,
      message: 'Donation listing cancelled successfully.',
      donation: cancelled
    });
  } catch (error) {
    console.error('Cancel donation error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Accept and claim an available food surplus listing
 * @route   POST /api/donations/:id/accept
 * @access  Private (NGO only)
 */
export const acceptDonation = async (req, res) => {
  try {
    const { id } = req.params;
    const ngoUser = req.user;
    const { estimatedPickupTime, acceptNotes } = req.body || {};

    const donation = await acceptDonationListing(id, ngoUser, {
      estimatedPickupTime,
      acceptNotes
    });

    return res.status(200).json({
      success: true,
      message: 'Donation accepted successfully! Pickup details and donor contact unlocked.',
      donation
    });
  } catch (error) {
    console.error('Accept donation error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

/**
 * @desc    Get all donations accepted by the authenticated NGO
 * @route   GET /api/donations/accepted
 * @access  Private (NGO only)
 */
export const getMyAcceptedDonations = async (req, res) => {
  try {
    const ngoId = req.user._id;
    const result = await getNgoAcceptedDonations(ngoId, req.query);

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get accepted donations error:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message
    });
  }
};

export default {
  createDonation,
  getAvailableDonations,
  getMyDonations,
  getDonationById,
  updateDonation,
  cancelDonation,
  acceptDonation,
  getMyAcceptedDonations
};
