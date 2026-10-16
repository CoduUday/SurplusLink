import api from './api';

/**
 * Service to interact with the SurplusLink Food Surplus Listing API.
 */
export const donationService = {
  /**
   * Create and publish a new food surplus donation listing.
   * @param {Object} donationData
   */
  async createDonation(donationData) {
    const response = await api.post('/donations', donationData);
    return response.data;
  },

  /**
   * Browse available, non-expired donations for NGOs.
   * @param {Object} params - Query filters (page, limit, category, foodType, search)
   */
  async getAvailableDonations(params = {}) {
    const response = await api.get('/donations', { params });
    return response.data;
  },

  /**
   * Retrieve the authenticated donor's own listings.
   * @param {Object} params - Query filters (page, limit, status)
   */
  async getMyDonations(params = {}) {
    const response = await api.get('/donations/mine', { params });
    return response.data;
  },

  /**
   * Retrieve a single donation's details by ID.
   * @param {string} id
   */
  async getDonationById(id) {
    const response = await api.get(`/donations/${id}`);
    return response.data;
  },

  /**
   * Update an eligible listing owned by the donor.
   * @param {string} id
   * @param {Object} updateData
   */
  async updateDonation(id, updateData) {
    const response = await api.patch(`/donations/${id}`, updateData);
    return response.data;
  },

  /**
   * Cancel an eligible listing owned by the donor.
   * @param {string} id
   * @param {string} cancellationReason
   */
  async cancelDonation(id, cancellationReason = '') {
    const response = await api.delete(`/donations/${id}`, {
      data: { cancellationReason }
    });
    return response.data;
  },

  /**
   * Accept and claim an available food surplus listing (NGO only).
   * @param {string} id
   * @param {Object} acceptanceData - { estimatedPickupTime, acceptNotes }
   */
  async acceptDonation(id, acceptanceData = {}) {
    const response = await api.post(`/donations/${id}/accept`, acceptanceData);
    return response.data;
  },

  /**
   * Retrieve all donations accepted by the authenticated NGO.
   * @param {Object} params - Query filters (page, limit)
   */
  async getMyAcceptedDonations(params = {}) {
    const response = await api.get('/donations/accepted', { params });
    return response.data;
  }
};

export default donationService;
