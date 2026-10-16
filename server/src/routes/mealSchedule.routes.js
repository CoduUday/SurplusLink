import { Router } from 'express';
import {
  getMealSchedules,
  getMealScheduleById,
  createMealSchedule,
  updateMealSchedule,
  recordMealOutcome,
  getMealSchedulePrediction
} from '../controllers/mealSchedule.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = Router();

// All routes require authentication and DONOR role
router.use(protect);
router.use(authorize('DONOR'));

router.route('/')
  .get(getMealSchedules)
  .post(createMealSchedule);

router.route('/:id')
  .get(getMealScheduleById)
  .put(updateMealSchedule);

router.route('/:id/prediction')
  .get(getMealSchedulePrediction);

router.route('/:id/outcome')
  .post(recordMealOutcome);

export default router;
