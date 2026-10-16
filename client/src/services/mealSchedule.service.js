import api from "./api";

export const mealScheduleService = {
  // Get all meal schedules for current donor
  getAll: async () => {
    const res = await api.get("/meal-schedules");
    return res.data;
  },

  // Get single meal schedule
  getById: async (id) => {
    const res = await api.get(`/meal-schedules/${id}`);
    return res.data;
  },

  // Create new meal schedule
  create: async (data) => {
    const res = await api.post("/meal-schedules", data);
    return res.data;
  },

  // Update existing meal schedule
  update: async (id, data) => {
    const res = await api.put(`/meal-schedules/${id}`, data);
    return res.data;
  },

  // Record or update actual outcome
  recordOutcome: async (scheduleId, outcomeData) => {
    const res = await api.post(
      `/meal-schedules/${scheduleId}/outcome`,
      outcomeData,
    );
    return res.data;
  },

  // Get surplus prediction for meal schedule
  getPrediction: async (scheduleId) => {
    const res = await api.get(`/meal-schedules/${scheduleId}/prediction`);
    return res.data;
  },
};
