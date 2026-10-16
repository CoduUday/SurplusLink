import express from 'express';
import {
  createPrediction,
  getPredictions,
  getPredictionById,
  submitPredictionFeedback
} from '../controllers/prediction.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

// All prediction endpoints require authenticated DONOR access
router.use(protect);
router.use(authorize('DONOR'));

router.route('/')
  .post(createPrediction)
  .get(getPredictions);

router.route('/:id')
  .get(getPredictionById);

router.route('/:id/feedback')
  .patch(submitPredictionFeedback);

export default router;
