import mongoose from 'mongoose';

const mealScheduleSchema = new mongoose.Schema(
  {
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Meal schedule must be associated with a donor'],
      index: true
    },
    mealDate: {
      type: String, // Stored in YYYY-MM-DD for standard calendar dates
      required: [true, 'Meal date is required']
    },
    mealType: {
      type: String,
      enum: {
        values: ['Breakfast', 'Lunch', 'Dinner'],
        message: '{VALUE} is not a valid meal type. Must be Breakfast, Lunch, or Dinner'
      },
      required: [true, 'Meal type is required']
    },
    scheduledStartTime: {
      type: String, // HH:MM (24-hour format)
      required: [true, 'Scheduled start time is required']
    },
    scheduledEndTime: {
      type: String, // HH:MM (24-hour format)
      required: [true, 'Scheduled end time is required']
    },
    expectedMealsPrepared: {
      type: Number,
      required: [true, 'Expected meals prepared is required'],
      min: [1, 'Expected meals prepared must be a positive integer']
    },
    expectedPeopleEating: {
      type: Number,
      required: [true, 'Expected people eating is required'],
      min: [1, 'Expected people eating must be a positive integer']
    },
    menuItems: {
      type: String,
      required: [true, 'Menu items are required'],
      trim: true
    },
    isSpecialEvent: {
      type: Boolean,
      default: false
    },
    typicalLeftoverQuantity: {
      type: Number,
      default: null,
      min: [0, 'Typical leftover quantity cannot be negative']
    },
    preparationStatus: {
      type: String,
      enum: {
        values: ['Not Started', 'In Progress', 'Completed'],
        message: '{VALUE} is not a valid preparation status. Must be Not Started, In Progress, or Completed'
      },
      default: 'Not Started',
      required: [true, 'Preparation status is required']
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual relationship to MealOutcome (one-to-one per schedule)
mealScheduleSchema.virtual('outcome', {
  ref: 'MealOutcome',
  localField: '_id',
  foreignField: 'mealScheduleId',
  justOne: true
});

const MealSchedule = mongoose.model('MealSchedule', mealScheduleSchema);

export default MealSchedule;
