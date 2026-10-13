import { Router } from 'express';
import mongoose from 'mongoose';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Check server and database connectivity status
 * @access  Public
 */
router.get('/', (req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

  res.status(200).json({
    status: 'ok',
    message: 'SurplusLink API is operational',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router;
