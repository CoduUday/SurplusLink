import React, { useState } from "react";
import {
  Calendar,
  Clock,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { mealScheduleService } from "../services/mealSchedule.service";

export default function MealScheduleModal({ schedule, onClose, onSuccess }) {
  const isEditing = Boolean(schedule && schedule._id);

  const [formData, setFormData] = useState({
    mealDate: schedule?.mealDate || new Date().toISOString().split("T")[0],
    mealType: schedule?.mealType || "Lunch",
    scheduledStartTime: schedule?.scheduledStartTime || "12:00",
    scheduledEndTime: schedule?.scheduledEndTime || "14:00",
    expectedMealsPrepared: schedule?.expectedMealsPrepared ?? "",
    expectedPeopleEating: schedule?.expectedPeopleEating ?? "",
    menuItems: schedule?.menuItems || "",
    isSpecialEvent: schedule?.isSpecialEvent ?? false,
    typicalLeftoverQuantity: schedule?.typicalLeftoverQuantity ?? "",
    preparationStatus: schedule?.preparationStatus || "Not Started",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (!formData.mealDate) {
      setError("Meal date is required.");
      return;
    }

    if (!formData.scheduledStartTime || !formData.scheduledEndTime) {
      setError("Start time and End time are required.");
      return;
    }

    if (formData.scheduledEndTime <= formData.scheduledStartTime) {
      setError("Scheduled end time must follow scheduled start time.");
      return;
    }

    const prepared = parseInt(formData.expectedMealsPrepared, 10);
    const eating = parseInt(formData.expectedPeopleEating, 10);

    if (isNaN(prepared) || prepared <= 0) {
      setError("Expected meals prepared must be a positive integer.");
      return;
    }

    if (isNaN(eating) || eating <= 0) {
      setError("Expected people eating must be a positive integer.");
      return;
    }

    if (eating > prepared) {
      setError("Expected people eating cannot exceed expected meals prepared.");
      return;
    }

    if (!formData.menuItems.trim()) {
      setError("Menu items cannot be empty.");
      return;
    }

    if (
      formData.typicalLeftoverQuantity !== "" &&
      formData.typicalLeftoverQuantity !== null &&
      formData.typicalLeftoverQuantity !== undefined
    ) {
      const leftover = parseInt(formData.typicalLeftoverQuantity, 10);
      if (isNaN(leftover) || leftover < 0) {
        setError("Typical leftover quantity must be a non-negative number.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        expectedMealsPrepared: prepared,
        expectedPeopleEating: eating,
        typicalLeftoverQuantity:
          formData.typicalLeftoverQuantity !== ""
            ? parseInt(formData.typicalLeftoverQuantity, 10)
            : null,
      };

      if (isEditing) {
        await mealScheduleService.update(schedule._id, payload);
      } else {
        await mealScheduleService.create(payload);
      }

      onSuccess();
    } catch (err) {
      console.error("Error saving schedule:", err);
      setError(
        err.response?.data?.message ||
          "Failed to save meal schedule. Please check all fields.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              {isEditing ? "Edit Meal Schedule" : "Add Meal Schedule"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-[#21262d]"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Meal Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meal Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="mealDate"
                value={formData.mealDate}
                onChange={handleChange}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Meal Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meal Type <span className="text-rose-400">*</span>
              </label>
              <select
                name="mealType"
                value={formData.mealType}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
                <option value="Dinner">Dinner</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Scheduled Start Time */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Scheduled Start Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                name="scheduledStartTime"
                value={formData.scheduledStartTime}
                onChange={handleChange}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Scheduled End Time */}
            <div>
              <label className="text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Scheduled End Time <span className="text-rose-400">*</span>
              </label>
              <input
                type="time"
                name="scheduledEndTime"
                value={formData.scheduledEndTime}
                onChange={handleChange}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Expected Meals Prepared */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected Meals Prepared <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                name="expectedMealsPrepared"
                placeholder="e.g. 150"
                value={formData.expectedMealsPrepared}
                onChange={handleChange}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Expected People Eating */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Expected People Eating <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                name="expectedPeopleEating"
                placeholder="e.g. 120 (must be ≤ prepared)"
                value={formData.expectedPeopleEating}
                onChange={handleChange}
                required
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Menu Items */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Menu Items <span className="text-rose-400">*</span>
            </label>
            <textarea
              name="menuItems"
              rows="2"
              placeholder="e.g. Steamed Rice, Dal Tadka, Paneer Butter Masala, Roti, Salad"
              value={formData.menuItems}
              onChange={handleChange}
              required
              className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Typical Leftover Quantity */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Typical Leftover Quantity{" "}
                <span className="text-slate-500">(Optional)</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                name="typicalLeftoverQuantity"
                placeholder="e.g. 15 (historical average)"
                value={formData.typicalLeftoverQuantity}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Preparation Status */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Meal Preparation Status <span className="text-rose-400">*</span>
              </label>
              <select
                name="preparationStatus"
                value={formData.preparationStatus}
                onChange={handleChange}
                className="w-full bg-[#0d1117] border border-[#30363d] rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                <option value="Not Started">Not Started</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Special Event or Holiday Toggle */}
          <div className="pt-2">
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-slate-600 transition">
              <input
                type="checkbox"
                name="isSpecialEvent"
                checked={formData.isSpecialEvent}
                onChange={handleChange}
                className="w-4 h-4 rounded text-emerald-500 bg-[#161b22] border-[#30363d] focus:ring-emerald-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  Special Event or Holiday
                </span>
                <span className="text-[11px] text-slate-400">
                  Enable if this meal coincides with a festival, corporate
                  event, or catering function.
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
              className="px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-xl shadow-sm flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Meal Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
