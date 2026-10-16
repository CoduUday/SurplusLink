import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Scale,
  Clock,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import predictionService from '../../services/predictionService';

export default function PredictionFeedbackModal({ prediction, isOpen, onClose, onFeedbackSubmitted }) {
  if (!isOpen || !prediction) return null;

  // Format initial availability time to YYYY-MM-DDTHH:MM for datetime-local input
  const getInitialDateTimeLocal = () => {
    if (!prediction.predictedAvailabilityTime) return '';
    const date = new Date(prediction.predictedAvailabilityTime);
    // Format to local ISO-like string
    const offset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const [actualSurplusKg, setActualSurplusKg] = useState(
    prediction.actualSurplusKg !== null && prediction.actualSurplusKg !== undefined
      ? String(prediction.actualSurplusKg)
      : String(prediction.predictedSurplusKg)
  );
  const [actualAvailabilityTime, setActualAvailabilityTime] = useState(getInitialDateTimeLocal());
  const [feedbackNotes, setFeedbackNotes] = useState(prediction.feedbackNotes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const numActual = Number(actualSurplusKg);

    if (actualSurplusKg === '' || isNaN(numActual) || numActual < 0) {
      setError('Please provide a valid non-negative surplus quantity in kg.');
      return;
    }

    if (numActual > prediction.plannedQuantityKg * 1.05) {
      setError(
        `Actual surplus (${numActual} kg) cannot realistically exceed the planned quantity of ${prediction.plannedQuantityKg} kg.`
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await predictionService.submitFeedback(prediction._id, {
        actualSurplusKg: numActual,
        actualAvailabilityTime: actualAvailabilityTime ? new Date(actualAvailabilityTime) : undefined,
        feedbackNotes
      });

      if (response.success && response.prediction) {
        onFeedbackSubmitted(response.prediction);
        onClose();
      }
    } catch (err) {
      console.error('Feedback submission error:', err);
      const msg =
        err.response?.data?.message || 'Failed to submit feedback. Please verify your inputs.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#21262d] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div>
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-emerald-400 text-xs font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5" /> Post-Meal Feedback
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Record Actual Meal Outcome</h3>
          <p className="text-xs text-slate-400 mt-1">
            Logging actual surplus for <strong className="text-slate-200">{prediction.mealName}</strong> helps train historical weighting for your organization's future predictions.
          </p>
        </div>

        {/* Planned vs Predicted Summary */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Planned Food Quantity</span>
            <span className="text-slate-100 font-bold text-sm">{prediction.plannedQuantityKg} kg</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Model's Predicted Surplus</span>
            <span className="text-emerald-400 font-bold text-sm">{prediction.predictedSurplusKg} kg</span>
          </div>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" />
              Actual Surplus Food Left (kg) <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0"
                max={prediction.plannedQuantityKg * 1.05}
                value={actualSurplusKg}
                onChange={(e) => setActualSurplusKg(e.target.value)}
                placeholder="e.g. 12.5"
                className="w-full pl-4 pr-14 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">
                kg
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Enter 0 if all prepared food was consumed without surplus.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Actual Availability Time
            </label>
            <input
              type="datetime-local"
              value={actualAvailabilityTime}
              onChange={(e) => setActualAvailabilityTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              Observations & Feedback Notes
            </label>
            <textarea
              rows="3"
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="e.g., Higher turnout than expected; dessert had zero surplus while main course had 8kg remaining."
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 placeholder-slate-500 text-xs sm:text-sm outline-none transition"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-slate-300 text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Outcome...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Outcome Feedback</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
