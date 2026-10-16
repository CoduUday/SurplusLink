import mongoose from 'mongoose';
import Donation from '../../models/Donation.js';

export const VALID_CATEGORIES = [
  'Cooked Meals',
  'Bakery & Bread',
  'Fresh Produce',
  'Dairy & Eggs',
  'Packaged Food',
  'Beverages',
  'Other'
];

export const VALID_QUANTITY_UNITS = [
  'kg',
  'grams',
  'litres',
  'packets',
  'servings',
  'boxes'
];

export const VALID_FOOD_TYPES = ['VEGETARIAN', 'NON_VEGETARIAN'];

export const VALID_ALLERGEN_STATUSES = [
  'DECLARED_ALLERGENS',
  'ALLERGEN_FREE_VERIFIED',
  'UNKNOWN_UNVERIFIED'
];

/**
 * Validates donation payload before creation or update.
 * 
 * @param {Object} data 
 * @param {boolean} isUpdate 
 * @returns {{isValid: boolean, errors: string[], sanitized: Object}}
 */
export const validateDonationPayload = (data, isUpdate = false) => {
  const errors = [];
  const sanitized = {};

  // foodName
  if (!isUpdate || data.foodName !== undefined) {
    if (!data.foodName || typeof data.foodName !== 'string' || !data.foodName.trim()) {
      errors.push('Food name is required.');
    } else if (data.foodName.trim().length > 150) {
      errors.push('Food name cannot exceed 150 characters.');
    } else {
      sanitized.foodName = data.foodName.trim();
    }
  }

  // category
  if (!isUpdate || data.category !== undefined) {
    if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    } else {
      sanitized.category = data.category;
    }
  }

  // quantity
  if (!isUpdate || data.quantity !== undefined) {
    const qty = Number(data.quantity);
    if (data.quantity === undefined || data.quantity === null || isNaN(qty) || qty <= 0) {
      errors.push('Quantity must be a positive number greater than 0.');
    } else {
      sanitized.quantity = Math.round(qty * 100) / 100;
    }
  }

  // quantityUnit
  if (!isUpdate || data.quantityUnit !== undefined) {
    if (!data.quantityUnit || !VALID_QUANTITY_UNITS.includes(data.quantityUnit)) {
      errors.push(`Quantity unit must be one of: ${VALID_QUANTITY_UNITS.join(', ')}.`);
    } else {
      sanitized.quantityUnit = data.quantityUnit;
    }
  }

  // foodType
  if (!isUpdate || data.foodType !== undefined) {
    const normalizedFoodType = typeof data.foodType === 'string' ? data.foodType.toUpperCase().trim() : '';
    if (!VALID_FOOD_TYPES.includes(normalizedFoodType)) {
      errors.push('Food type must be either VEGETARIAN or NON_VEGETARIAN.');
    } else {
      sanitized.foodType = normalizedFoodType;
    }
  }

  // servings (strictly positive integer, distinct from quantity)
  if (!isUpdate || data.servings !== undefined) {
    const srv = Number(data.servings);
    if (
      data.servings === undefined ||
      data.servings === null ||
      isNaN(srv) ||
      !Number.isInteger(srv) ||
      srv < 1
    ) {
      errors.push('Servings must be a positive whole integer of at least 1 person.');
    } else {
      sanitized.servings = srv;
    }
  }

  // pickupDeadline (must be a valid future date/time)
  if (!isUpdate || data.pickupDeadline !== undefined) {
    if (!data.pickupDeadline) {
      errors.push('Pickup deadline date and time is required.');
    } else {
      const deadlineDate = new Date(data.pickupDeadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.push('Invalid pickup deadline date/time format.');
      } else if (deadlineDate.getTime() <= Date.now()) {
        errors.push('Pickup deadline must be a future date and time.');
      } else {
        sanitized.pickupDeadline = deadlineDate;
      }
    }
  }

  // location (address & mandatory coordinates for proximity matching)
  if (!isUpdate || data.location !== undefined) {
    const loc = data.location || {};
    const address = typeof loc === 'string' ? loc : loc.address;
    if (!address || typeof address !== 'string' || !address.trim()) {
      errors.push('Pickup address is required.');
    }

    let coords = null;
    if (Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
      const lng = Number(loc.coordinates[0]);
      const lat = Number(loc.coordinates[1]);
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        coords = [lng, lat];
      }
    } else if (loc.latitude !== undefined && loc.longitude !== undefined) {
      const lng = Number(loc.longitude);
      const lat = Number(loc.latitude);
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        coords = [lng, lat];
      }
    } else if (data.latitude !== undefined && data.longitude !== undefined) {
      const lng = Number(data.longitude);
      const lat = Number(data.latitude);
      if (!isNaN(lng) && !isNaN(lat) && lng >= -180 && lng <= 180 && lat >= -90 && lat <= 90) {
        coords = [lng, lat];
      }
    }

    if (!coords) {
      errors.push('Pickup coordinates (valid latitude between -90 and 90, longitude between -180 and 180) are required for geographic matching.');
    } else if (address && address.trim()) {
      sanitized.location = {
        address: address.trim(),
        type: 'Point',
        coordinates: coords
      };
    }
  }

  // contactPerson
  if (!isUpdate || data.contactPerson !== undefined) {
    if (!data.contactPerson || typeof data.contactPerson !== 'string' || !data.contactPerson.trim()) {
      errors.push('Contact person name is required.');
    } else {
      sanitized.contactPerson = data.contactPerson.trim();
    }
  }

  // contactPhone
  if (!isUpdate || data.contactPhone !== undefined) {
    if (!data.contactPhone || typeof data.contactPhone !== 'string' || !data.contactPhone.trim()) {
      errors.push('Contact phone number is required.');
    } else {
      sanitized.contactPhone = data.contactPhone.trim();
    }
  }

  // pickupInstructions (optional)
  if (data.pickupInstructions !== undefined) {
    sanitized.pickupInstructions = typeof data.pickupInstructions === 'string' ? data.pickupInstructions.trim() : '';
  }

  // allergenInfo (structured, explicitly handles unknown vs declared vs verified free)
  if (data.allergenInfo !== undefined) {
    const info = data.allergenInfo || {};
    const declaredAllergens = Array.isArray(info.allergensDeclared)
      ? info.allergensDeclared.map((a) => String(a).trim()).filter(Boolean)
      : Array.isArray(info.contains)
      ? info.contains.map((a) => String(a).trim()).filter(Boolean)
      : [];

    let status = info.declarationStatus;
    if (!status || !VALID_ALLERGEN_STATUSES.includes(status)) {
      status = declaredAllergens.length > 0 ? 'DECLARED_ALLERGENS' : 'UNKNOWN_UNVERIFIED';
    }

    sanitized.allergenInfo = {
      allergensDeclared: declaredAllergens,
      ingredientNotes: typeof info.ingredientNotes === 'string' ? info.ingredientNotes.trim() : '',
      declarationStatus: status
    };
  } else if (!isUpdate) {
    sanitized.allergenInfo = {
      allergensDeclared: [],
      ingredientNotes: '',
      declarationStatus: 'UNKNOWN_UNVERIFIED'
    };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitized: errors.length === 0 ? sanitized : null
  };
};

/**
 * Sweep function: marks past-deadline AVAILABLE donations as EXPIRED.
 * Never overwrites ACCEPTED, COLLECTED, or DELIVERED.
 */
export const expirePastDueDonations = async () => {
  try {
    const now = new Date();
    await Donation.updateMany(
      {
        status: 'AVAILABLE',
        pickupDeadline: { $lte: now }
      },
      {
        $set: { status: 'EXPIRED' }
      }
    );
  } catch (err) {
    console.error('Error during automatic donation expiration sweep:', err);
  }
};

/**
 * Creates and publishes a new donation listing for an authenticated donor.
 */
export const createDonationListing = async (donorId, payload) => {
  const validation = validateDonationPayload(payload, false);
  if (!validation.isValid) {
    const error = new Error(`Validation failed: ${validation.errors.join(' ')}`);
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  const donationData = {
    ...validation.sanitized,
    donor: donorId,
    status: 'AVAILABLE'
  };

  const donation = await Donation.create(donationData);
  return donation;
};

/**
 * Browses available, non-expired donations for authenticated NGOs with pagination & filters.
 */
export const getAvailableDonationsFeed = async (query = {}) => {
  // 1. Run opportunistic expiration sweep
  await expirePastDueDonations();

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const now = new Date();
  const filter = {
    status: 'AVAILABLE',
    pickupDeadline: { $gt: now }
  };

  if (query.category && VALID_CATEGORIES.includes(query.category)) {
    filter.category = query.category;
  }

  if (query.foodType && VALID_FOOD_TYPES.includes(query.foodType.toUpperCase())) {
    filter.foodType = query.foodType.toUpperCase();
  }

  if (query.search && typeof query.search === 'string' && query.search.trim()) {
    filter.foodName = { $regex: query.search.trim(), $options: 'i' };
  }

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate('donor', 'organization name address contact')
      .sort({ pickupDeadline: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(filter)
  ]);

  return {
    donations,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    count: donations.length
  };
};

/**
 * Retrieves the authenticated donor's own listings.
 */
export const getDonorListings = async (donorId, query = {}) => {
  // Opportunistic expiration sweep
  await expirePastDueDonations();

  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = { donor: donorId };

  if (query.status && ['AVAILABLE', 'ACCEPTED', 'COLLECTED', 'DELIVERED', 'CANCELLED', 'EXPIRED'].includes(query.status)) {
    filter.status = query.status;
  }

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate('acceptedBy', 'organization name contact email servingCapacity')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(filter)
  ]);

  return {
    donations,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    count: donations.length
  };
};

/**
 * Retrieves an authorized donation by ID.
 * Access is restricted to the donor owner or an authenticated NGO viewing an eligible listing.
 */
export const getDonationDetails = async (donationId, requestingUser) => {
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    const error = new Error('Invalid donation ID format.');
    error.status = 400;
    throw error;
  }

  // Opportunistic sweep
  await expirePastDueDonations();

  const donation = await Donation.findById(donationId)
    .populate('donor', 'organization name email contact address')
    .populate('acceptedBy', 'organization name email contact address servingCapacity');
  if (!donation) {
    const error = new Error('Donation listing not found.');
    error.status = 404;
    throw error;
  }

  const isOwner = donation.donor._id.toString() === requestingUser._id.toString();
  const isNgo = requestingUser.role === 'NGO';

  if (!isOwner && !isNgo) {
    const error = new Error('You do not have authorization to view this donation.');
    error.status = 403;
    throw error;
  }

  const donationObj = donation.toObject();

  // If user is NGO and donation is cancelled or expired, hide private contact phone if not owner or the accepting NGO
  const isAcceptedByThisNgo = donation.acceptedBy && donation.acceptedBy._id.toString() === requestingUser._id.toString();
  if (isNgo && !isOwner && !isAcceptedByThisNgo && donation.status !== 'AVAILABLE') {
    donationObj.contactPhone = 'Protected (Donation not available)';
  }

  return donationObj;
};

/**
 * Allows an authenticated NGO to accept and claim an available food donation.
 * Transitions status to ACCEPTED and records NGO details and pickup estimates.
 * 
 * @param {string} donationId
 * @param {Object} ngoUser
 * @param {Object} acceptanceData
 * @returns {Promise<Object>}
 */
export const acceptDonationListing = async (donationId, ngoUser, acceptanceData = {}) => {
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    const error = new Error('Invalid donation ID format.');
    error.status = 400;
    throw error;
  }

  // Sweep expired listings
  await expirePastDueDonations();

  const donation = await Donation.findById(donationId);
  if (!donation) {
    const error = new Error('Donation listing not found.');
    error.status = 404;
    throw error;
  }

  // State checks: Can only accept listings in AVAILABLE state
  if (donation.status === 'ACCEPTED') {
    const error = new Error('This food donation has already been accepted by another organization.');
    error.status = 409;
    throw error;
  }

  if (donation.status === 'EXPIRED') {
    const error = new Error('Cannot accept donation. The pickup deadline has expired.');
    error.status = 409;
    throw error;
  }

  if (donation.status === 'CANCELLED') {
    const error = new Error('Cannot accept donation. This listing was cancelled by the donor.');
    error.status = 409;
    throw error;
  }

  if (donation.status !== 'AVAILABLE') {
    const error = new Error(`Cannot accept donation. Current status is '${donation.status}'.`);
    error.status = 409;
    throw error;
  }

  // Check if pickup deadline passed
  if (new Date(donation.pickupDeadline).getTime() <= Date.now()) {
    donation.status = 'EXPIRED';
    await donation.save();
    const error = new Error('Cannot accept donation. The pickup deadline has already passed.');
    error.status = 409;
    throw error;
  }

  // Transition to ACCEPTED
  donation.status = 'ACCEPTED';
  donation.acceptedBy = ngoUser._id;
  donation.acceptedAt = new Date();
  if (acceptanceData.estimatedPickupTime) {
    donation.estimatedPickupTime = String(acceptanceData.estimatedPickupTime).trim();
  }
  if (acceptanceData.acceptNotes) {
    donation.acceptNotes = String(acceptanceData.acceptNotes).trim();
  }

  await donation.save();

  // Populate donor and acceptedBy for immediate coordination
  await donation.populate([
    { path: 'donor', select: 'organization name email contact address' },
    { path: 'acceptedBy', select: 'organization name email contact address servingCapacity' }
  ]);

  return donation;
};

/**
 * Retrieves all donations accepted by a specific NGO.
 * 
 * @param {string} ngoId
 * @param {Object} query
 * @returns {Promise<Object>}
 */
export const getNgoAcceptedDonations = async (ngoId, query = {}) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const filter = {
    acceptedBy: ngoId,
    status: { $in: ['ACCEPTED', 'COLLECTED', 'DELIVERED'] }
  };

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate('donor', 'organization name address contact email')
      .sort({ acceptedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Donation.countDocuments(filter)
  ]);

  return {
    donations,
    total,
    page,
    totalPages: Math.ceil(total / limit) || 1,
    count: donations.length
  };
};

/**
 * Updates an eligible listing owned by the authenticated donor.
 * Edits are strictly forbidden once the donation has moved past AVAILABLE state.
 */
export const updateDonationListing = async (donationId, donorId, updateData) => {
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    const error = new Error('Invalid donation ID format.');
    error.status = 400;
    throw error;
  }

  const donation = await Donation.findById(donationId);
  if (!donation) {
    const error = new Error('Donation listing not found.');
    error.status = 404;
    throw error;
  }

  // Ownership check
  if (donation.donor.toString() !== donorId.toString()) {
    const error = new Error('Access denied. You do not have permission to modify this donation.');
    error.status = 403;
    throw error;
  }

  // State machine enforcement
  if (donation.status !== 'AVAILABLE') {
    const error = new Error(
      `Cannot edit donation. Current status is '${donation.status}'. Only listings in 'AVAILABLE' status can be edited.`
    );
    error.status = 409;
    throw error;
  }

  const validation = validateDonationPayload(updateData, true);
  if (!validation.isValid) {
    const error = new Error(`Validation failed: ${validation.errors.join(' ')}`);
    error.status = 400;
    error.details = validation.errors;
    throw error;
  }

  // Apply sanitized updates
  Object.assign(donation, validation.sanitized);
  await donation.save();

  return donation;
};

/**
 * Cancels an eligible listing owned by the donor.
 * Cancellation is strictly prohibited once accepted, collected, or delivered.
 */
export const cancelDonationListing = async (donationId, donorId, reason = '') => {
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    const error = new Error('Invalid donation ID format.');
    error.status = 400;
    throw error;
  }

  const donation = await Donation.findById(donationId);
  if (!donation) {
    const error = new Error('Donation listing not found.');
    error.status = 404;
    throw error;
  }

  // Ownership check
  if (donation.donor.toString() !== donorId.toString()) {
    const error = new Error('Access denied. You do not have permission to cancel this donation.');
    error.status = 403;
    throw error;
  }

  // Incompatible later workflow states
  if (donation.status === 'ACCEPTED' || donation.status === 'COLLECTED' || donation.status === 'DELIVERED') {
    const error = new Error(
      `Cannot cancel donation. It has already progressed to '${donation.status}'. Please contact the matched organization directly.`
    );
    error.status = 409;
    throw error;
  }

  if (donation.status === 'CANCELLED') {
    const error = new Error('Donation is already cancelled.');
    error.status = 400;
    throw error;
  }

  donation.status = 'CANCELLED';
  donation.cancellationReason = typeof reason === 'string' ? reason.trim() : '';
  donation.cancelledAt = new Date();

  await donation.save();
  return donation;
};

export default {
  validateDonationPayload,
  createDonationListing,
  getAvailableDonationsFeed,
  getDonorListings,
  getDonationDetails,
  updateDonationListing,
  cancelDonationListing,
  expirePastDueDonations
};
