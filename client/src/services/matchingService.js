import api from './api';

/**
 * Service to interact with the SurplusLink Smart NGO Matching API.
 */
export const matchingService = {
  /**
   * Retrieve ranked suitable NGOs for a specific food surplus donation.
   * Authorized donors only.
   *
   * @param {string} donationId
   * @param {Object} params - Pagination options { page, limit }
   * @returns {Promise<Object>}
   */
  async getRecommendedNgos(donationId, params = {}) {
    const response = await api.get(`/matching/donations/${donationId}/ngos`, { params });
    return response.data;
  },

  /**
   * Retrieve ranked available donations recommended for an NGO.
   * Authorized NGO account only.
   *
   * @param {string} ngoId
   * @param {Object} params - Pagination options { page, limit }
   * @returns {Promise<Object>}
   */
  async getRecommendedDonations(ngoId, params = {}) {
    const response = await api.get(`/matching/ngos/${ngoId}/donations`, { params });
    return response.data;
  }
};

export default matchingService;
