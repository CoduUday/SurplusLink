import mongoose from 'mongoose';

const mealOutcomeSchema = new mongoose.Schema(
  {
    mealScheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MealSchedule',
      required: [true, 'Outcome must be linked to a meal schedule'],
      unique: true, // One outcome per meal schedule
      index: true
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Outcome must be linked to a donor'],
      index: true
    },
    actualMealsServed: {
      type: Number,
      default: null,
      min: [0, 'Actual meals served cannot be negative']
    },
    actualLeftoverQuantity: {
      type: Number,
      required: [true, 'Actual leftover quantity is required'],
      min: [0, 'Actual leftover quantity cannot be negative']
    },
    actualMealEndTime: {
      type: String, // HH:MM (24-hour format)
      required: [true, 'Actual meal end time is required']
    },
    foodReadyForPickup: {
      type: Boolean,
      required: [true, 'Food ready for pickup status is required'],
      default: false
    }
  },
  {
    timestamps: true
  }
);

const MealOutcome = mongoose.model('MealOutcome', mealOutcomeSchema);

export default MealOutcome;
