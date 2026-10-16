import mongoose from 'mongoose';
import Donation from '../../models/Donation.js';
import User from '../../models/User.js';

/**
 * Configurable Matching Weights (Total = 100 points)
 */
export const DEFAULT_MATCHING_WEIGHTS = {
  proximity: 35,
  capacity: 25,
  schedule: 20,
  foodCompatibility: 20
};

/**
 * Configurable Distance Scoring Bands (km -> points out of proximity weight)
 */
export const DISTANCE_BANDS = [
  { maxKm: 2, points: 35 },
  { maxKm: 5, points: 28 },
  { maxKm: 10, points: 20 },
  { maxKm: 20, points: 10 }
];

/**
 * Calculates the Haversine distance in kilometres between two coordinates.
 * Supports GeoJSON [longitude, latitude] arrays or objects { latitude, longitude } / { lat, lng }.
 *
 * @param {Array<number>|Object} coord1
 * @param {Array<number>|Object} coord2
 * @returns {number|null} Distance in km rounded to 2 decimal places, or null if invalid
 */
export const calculateHaversineDistanceKm = (coord1, coord2) => {
  if (!coord1 || !coord2) return null;

  const extractCoords = (c) => {
    if (Array.isArray(c) && c.length === 2) {
      // GeoJSON format: [longitude, latitude]
      return { lng: Number(c[0]), lat: Number(c[1]) };
    }
    if (typeof c === 'object') {
      const lat = Number(c.latitude !== undefined ? c.latitude : c.lat);
      const lng = Number(c.longitude !== undefined ? c.longitude : c.lng);
      return { lat, lng };
    }
    return null;
  };

  const c1 = extractCoords(coord1);
  const c2 = extractCoords(coord2);

  if (!c1 || !c2) return null;
  if (isNaN(c1.lat) || isNaN(c1.lng) || isNaN(c2.lat) || isNaN(c2.lng)) return null;

  // Validate geographical coordinate ranges
  if (c1.lat < -90 || c1.lat > 90 || c2.lat < -90 || c2.lat > 90) return null;
  if (c1.lng < -180 || c1.lng > 180 || c2.lng < -180 || c2.lng > 180) return null;

  // Ignore default zero coordinates if uninitialized
  if (c1.lat === 0 && c1.lng === 0) return null;
  if (c2.lat === 0 && c2.lng === 0) return null;

  const toRad = (degree) => (degree * Math.PI) / 180;
  const R = 6371; // Earth's mean radius in kilometres

  const dLat = toRad(c2.lat - c1.lat);
  const dLng = toRad(c2.lng - c1.lng);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(c1.lat)) * Math.cos(toRad(c2.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100;
};

/**
 * Checks hard eligibility rules for an NGO and a donation.
 * An NGO is ineligible if:
 * 1. Account is inactive
 * 2. Donation is not AVAILABLE or already past pickup deadline
 * 3. NGO explicitly does not accept the donation's food type
 * 4. Donation location exceeds the NGO's explicitly configured service radius
 * 5. NGO is marked as temporarily unavailable for pickups
 *
 * @param {Object} ngo
 * @param {Object} donation
 * @param {number|null} distanceKm
 * @param {number} now
 * @returns {{ eligible: boolean, reason?: string }}
 */
export const checkNgoEligibility = (ngo, donation, distanceKm, now = Date.now()) => {
  if (ngo.isActive === false) {
    return { eligible: false, reason: 'NGO account is inactive or suspended.' };
  }

  if (donation.status !== 'AVAILABLE') {
    return { eligible: false, reason: `Donation is currently in '${donation.status}' state and not open for matching.` };
  }

  const deadlineMs = new Date(donation.pickupDeadline).getTime();
  if (isNaN(deadlineMs) || deadlineMs <= now) {
    return { eligible: false, reason: 'Donation pickup deadline has already passed.' };
  }

  if (ngo.isAvailable === false) {
    return { eligible: false, reason: 'NGO has temporarily paused accepting new donations.' };
  }

  // Explicit food type rejection
  if (
    Array.isArray(ngo.acceptedFoodTypes) &&
    ngo.acceptedFoodTypes.length > 0 &&
    !ngo.acceptedFoodTypes.includes(donation.foodType)
  ) {
    return {
      eligible: false,
      reason: `NGO explicitly accepts only [${ngo.acceptedFoodTypes.join(', ')}], incompatible with ${donation.foodType}.`
    };
  }

  // Configured service area restriction
  const maxRadius = typeof ngo.serviceRadiusKm === 'number' && ngo.serviceRadiusKm > 0
    ? ngo.serviceRadiusKm
    : 20;

  if (distanceKm !== null && distanceKm > maxRadius) {
    return {
      eligible: false,
      reason: `Donation is ${distanceKm} km away, exceeding the NGO's configured maximum service radius of ${maxRadius} km.`
    };
  }

  return { eligible: true };
};

/**
 * Criterion 1: Proximity Scoring (Max points: weights.proximity)
 */
export const scoreProximity = (distanceKm, serviceRadiusKm = 20, weights = DEFAULT_MATCHING_WEIGHTS) => {
  const maxPoints = weights.proximity;

  if (distanceKm === null || distanceKm === undefined) {
    return {
      score: 0,
      maxPoints,
      distanceKm: null,
      status: 'UNKNOWN',
      reason: 'Geographical coordinates not available; proximity score cannot be computed.',
      warning: 'Missing location coordinates.'
    };
  }

  let score = 0;
  if (distanceKm <= 2) {
    score = 35;
  } else if (distanceKm <= 5) {
    score = 28;
  } else if (distanceKm <= 10) {
    score = 20;
  } else if (distanceKm <= 20) {
    score = 10;
  } else if (distanceKm <= serviceRadiusKm) {
    // Permitted by extended service radius
    score = 5;
  } else {
    score = 0;
  }

  // Scale if custom weights are used
  const normalizedScore = Math.round((score / 35) * maxPoints);

  return {
    score: normalizedScore,
    maxPoints,
    distanceKm,
    status: distanceKm <= 5 ? 'EXCELLENT' : distanceKm <= 10 ? 'GOOD' : 'FAIR',
    reason: `Located ${distanceKm} km away (within ${serviceRadiusKm} km service area).`,
    warning: null
  };
};

/**
 * Criterion 2: Capacity Suitability Scoring (Max points: weights.capacity)
 */
export const scoreCapacity = (donationServings, ngoServingCapacity, weights = DEFAULT_MATCHING_WEIGHTS) => {
  const maxPoints = weights.capacity;

  if (!ngoServingCapacity || ngoServingCapacity <= 0) {
    return {
      score: Math.round(maxPoints * 0.5), // Neutral 50%
      maxPoints,
      status: 'UNKNOWN',
      reason: 'NGO serving capacity information is not declared; suitability cannot be fully verified.',
      warning: 'Capacity information is not available.'
    };
  }

  const srv = Number(donationServings);
  const cap = Number(ngoServingCapacity);

  if (cap >= srv) {
    // Capacity is sufficient
    const ratio = cap / srv;
    // Ideal match when capacity is 1x to 4x of donation
    const score = ratio <= 4 ? maxPoints : Math.round(maxPoints * 0.9);
    return {
      score,
      maxPoints,
      status: 'SUFFICIENT',
      reason: `Declared capacity (${cap} people/day) is sufficient for all ${srv} servings.`,
      warning: null
    };
  }

  // Capacity is less than donation servings
  const ratio = cap / srv;
  if (ratio >= 0.6) {
    const score = Math.round(maxPoints * 0.45);
    return {
      score,
      maxPoints,
      status: 'PARTIAL',
      reason: `Donation (${srv} servings) moderately exceeds declared capacity (${cap} servings); partial distribution likely.`,
      warning: 'Donation may exceed the NGO\'s declared capacity.'
    };
  }

  const score = Math.max(2, Math.round(maxPoints * 0.2));
  return {
    score,
    maxPoints,
    status: 'INSUFFICIENT',
    reason: `Donation (${srv} servings) significantly exceeds declared daily capacity (${cap} servings).`,
    warning: 'Donation clearly exceeds the NGO\'s declared capacity.'
  };
};

/**
 * Criterion 3: Operating Schedule & Pickup Feasibility (Max points: weights.schedule)
 */
export const scoreOperatingSchedule = (
  donationDeadline,
  ngo,
  distanceKm,
  weights = DEFAULT_MATCHING_WEIGHTS,
  now = Date.now()
) => {
  const maxPoints = weights.schedule;
  const deadlineMs = new Date(donationDeadline).getTime();
  const timeRemainingHours = (deadlineMs - now) / (1000 * 60 * 60);

  // Clearly labeled distance-based travel heuristic (assuming urban transit avg 25 km/h + 30 min preparation buffer)
  const estimatedTransitHours = distanceKm !== null ? (distanceKm / 25) + 0.5 : null;

  // Check if NGO operating schedule or hours are available
  const hasHours = Boolean(ngo.operatingHours?.start && ngo.operatingHours?.end);
  const hasScheduleText = Boolean(ngo.operatingSchedule && ngo.operatingSchedule.trim());

  if (!hasHours && !hasScheduleText) {
    return {
      score: Math.round(maxPoints * 0.5), // Neutral 50%
      maxPoints,
      status: 'UNKNOWN',
      timeRemainingHours: Math.max(0, Math.round(timeRemainingHours * 10) / 10),
      estimatedTransitHours: estimatedTransitHours ? Math.round(estimatedTransitHours * 10) / 10 : null,
      reason: `Pickup deadline is in ${timeRemainingHours.toFixed(1)}h. Operating schedule is unknown; pickup feasibility should be confirmed directly.`,
      warning: 'Operating schedule or pickup hours not specified on profile.'
    };
  }

  // Tight pickup window check: if estimated transit exceeds time remaining
  if (estimatedTransitHours !== null && timeRemainingHours < estimatedTransitHours) {
    return {
      score: Math.round(maxPoints * 0.25),
      maxPoints,
      status: 'TIGHT_WINDOW',
      timeRemainingHours: Math.max(0, Math.round(timeRemainingHours * 10) / 10),
      estimatedTransitHours: Math.round(estimatedTransitHours * 10) / 10,
      reason: `Tight pickup window: ${timeRemainingHours.toFixed(1)}h remaining before deadline (estimated travel & prep: ~${estimatedTransitHours.toFixed(1)}h).`,
      warning: 'Urgent pickup coordination required.'
    };
  }

  // Operating window is feasible
  return {
    score: maxPoints,
    maxPoints,
    status: 'FEASIBLE',
    timeRemainingHours: Math.max(0, Math.round(timeRemainingHours * 10) / 10),
    estimatedTransitHours: estimatedTransitHours ? Math.round(estimatedTransitHours * 10) / 10 : null,
    reason: `Pickup window is feasible: ${timeRemainingHours.toFixed(1)}h remaining before deadline within registered operating hours.`,
    warning: null
  };
};

/**
 * Criterion 4: Food Category & Type Compatibility (Max points: weights.foodCompatibility)
 */
export const scoreFoodCompatibility = (donation, ngo, weights = DEFAULT_MATCHING_WEIGHTS) => {
  const maxPoints = weights.foodCompatibility;
  const halfPoints = Math.round(maxPoints / 2);

  let typeScore = halfPoints;
  let typeReason = 'Accepts all food types.';
  let typeWarning = null;

  if (Array.isArray(ngo.acceptedFoodTypes) && ngo.acceptedFoodTypes.length > 0) {
    if (ngo.acceptedFoodTypes.includes(donation.foodType)) {
      typeScore = halfPoints;
      typeReason = `Accepts ${donation.foodType} food items.`;
    } else {
      typeScore = 0;
      typeReason = `Does not accept ${donation.foodType}.`;
      typeWarning = `Preference mismatch: ${donation.foodType} not accepted.`;
    }
  } else {
    // Missing preferences: treat as unknown, not automatic incompatibility
    typeScore = Math.round(halfPoints * 0.7);
    typeReason = 'Food type preferences unspecified; compatibility assumed.';
  }

  let catScore = halfPoints;
  let catReason = 'Accepts all food categories.';
  let catWarning = null;

  if (Array.isArray(ngo.acceptedCategories) && ngo.acceptedCategories.length > 0) {
    if (ngo.acceptedCategories.includes(donation.category)) {
      catScore = halfPoints;
      catReason = `Explicitly accepts category "${donation.category}".`;
    } else {
      catScore = 2;
      catReason = `Category "${donation.category}" not in declared accepted categories [${ngo.acceptedCategories.join(', ')}].`;
      catWarning = `Category "${donation.category}" is outside declared preferred categories.`;
    }
  }

  const totalScore = typeScore + catScore;
  const reasons = [typeReason, catReason].filter(Boolean);
  const warnings = [typeWarning, catWarning].filter(Boolean);

  return {
    score: totalScore,
    maxPoints,
    status: totalScore >= 16 ? 'HIGH' : totalScore >= 10 ? 'MODERATE' : 'LOW',
    reasons,
    warning: warnings.length > 0 ? warnings.join('; ') : null
  };
};

/**
 * Calculates a complete match evaluation for an NGO against a donation.
 *
 * @param {Object} ngo
 * @param {Object} donation
 * @param {Object} weights
 * @param {number} now
 * @returns {Object} Comprehensive evaluation including totalScore, criteria breakdown, reasons, and warnings
 */
export const calculateNgoMatchScore = (
  ngo,
  donation,
  weights = DEFAULT_MATCHING_WEIGHTS,
  now = Date.now()
) => {
  // Extract donation coordinates
  const donationCoords = donation.location?.coordinates;
  const ngoCoords = ngo.location?.coordinates;

  const distanceKm = calculateHaversineDistanceKm(donationCoords, ngoCoords);
  const eligibility = checkNgoEligibility(ngo, donation, distanceKm, now);

  if (!eligibility.eligible) {
    return {
      eligible: false,
      ineligibilityReason: eligibility.reason,
      totalScore: 0,
      distanceKm
    };
  }

  const proximity = scoreProximity(distanceKm, ngo.serviceRadiusKm || 20, weights);
  const capacity = scoreCapacity(donation.servings, ngo.servingCapacity, weights);
  const schedule = scoreOperatingSchedule(donation.pickupDeadline, ngo, distanceKm, weights, now);
  const foodCompat = scoreFoodCompatibility(donation, ngo, weights);

  const rawScore = proximity.score + capacity.score + schedule.score + foodCompat.score;
  const totalScore = Math.min(100, Math.max(0, Math.round(rawScore)));

  const reasons = [
    proximity.reason,
    capacity.reason,
    schedule.reason,
    ...foodCompat.reasons
  ].filter(Boolean);

  const warnings = [
    proximity.warning,
    capacity.warning,
    schedule.warning,
    foodCompat.warning
  ].filter(Boolean);

  return {
    eligible: true,
    totalScore,
    distanceKm,
    criteria: {
      proximity,
      capacity,
      schedule,
      foodCompatibility: foodCompat
    },
    reasons,
    warnings
  };
};

/**
 * Retrieves and ranks eligible NGOs for a given donation.
 * Only the owner donor (or an admin) is authorized to call this.
 *
 * @param {string} donationId
 * @param {string} requestingUserId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const getRankedNgosForDonation = async (donationId, requestingUserId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(donationId)) {
    const err = new Error('Invalid donation ID format.');
    err.status = 400;
    throw err;
  }

  const donation = await Donation.findById(donationId).lean();
  if (!donation) {
    const err = new Error('Donation not found.');
    err.status = 404;
    throw err;
  }

  // Authorization check: User must own the donation (or be ADMIN)
  const donorId = donation.donor?._id ? donation.donor._id.toString() : donation.donor.toString();
  if (donorId !== requestingUserId.toString() && options.userRole !== 'ADMIN') {
    const err = new Error('Access denied. You do not have permission to view matching NGOs for this listing.');
    err.status = 403;
    throw err;
  }

  // Status check: Expired or non-AVAILABLE listings
  const now = Date.now();
  const deadlineMs = new Date(donation.pickupDeadline).getTime();
  if (donation.status !== 'AVAILABLE' || deadlineMs <= now) {
    return {
      donation: {
        _id: donation._id,
        foodName: donation.foodName,
        status: donation.status,
        servings: donation.servings,
        pickupDeadline: donation.pickupDeadline
      },
      rankedNgos: [],
      totalEligible: 0,
      totalChecked: 0,
      message: donation.status !== 'AVAILABLE'
        ? `Donation is currently in '${donation.status}' status and cannot be matched.`
        : 'Donation pickup deadline has already passed.'
    };
  }

  // Fetch all active NGO users
  const ngos = await User.find({
    role: 'NGO',
    isActive: { $ne: false }
  })
    .select('-password -tokens')
    .lean();

  const ranked = [];
  let totalChecked = 0;
  let ineligibleCount = 0;

  for (const ngo of ngos) {
    totalChecked++;
    const match = calculateNgoMatchScore(ngo, donation, DEFAULT_MATCHING_WEIGHTS, now);

    if (match.eligible) {
      ranked.push({
        ngo: {
          _id: ngo._id,
          organization: ngo.organization || ngo.name,
          address: {
            city: ngo.address?.city || '',
            state: ngo.address?.state || '',
            fullAddress: ngo.address?.fullAddress || ''
          },
          servingCapacity: ngo.servingCapacity || 0,
          serviceRadiusKm: ngo.serviceRadiusKm || 20,
          isVerified: Boolean(ngo.isVerified),
          operatingSchedule: ngo.operatingSchedule || ''
        },
        totalScore: match.totalScore,
        distanceKm: match.distanceKm,
        criteria: match.criteria,
        reasons: match.reasons,
        warnings: match.warnings
      });
    } else {
      ineligibleCount++;
    }
  }

  // Stable, deterministic ranking:
  // 1. totalScore DESC
  // 2. distanceKm ASC
  // 3. organization name ASC
  // 4. _id ASC
  ranked.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    const distA = a.distanceKm !== null ? a.distanceKm : 9999;
    const distB = b.distanceKm !== null ? b.distanceKm : 9999;
    if (distA !== distB) {
      return distA - distB;
    }
    const nameA = a.ngo.organization || '';
    const nameB = b.ngo.organization || '';
    const nameComp = nameA.localeCompare(nameB);
    if (nameComp !== 0) return nameComp;
    return a.ngo._id.toString().localeCompare(b.ngo._id.toString());
  });

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const totalEligible = ranked.length;
  const totalPages = Math.ceil(totalEligible / limit) || 1;
  const paginatedNgos = ranked.slice((page - 1) * limit, page * limit);

  let message = '';
  if (totalEligible === 0) {
    message = 'No eligible NGOs found within service radius or matching criteria. Consider extending the pickup deadline or checking NGO location settings.';
  } else {
    message = `Found ${totalEligible} suitable NGO${totalEligible === 1 ? '' : 's'} ranked by practical suitability.`;
  }

  return {
    donation: {
      _id: donation._id,
      foodName: donation.foodName,
      category: donation.category,
      quantity: donation.quantity,
      quantityUnit: donation.quantityUnit,
      foodType: donation.foodType,
      servings: donation.servings,
      pickupDeadline: donation.pickupDeadline,
      location: donation.location
    },
    rankedNgos: paginatedNgos,
    totalEligible,
    totalChecked,
    ineligibleCount,
    page,
    totalPages,
    limit,
    message
  };
};

/**
 * Retrieves and ranks available donations suitable for a specific NGO.
 * Only the authenticated NGO itself (or an admin) is authorized to call this.
 *
 * @param {string} ngoId
 * @param {string} requestingUserId
 * @param {Object} options
 * @returns {Promise<Object>}
 */
export const getRankedDonationsForNgo = async (ngoId, requestingUserId, options = {}) => {
  if (!mongoose.Types.ObjectId.isValid(ngoId)) {
    const err = new Error('Invalid NGO ID format.');
    err.status = 400;
    throw err;
  }

  // Authorization check: Authenticated user must be this NGO (or ADMIN)
  if (ngoId.toString() !== requestingUserId.toString() && options.userRole !== 'ADMIN') {
    const err = new Error('Access denied. You can only view recommendation feeds for your own NGO organization.');
    err.status = 403;
    throw err;
  }

  const ngo = await User.findById(ngoId).select('-password -tokens').lean();
  if (!ngo || ngo.role !== 'NGO') {
    const err = new Error('NGO profile not found.');
    err.status = 404;
    throw err;
  }

  if (ngo.isActive === false) {
    const err = new Error('NGO account is inactive.');
    err.status = 403;
    throw err;
  }

  const now = Date.now();

  // Query only available and future donations
  const query = {
    status: 'AVAILABLE',
    pickupDeadline: { $gt: new Date(now) }
  };

  const donations = await Donation.find(query)
    .populate('donor', 'organization name')
    .lean();

  const ranked = [];
  let totalChecked = 0;

  for (const donation of donations) {
    totalChecked++;
    const match = calculateNgoMatchScore(ngo, donation, DEFAULT_MATCHING_WEIGHTS, now);

    if (match.eligible) {
      ranked.push({
        donation: {
          _id: donation._id,
          foodName: donation.foodName,
          category: donation.category,
          quantity: donation.quantity,
          quantityUnit: donation.quantityUnit,
          foodType: donation.foodType,
          servings: donation.servings,
          pickupDeadline: donation.pickupDeadline,
          location: {
            address: donation.location?.address || '',
            coordinates: donation.location?.coordinates || []
          },
          donorOrganization: donation.donor?.organization || donation.donor?.name || 'Verified Donor'
        },
        totalScore: match.totalScore,
        distanceKm: match.distanceKm,
        criteria: match.criteria,
        reasons: match.reasons,
        warnings: match.warnings
      });
    }
  }

  // Stable, deterministic ranking:
  // 1. totalScore DESC
  // 2. distanceKm ASC
  // 3. pickupDeadline ASC
  // 4. _id ASC
  ranked.sort((a, b) => {
    if (b.totalScore !== a.totalScore) {
      return b.totalScore - a.totalScore;
    }
    const distA = a.distanceKm !== null ? a.distanceKm : 9999;
    const distB = b.distanceKm !== null ? b.distanceKm : 9999;
    if (distA !== distB) {
      return distA - distB;
    }
    const deadlineA = new Date(a.donation.pickupDeadline).getTime();
    const deadlineB = new Date(b.donation.pickupDeadline).getTime();
    if (deadlineA !== deadlineB) {
      return deadlineA - deadlineB;
    }
    return a.donation._id.toString().localeCompare(b.donation._id.toString());
  });

  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(options.limit, 10) || 10));
  const totalEligible = ranked.length;
  const totalPages = Math.ceil(totalEligible / limit) || 1;
  const paginatedDonations = ranked.slice((page - 1) * limit, page * limit);

  let message = '';
  if (totalEligible === 0) {
    message = 'No available donations match your current serving capacity and pickup distance preferences. Check back soon as new surplus listings are posted.';
  } else {
    message = `Found ${totalEligible} recommended donation${totalEligible === 1 ? '' : 's'} matching your profile.`;
  }

  return {
    ngo: {
      _id: ngo._id,
      organization: ngo.organization,
      servingCapacity: ngo.servingCapacity,
      serviceRadiusKm: ngo.serviceRadiusKm
    },
    rankedDonations: paginatedDonations,
    totalEligible,
    totalChecked,
    page,
    totalPages,
    limit,
    message
  };
};

export default {
  DEFAULT_MATCHING_WEIGHTS,
  DISTANCE_BANDS,
  calculateHaversineDistanceKm,
  checkNgoEligibility,
  scoreProximity,
  scoreCapacity,
  scoreOperatingSchedule,
  scoreFoodCompatibility,
  calculateNgoMatchScore,
  getRankedNgosForDonation,
  getRankedDonationsForNgo
};
