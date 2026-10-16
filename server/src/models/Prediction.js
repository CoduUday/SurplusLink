import mongoose from 'mongoose';
import PREDICTION_CONFIG from '../config/prediction.config.js';

const predictionSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Donor ID is required'],
      index: true
    },
    mealName: {
      type: String,
      required: [true, 'Meal or event name is required'],
      trim: true,
      maxlength: [120, 'Meal name cannot exceed 120 characters']
    },
    mealType: {
      type: String,
      enum: {
        values: [
          'Breakfast',
          'Lunch',
          'Dinner',
          'Wedding',
          'College Event',
          'Corporate Event',
          'Other'
        ],
        message: '{VALUE} is not a valid meal type'
      },
      default: 'Lunch'
    },
    foodCategory: {
      type: String,
      enum: {
        values: ['Vegetarian', 'Non-vegetarian', 'Mixed'],
        message: '{VALUE} is not a valid food category'
      },
      required: [true, 'Food category is required']
    },
    mealDate: {
      type: Date,
      required: [true, 'Meal date is required']
    },
    scheduledStartTime: {
      type: String,
      required: [true, 'Scheduled start time is required'],
      trim: true,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Scheduled start time must be in 24-hour HH:MM format'
      ]
    },
    expectedServingEndTime: {
      type: String,
      trim: true,
      match: [
        /^([01]\d|2[0-3]):([0-5]\d)$/,
        'Serving end time must be in 24-hour HH:MM format'
      ],
      default: null
    },
    expectedAttendance: {
      type: Number,
      required: [true, 'Expected attendance is required'],
      min: [
        PREDICTION_CONFIG.LIMITS.MIN_ATTENDANCE,
        `Expected attendance must be at least ${PREDICTION_CONFIG.LIMITS.MIN_ATTENDANCE}`
      ],
      max: [
        PREDICTION_CONFIG.LIMITS.MAX_ATTENDANCE,
        `Expected attendance cannot exceed ${PREDICTION_CONFIG.LIMITS.MAX_ATTENDANCE}`
      ]
    },
    plannedQuantityKg: {
      type: Number,
      required: [true, 'Planned food quantity in kg is required'],
      min: [
        PREDICTION_CONFIG.LIMITS.MIN_PLANNED_QUANTITY_KG,
        `Planned quantity must be at least ${PREDICTION_CONFIG.LIMITS.MIN_PLANNED_QUANTITY_KG} kg`
      ],
      max: [
        PREDICTION_CONFIG.LIMITS.MAX_PLANNED_QUANTITY_KG,
        `Planned quantity cannot exceed ${PREDICTION_CONFIG.LIMITS.MAX_PLANNED_QUANTITY_KG} kg`
      ]
    },
    // Prediction Outputs
    predictedSurplusKg: {
      type: Number,
      required: true,
      min: [0, 'Predicted surplus cannot be negative']
    },
    estimatedSurplusRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    predictedAvailabilityTime: {
      type: Date,
      required: true
    },
    availabilityTimeSource: {
      type: String,
      enum: ['donor_input', 'historical_median', 'default_assumption'],
      required: true
    },
    predictionMethod: {
      type: String,
      enum: ['historical_weighted_average', 'baseline_fallback'],
      required: true
    },
    reliabilityLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      required: true
    },
    historicalRecordsUsed: {
      type: Number,
      default: 0,
      min: 0
    },
    historicalVariance: {
      type: Number,
      default: 0
    },
    modelVersion: {
      type: String,
      default: PREDICTION_CONFIG.MODEL_VERSION
    },
    explanation: {
      type: String,
      required: true
    },
    assumptions: {
      type: [String],
      default: []
    },

    // Post-Meal Feedback & Actual Outcomes
    actualSurplusKg: {
      type: Number,
      default: null,
      min: [0, 'Actual surplus cannot be negative']
    },
    actualAvailabilityTime: {
      type: Date,
      default: null
    },
    feedbackStatus: {
      type: String,
      enum: ['pending', 'submitted', 'skipped'],
      default: 'pending',
      index: true
    },
    feedbackNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback notes cannot exceed 500 characters'],
      default: ''
    },
    feedbackSubmittedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for optimal queries
predictionSchema.index({ donor: 1, mealDate: -1 });
predictionSchema.index({ donor: 1, feedbackStatus: 1 });
predictionSchema.index({ donor: 1, foodCategory: 1 });
predictionSchema.index({ donor: 1, mealType: 1 });

const Prediction = mongoose.model('Prediction', predictionSchema);
export default Prediction;
