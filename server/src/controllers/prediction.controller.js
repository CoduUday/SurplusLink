import mongoose from "mongoose";
import Prediction from "../models/Prediction.js";
import { generateSurplusPrediction } from "../services/prediction/surplusPrediction.service.js";

/**
 * @desc    Generate a new surplus prediction and persist it for the authenticated donor
 * @route   POST /api/predictions
 * @access  Private (DONOR only)
 */
export const createPrediction = async (req, res) => {
  try {
    const donorId = req.user._id;

    // Generate prediction using explainable heuristic engine
    const predictionPayload = await generateSurplusPrediction(
      req.body,
      donorId,
    );

    // Save prediction record in database
    const savedPrediction = await Prediction.create(predictionPayload);

    return res.status(201).json({
      success: true,
      message: "Surplus prediction generated and saved successfully.",
      prediction: savedPrediction,
    });
  } catch (error) {
    console.error("Create prediction error:", error);

    if (error.status === 400) {
      return res.status(400).json({
        success: false,
        message: error.message,
        details: error.details || [],
      });
    }

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "An error occurred while generating surplus prediction.",
    });
  }
};

/**
 * @desc    Get paginated prediction history for the authenticated donor
 * @route   GET /api/predictions
 * @access  Private (DONOR only)
 */
export const getPredictions = async (req, res) => {
  try {
    const donorId = req.user._id;
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      50,
      Math.max(1, parseInt(req.query.limit, 10) || 10),
    );
    const skip = (page - 1) * limit;

    const { foodCategory, feedbackStatus, mealType, startDate, endDate } =
      req.query;

    const query = { donor: donorId };

    if (foodCategory) {
      query.foodCategory = foodCategory;
    }
    if (mealType) {
      query.mealType = mealType;
    }
    if (feedbackStatus) {
      query.feedbackStatus = feedbackStatus;
    }

    if (startDate || endDate) {
      query.mealDate = {};
      if (startDate) {
        const parsedStart = new Date(startDate);
        if (!isNaN(parsedStart.getTime())) {
          query.mealDate.$gte = parsedStart;
        }
      }
      if (endDate) {
        const parsedEnd = new Date(endDate);
        if (!isNaN(parsedEnd.getTime())) {
          // Set to end of day
          parsedEnd.setHours(23, 59, 59, 999);
          query.mealDate.$lte = parsedEnd;
        }
      }
    }

    const [predictions, total] = await Promise.all([
      Prediction.find(query)
        .sort({ mealDate: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments(query),
    ]);

    // Aggregate summary metrics for donor dashboard
    const stats = await Prediction.aggregate([
      { $match: { donor: donorId } },
      {
        $group: {
          _id: null,
          totalPredictions: { $sum: 1 },
          totalPredictedKg: { $sum: "$predictedSurplusKg" },
          pendingFeedbackCount: {
            $sum: { $cond: [{ $eq: ["$feedbackStatus", "pending"] }, 1, 0] },
          },
          submittedFeedbackCount: {
            $sum: { $cond: [{ $eq: ["$feedbackStatus", "submitted"] }, 1, 0] },
          },
        },
      },
    ]);

    const summaryStats = stats[0] || {
      totalPredictions: 0,
      totalPredictedKg: 0,
      pendingFeedbackCount: 0,
      submittedFeedbackCount: 0,
    };

    return res.status(200).json({
      success: true,
      count: predictions.length,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      stats: summaryStats,
      predictions,
    });
  } catch (error) {
    console.error("Get predictions error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve prediction history.",
    });
  }
};

/**
 * @desc    Get a single prediction by ID
 * @route   GET /api/predictions/:id
 * @access  Private (DONOR only)
 */
export const getPredictionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prediction ID format.",
      });
    }

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction record not found.",
      });
    }

    // Access control: Ensure donor owns this prediction
    if (prediction.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to view this prediction.",
      });
    }

    return res.status(200).json({
      success: true,
      prediction,
    });
  } catch (error) {
    console.error("Get prediction by ID error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve prediction details.",
    });
  }
};

/**
 * @desc    Submit post-meal actual surplus and availability feedback
 * @route   PATCH /api/predictions/:id/feedback
 * @access  Private (DONOR only)
 */
export const submitPredictionFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualSurplusKg, actualAvailabilityTime, feedbackNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid prediction ID format.",
      });
    }

    const prediction = await Prediction.findById(id);

    if (!prediction) {
      return res.status(404).json({
        success: false,
        message: "Prediction record not found.",
      });
    }

    // Access control: Ensure donor owns this prediction
    if (prediction.donor.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. You do not have permission to modify this prediction.",
      });
    }

    // Validate actual surplus quantity
    const numActualSurplus = Number(actualSurplusKg);
    if (
      actualSurplusKg === undefined ||
      actualSurplusKg === null ||
      isNaN(numActualSurplus) ||
      numActualSurplus < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Actual surplus food quantity must be a non-negative number.",
      });
    }

    // Prevent impossible values: actual surplus cannot exceed prepared quantity + 5% buffer
    if (numActualSurplus > prediction.plannedQuantityKg * 1.05) {
      return res.status(400).json({
        success: false,
        message: `Actual surplus (${numActualSurplus} kg) cannot realistically exceed the planned quantity of ${prediction.plannedQuantityKg} kg.`,
      });
    }

    // Validate actual availability time if provided
    let parsedActualTime = null;
    if (actualAvailabilityTime) {
      parsedActualTime = new Date(actualAvailabilityTime);
      if (isNaN(parsedActualTime.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Actual availability time must be a valid date/time.",
        });
      }
    } else {
      // Default to prediction's predicted availability time if not specified
      parsedActualTime = prediction.predictedAvailabilityTime;
    }

    // Update prediction record with verified outcome
    prediction.actualSurplusKg = Math.round(numActualSurplus * 100) / 100;
    prediction.actualAvailabilityTime = parsedActualTime;
    prediction.feedbackStatus = "submitted";
    prediction.feedbackNotes =
      typeof feedbackNotes === "string" ? feedbackNotes.trim() : "";
    prediction.feedbackSubmittedAt = new Date();

    await prediction.save();

    return res.status(200).json({
      success: true,
      message:
        "Actual meal outcome recorded successfully. Future predictions will incorporate this feedback.",
      prediction,
    });
  } catch (error) {
    console.error("Submit prediction feedback error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to submit prediction feedback.",
    });
  }
};
