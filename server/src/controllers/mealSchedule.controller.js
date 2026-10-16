import MealSchedule from '../models/MealSchedule.js';
import MealOutcome from '../models/MealOutcome.js';

/**
 * Helper to validate schedule fields
 */
const validateScheduleInput = (data) => {
  const {
    mealDate,
    mealType,
    scheduledStartTime,
    scheduledEndTime,
    expectedMealsPrepared,
    expectedPeopleEating,
    menuItems,
    isSpecialEvent,
    typicalLeftoverQuantity,
    preparationStatus
  } = data;

  const errors = [];

  if (!mealDate) errors.push('Meal date is required.');
  if (!mealType || !['Breakfast', 'Lunch', 'Dinner'].includes(mealType)) {
    errors.push('Meal type must be Breakfast, Lunch, or Dinner.');
  }

  // Time format regex check (HH:MM)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!scheduledStartTime || !timeRegex.test(scheduledStartTime)) {
    errors.push('Scheduled start time must be in HH:MM format.');
  }
  if (!scheduledEndTime || !timeRegex.test(scheduledEndTime)) {
    errors.push('Scheduled end time must be in HH:MM format.');
  }

  // End time must follow start time (support standard same-day schedules)
  if (scheduledStartTime && scheduledEndTime && timeRegex.test(scheduledStartTime) && timeRegex.test(scheduledEndTime)) {
    if (scheduledEndTime <= scheduledStartTime) {
      errors.push('Scheduled end time must follow scheduled start time.');
    }
  }

  // Expected quantities validation
  const mealsPrepared = Number(expectedMealsPrepared);
  const peopleEating = Number(expectedPeopleEating);

  if (isNaN(mealsPrepared) || mealsPrepared <= 0 || !Number.isInteger(mealsPrepared)) {
    errors.push('Expected meals prepared must be a positive integer.');
  }

  if (isNaN(peopleEating) || peopleEating <= 0 || !Number.isInteger(peopleEating)) {
    errors.push('Expected people eating must be a positive integer.');
  }

  if (!isNaN(mealsPrepared) && !isNaN(peopleEating) && peopleEating > mealsPrepared) {
    errors.push('Expected people eating cannot exceed expected meals prepared.');
  }

  if (!menuItems || !menuItems.trim()) {
    errors.push('Menu items cannot be empty.');
  }

  if (typicalLeftoverQuantity !== undefined && typicalLeftoverQuantity !== null && typicalLeftoverQuantity !== '') {
    const typical = Number(typicalLeftoverQuantity);
    if (isNaN(typical) || typical < 0) {
      errors.push('Typical leftover quantity must be a non-negative number.');
    }
  }

  const validStatuses = ['Not Started', 'In Progress', 'Completed'];
  if (preparationStatus && !validStatuses.includes(preparationStatus)) {
    errors.push('Preparation status must be Not Started, In Progress, or Completed.');
  }

  return errors;
};

/**
 * @desc    Get all meal schedules for the authenticated donor
 * @route   GET /api/meal-schedules
 * @access  Private (Donor only)
 */
export const getMealSchedules = async (req, res) => {
  try {
    const schedules = await MealSchedule.find({ donorId: req.user._id })
      .populate('outcome')
      .sort({ mealDate: -1, scheduledStartTime: -1 });

    res.status(200).json({
      success: true,
      count: schedules.length,
      data: schedules
    });
  } catch (error) {
    console.error('Error fetching meal schedules:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal schedules.'
    });
  }
};

/**
 * @desc    Get single meal schedule by ID
 * @route   GET /api/meal-schedules/:id
 * @access  Private (Donor only)
 */
export const getMealScheduleById = async (req, res) => {
  try {
    const schedule = await MealSchedule.findOne({
      _id: req.params.id,
      donorId: req.user._id
    }).populate('outcome');

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Meal schedule not found or unauthorized access.'
      });
    }

    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('Error fetching meal schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meal schedule.'
    });
  }
};

/**
 * @desc    Create new meal schedule
 * @route   POST /api/meal-schedules
 * @access  Private (Donor only)
 */
export const createMealSchedule = async (req, res) => {
  try {
    const errors = validateScheduleInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const {
      mealDate,
      mealType,
      scheduledStartTime,
      scheduledEndTime,
      expectedMealsPrepared,
      expectedPeopleEating,
      menuItems,
      isSpecialEvent,
      typicalLeftoverQuantity,
      preparationStatus
    } = req.body;

    const newSchedule = await MealSchedule.create({
      donorId: req.user._id,
      mealDate,
      mealType,
      scheduledStartTime,
      scheduledEndTime,
      expectedMealsPrepared: Number(expectedMealsPrepared),
      expectedPeopleEating: Number(expectedPeopleEating),
      menuItems: menuItems.trim(),
      isSpecialEvent: Boolean(isSpecialEvent),
      typicalLeftoverQuantity:
        typicalLeftoverQuantity !== undefined &&
        typicalLeftoverQuantity !== null &&
        typicalLeftoverQuantity !== ''
          ? Number(typicalLeftoverQuantity)
          : null,
      preparationStatus: preparationStatus || 'Not Started'
    });

    res.status(201).json({
      success: true,
      message: 'Meal schedule created successfully.',
      data: newSchedule
    });
  } catch (error) {
    console.error('Error creating meal schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create meal schedule.'
    });
  }
};

/**
 * @desc    Update existing meal schedule
 * @route   PUT /api/meal-schedules/:id
 * @access  Private (Donor only)
 */
export const updateMealSchedule = async (req, res) => {
  try {
    const schedule = await MealSchedule.findOne({
      _id: req.params.id,
      donorId: req.user._id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Meal schedule not found or unauthorized access.'
      });
    }

    const errors = validateScheduleInput(req.body);
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const {
      mealDate,
      mealType,
      scheduledStartTime,
      scheduledEndTime,
      expectedMealsPrepared,
      expectedPeopleEating,
      menuItems,
      isSpecialEvent,
      typicalLeftoverQuantity,
      preparationStatus
    } = req.body;

    schedule.mealDate = mealDate;
    schedule.mealType = mealType;
    schedule.scheduledStartTime = scheduledStartTime;
    schedule.scheduledEndTime = scheduledEndTime;
    schedule.expectedMealsPrepared = Number(expectedMealsPrepared);
    schedule.expectedPeopleEating = Number(expectedPeopleEating);
    schedule.menuItems = menuItems.trim();
    schedule.isSpecialEvent = Boolean(isSpecialEvent);
    schedule.typicalLeftoverQuantity =
      typicalLeftoverQuantity !== undefined &&
      typicalLeftoverQuantity !== null &&
      typicalLeftoverQuantity !== ''
        ? Number(typicalLeftoverQuantity)
        : null;
    schedule.preparationStatus = preparationStatus || schedule.preparationStatus;

    await schedule.save();

    // Populate outcome if any
    const updated = await MealSchedule.findById(schedule._id).populate('outcome');

    res.status(200).json({
      success: true,
      message: 'Meal schedule updated successfully.',
      data: updated
    });
  } catch (error) {
    console.error('Error updating meal schedule:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update meal schedule.'
    });
  }
};

/**
 * @desc    Record or update actual meal outcome
 * @route   POST /api/meal-schedules/:id/outcome
 * @access  Private (Donor only)
 */
export const recordMealOutcome = async (req, res) => {
  try {
    const schedule = await MealSchedule.findOne({
      _id: req.params.id,
      donorId: req.user._id
    });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: 'Meal schedule not found or unauthorized access.'
      });
    }

    const {
      actualMealsServed,
      actualLeftoverQuantity,
      actualMealEndTime,
      foodReadyForPickup
    } = req.body;

    const errors = [];
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!actualMealEndTime || !timeRegex.test(actualMealEndTime)) {
      errors.push('Actual meal end time is required in HH:MM format.');
    }

    if (actualLeftoverQuantity === undefined || actualLeftoverQuantity === null || actualLeftoverQuantity === '') {
      errors.push('Actual leftover quantity is required.');
    } else {
      const leftover = Number(actualLeftoverQuantity);
      if (isNaN(leftover) || leftover < 0) {
        errors.push('Actual leftover quantity must be a non-negative integer.');
      }
    }

    if (foodReadyForPickup === undefined || foodReadyForPickup === null) {
      errors.push('Food ready for pickup confirmation is required.');
    }

    if (actualMealsServed !== undefined && actualMealsServed !== null && actualMealsServed !== '') {
      const served = Number(actualMealsServed);
      if (isNaN(served) || served < 0) {
        errors.push('Actual meals served must be a non-negative integer.');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: errors[0],
        errors
      });
    }

    const outcomeData = {
      mealScheduleId: schedule._id,
      donorId: req.user._id,
      actualMealsServed:
        actualMealsServed !== undefined && actualMealsServed !== null && actualMealsServed !== ''
          ? Number(actualMealsServed)
          : null,
      actualLeftoverQuantity: Number(actualLeftoverQuantity),
      actualMealEndTime,
      foodReadyForPickup: Boolean(foodReadyForPickup)
    };

    // Find existing outcome or create new one
    let outcome = await MealOutcome.findOne({
      mealScheduleId: schedule._id,
      donorId: req.user._id
    });

    if (outcome) {
      outcome.actualMealsServed = outcomeData.actualMealsServed;
      outcome.actualLeftoverQuantity = outcomeData.actualLeftoverQuantity;
      outcome.actualMealEndTime = outcomeData.actualMealEndTime;
      outcome.foodReadyForPickup = outcomeData.foodReadyForPickup;
      await outcome.save();
    } else {
      outcome = await MealOutcome.create(outcomeData);
    }

    // Also update preparation status of the schedule to 'Completed' if meal finished
    if (schedule.preparationStatus !== 'Completed') {
      schedule.preparationStatus = 'Completed';
      await schedule.save();
    }

    const updatedSchedule = await MealSchedule.findById(schedule._id).populate('outcome');

    res.status(200).json({
      success: true,
      message: 'Actual meal outcome saved successfully.',
      data: outcome,
      schedule: updatedSchedule
    });
  } catch (error) {
    console.error('Error recording actual outcome:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to record actual meal outcome.'
    });
  }
};
