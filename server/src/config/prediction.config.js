/**
 * Configuration settings for the SurplusLink AI Food Surplus Prediction Engine.
 * Centralizes all baseline rates, duration defaults, and reliability thresholds.
 */

export const PREDICTION_CONFIG = {
  // Algorithm version
  MODEL_VERSION: 'v1.0.0-heuristic-baseline',

  // Baseline surplus rates for cold-start / fallback scenarios (when donor has no historical records)
  // Values represent fraction of prepared food that typically remains as surplus (e.g., 0.12 = 12%)
  BASELINE_SURPLUS_RATES: {
    Vegetarian: 0.12,     // 12% baseline for vegetarian meals
    'Non-vegetarian': 0.15, // 15% baseline for non-vegetarian meals (often higher prep buffer)
    Mixed: 0.14,          // 14% baseline for combined cuisines
    DEFAULT: 0.13         // 13% general default
  },

  // Thresholds for historical record sample size
  MIN_HISTORICAL_RECORDS_FOR_PERSONALIZATION: 1, // Minimum records to attempt weighting
  LIMITED_DATA_THRESHOLD: 3,                    // Records < 3 are considered limited data
  HIGH_CONFIDENCE_THRESHOLD: 7,                 // Records >= 7 allow high reliability if variance is low

  // Variance thresholds for reliability classification
  // Low variance in surplus rates indicates consistent donor food preparation and consumption patterns
  MAX_VARIANCE_FOR_HIGH_RELIABILITY: 0.04,      // stdDev <= 4%
  MAX_VARIANCE_FOR_MEDIUM_RELIABILITY: 0.09,    // stdDev <= 9%

  // Default meal durations (in minutes) from start time to surplus availability
  // Used when donor has not provided expectedServingEndTime and no historical duration data exists
  DEFAULT_MEAL_DURATIONS_MINUTES: {
    Breakfast: 90,           // 1.5 hours
    Lunch: 120,              // 2.0 hours
    Dinner: 150,             // 2.5 hours
    Wedding: 210,            // 3.5 hours
    'College Event': 150,    // 2.5 hours
    'Corporate Event': 120,  // 2.0 hours
    Other: 120               // 2.0 hours default
  },

  // Standard serving duration limits (minutes) to prevent unrealistic edge cases
  MIN_SERVE_DURATION_MINUTES: 30,
  MAX_SERVE_DURATION_MINUTES: 480, // 8 hours max

  // Weighting parameters for historical comparability
  WEIGHTS: {
    BASE: 1.0,
    CATEGORY_MATCH: 2.0,      // Exact food category match
    MEAL_TYPE_MATCH: 2.0,     // Exact meal type match
    ATTENDANCE_SIMILAR: 1.5,  // Attendance within +/- 25%
    QUANTITY_SIMILAR: 1.0,    // Planned quantity within +/- 30%
    MAX_RECENCY_BOOST: 1.0    // Recent meals (within 60 days) get up to +1.0 boost
  },

  // Per-person consumption bounds in kg (used for validation & sanity checks)
  CONSUMPTION_BOUNDS_KG: {
    MIN_PER_PERSON: 0.15, // 150g minimum average consumption
    MAX_PER_PERSON: 1.2   // 1.2kg maximum average consumption
  },

  // Input validation limits
  LIMITS: {
    MIN_ATTENDANCE: 1,
    MAX_ATTENDANCE: 50000,
    MIN_PLANNED_QUANTITY_KG: 0.5,
    MAX_PLANNED_QUANTITY_KG: 10000
  }
};

export default PREDICTION_CONFIG;
