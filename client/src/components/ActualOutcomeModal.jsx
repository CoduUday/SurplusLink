import React, { useState } from 'react';
import { PackageCheck, Clock, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { mealScheduleService } from '../services/mealSchedule.service';

export default function ActualOutcomeModal({ schedule, onClose, onSuccess }) {
  const existingOutcome = schedule?.outcome;
  const isEditing = Boolean(existingOutcome && existingOutcome._id);

  const [formData, setFormData] = useState({
    actualMealsServed: existingOutcome?.actualMealsServed ?? '',
    actualLeftoverQuantity: existingOutcome?.actualLeftoverQuantity ?? '',
    actualMealEndTime:
      existingOutcome?.actualMealEndTime ||
      schedule?.scheduledEndTime ||
      '14:00',
    foodReadyForPickup: existingOutcome?.foodReadyForPickup ?? false
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.actualMealEndTime) {
      setError('Actual meal end time is required.');
      return;
    }

    if (
      formData.actualLeftoverQuantity === '' ||
      formData.actualLeftoverQuantity === null ||
      formData.actualLeftoverQuantity === undefined
    ) {
      setError('Actual leftover quantity is required.');
      return;
    }

    const leftover = parseInt(formData.actualLeftoverQuantity, 10);
    if (isNaN(leftover) || leftover < 0) {
      setError('Actual leftover quantity must be a non-negative integer.');
      return;
    }

    let served = null;
    if (
      formData.actualMealsServed !== '' &&
      formData.actualMealsServed !== null &&
      formData.actualMealsServed !== undefined
    ) {
      served = parseInt(formData.actualMealsServed, 10);
      if (isNaN(served) || served < 0) {
        setError('Actual meals served must be a non-negative integer.');
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        actualMealsServed: served,
        actualLeftoverQuantity: leftover,
        actualMealEndTime: formData.actualMealEndTime,
        foodReadyForPickup: Boolean(formData.foodReadyForPickup)
      };

      await mealScheduleService.recordOutcome(schedule._id, payload);
      onSuccess();
    } catch (err) {
      console.error('Error saving actual outcome:', err);
      setError(
        err.response?.data?.message ||
          'Failed to record actual meal outcome. Please verify all inputs.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2 tracking-tight">
              <PackageCheck className="w-5 h-5 text-amber-400" />
              {isEditing ? 'Edit Actual Meal Outcome' : 'Record Actual Meal Outcome'}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Logged for <strong className="text-slate-200">{schedule?.mealType}</strong> on{' '}
              <strong className="text-slate-200">{schedule?.mealDate}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-[#21262d] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Schedule Context Recap */}
        <div className="mt-4 p-3.5 bg-[#0d1117] border border-[#30363d] rounded-xl text-xs space-y-1.5 text-slate-300">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Planned Schedule:</span>
            <span className="font-semibold text-slate-200">
              {schedule?.scheduledStartTime} - {schedule?.scheduledEndTime}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Planned Prepared / Eating:</span>
            <span className="font-semibold text-slate-200">
              {schedule?.expectedMealsPrepared} meals / {schedule?.expectedPeopleEating} people
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Menu:</span>
            <span className="font-medium text-slate-200 truncate max-w-[220px]">
              {schedule?.menuItems}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Actual Meals Served (Optional) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Actual Meals Served <span className="text-slate-400 lowercase font-normal">(optional)</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="actualMealsServed"
              placeholder="e.g. 135 (leave blank if uncounted)"
              value={formData.actualMealsServed}
              onChange={handleChange}
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Number of portions actually consumed during this meal.
            </p>
          </div>

          {/* Actual Leftover Quantity (Required) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Actual Leftover Quantity (Meals/Portions) <span className="text-rose-400">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1"
              name="actualLeftoverQuantity"
              placeholder="e.g. 15 (0 if completely consumed)"
              value={formData.actualLeftoverQuantity}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Actual untouched, safe food portions available for redistribution.
            </p>
          </div>

          {/* Actual Meal End Time (Required) */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Actual Meal End Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              name="actualMealEndTime"
              value={formData.actualMealEndTime}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Recorded separately from scheduled end time ({schedule?.scheduledEndTime}).
            </p>
          </div>

          {/* Food Ready for Pickup (Required toggle / Yes/No) */}
          <div className="pt-2">
            <label className="flex items-start gap-3 cursor-pointer p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-slate-600 transition">
              <input
                type="checkbox"
                name="foodReadyForPickup"
                checked={formData.foodReadyForPickup}
                onChange={handleChange}
                className="w-4 h-4 mt-0.5 rounded text-emerald-500 bg-[#161b22] border-[#30363d] focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Food Ready for Pickup Confirmation <span className="text-rose-400">*</span>
                </span>
                <span className="text-[11px] text-slate-400 block mt-0.5">
                  Confirm if the leftover food has been packed, checked for food safety, and is immediately ready for NGO collection.
                </span>
              </div>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Update Outcome' : 'Save Actual Outcome'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
