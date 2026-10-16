import api from './api';

/**
 * Service to interact with the SurplusLink Food Surplus Prediction API.
 */
export const predictionService = {
  /**
   * Generate and persist a surplus prediction for a planned meal.
   * @param {Object} predictionData
   */
  async createPrediction(predictionData) {
    const response = await api.post('/predictions', predictionData);
    return response.data;
  },

  /**
   * Fetch paginated list of predictions for the current donor.
   * @param {Object} params - Query filters (page, limit, foodCategory, feedbackStatus, etc.)
   */
  async getPredictions(params = {}) {
    const response = await api.get('/predictions', { params });
    return response.data;
  },

  /**
   * Fetch a single prediction record by ID.
   * @param {string} id
   */
  async getPredictionById(id) {
    const response = await api.get(`/predictions/${id}`);
    return response.data;
  },

  /**
   * Submit post-meal outcome feedback (actual surplus quantity & availability).
   * @param {string} id
   * @param {Object} feedbackData - { actualSurplusKg, actualAvailabilityTime, feedbackNotes }
   */
  async submitFeedback(id, feedbackData) {
    const response = await api.patch(`/predictions/${id}/feedback`, feedbackData);
    return response.data;
  }
};

export default predictionService;
