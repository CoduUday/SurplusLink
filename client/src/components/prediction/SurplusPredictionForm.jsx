import React, { useState } from 'react';
import {
  Sparkles,
  Utensils,
  Calendar,
  Clock,
  Users,
  Scale,
  AlertCircle,
  HelpCircle,
  Loader2
} from 'lucide-react';
import predictionService from '../../services/predictionService';

export default function SurplusPredictionForm({ onPredictionGenerated }) {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    mealName: '',
    mealType: 'Lunch',
    foodCategory: 'Vegetarian',
    mealDate: today,
    scheduledStartTime: '12:30',
    expectedServingEndTime: '',
    expectedAttendance: '',
    plannedQuantityKg: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);

  const validate = () => {
    const newErrors = {};

    if (!formData.mealName.trim()) {
      newErrors.mealName = 'Please enter a meal or event name.';
    } else if (formData.mealName.trim().length > 120) {
      newErrors.mealName = 'Meal name cannot exceed 120 characters.';
    }

    if (!formData.mealDate) {
      newErrors.mealDate = 'Meal date is required.';
    }

    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!formData.scheduledStartTime || !timeRegex.test(formData.scheduledStartTime)) {
      newErrors.scheduledStartTime = 'Valid start time (HH:MM) is required.';
    }

    if (formData.expectedServingEndTime && !timeRegex.test(formData.expectedServingEndTime)) {
      newErrors.expectedServingEndTime = 'Valid end time (HH:MM) is required.';
    } else if (formData.scheduledStartTime && formData.expectedServingEndTime) {
      const [startH, startM] = formData.scheduledStartTime.split(':').map(Number);
      const [endH, endM] = formData.expectedServingEndTime.split(':').map(Number);
      if (endH * 60 + endM <= startH * 60 + startM) {
        newErrors.expectedServingEndTime = 'Serving end time must be later than start time.';
      }
    }

    const attendance = Number(formData.expectedAttendance);
    if (!formData.expectedAttendance || isNaN(attendance) || attendance < 1) {
      newErrors.expectedAttendance = 'Expected attendance must be at least 1 person.';
    } else if (attendance > 50000) {
      newErrors.expectedAttendance = 'Expected attendance cannot exceed 50,000.';
    }

    const qty = Number(formData.plannedQuantityKg);
    if (!formData.plannedQuantityKg || isNaN(qty) || qty < 0.5) {
      newErrors.plannedQuantityKg = 'Planned quantity must be at least 0.5 kg.';
    } else if (qty > 10000) {
      newErrors.plannedQuantityKg = 'Planned quantity cannot exceed 10,000 kg.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
    if (apiError) setApiError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setApiError(null);

    try {
      const payload = {
        mealName: formData.mealName.trim(),
        mealType: formData.mealType,
        foodCategory: formData.foodCategory,
        mealDate: formData.mealDate,
        scheduledStartTime: formData.scheduledStartTime,
        expectedServingEndTime: formData.expectedServingEndTime || null,
        expectedAttendance: parseInt(formData.expectedAttendance, 10),
        plannedQuantityKg: parseFloat(formData.plannedQuantityKg)
      };

      const response = await predictionService.createPrediction(payload);
      if (response.success && response.prediction) {
        onPredictionGenerated(response.prediction);
      }
    } catch (err) {
      console.error('Prediction submission failed:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.details && err.response.data.details.join(', ')) ||
        'Failed to generate surplus prediction. Please check your inputs and try again.';
      setApiError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-emerald-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> AI Food Surplus Forecaster
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Plan Upcoming Meal & Estimate Surplus</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Provide details of your scheduled event. SurplusLink calculates predicted surplus and estimated availability to alert NGOs in advance.
          </p>
        </div>
      </div>

      {apiError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">Prediction Request Failed</span>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Row 1: Event Name & Meal Type */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" />
              Meal or Event Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              name="mealName"
              value={formData.mealName}
              onChange={handleChange}
              placeholder="e.g., Campus Hostel Lunch, Grand Reception Dinner"
              className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                errors.mealName ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
              } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
            />
            {errors.mealName && <p className="text-xs text-rose-400 mt-1">{errors.mealName}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Meal Occasion
            </label>
            <select
              name="mealType"
              value={formData.mealType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
            >
              <option value="Breakfast">Breakfast</option>
              <option value="Lunch">Lunch</option>
              <option value="Dinner">Dinner</option>
              <option value="Wedding">Wedding</option>
              <option value="College Event">College Event</option>
              <option value="Corporate Event">Corporate Event</option>
              <option value="Other">Other Event</option>
            </select>
          </div>
        </div>

        {/* Row 2: Category, Date, Start Time, End Time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              Food Category <span className="text-rose-400">*</span>
            </label>
            <select
              name="foodCategory"
              value={formData.foodCategory}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
            >
              <option value="Vegetarian">Vegetarian</option>
              <option value="Non-vegetarian">Non-vegetarian</option>
              <option value="Mixed">Mixed</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Meal Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              name="mealDate"
              value={formData.mealDate}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                errors.mealDate ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
              } rounded-xl text-slate-100 text-sm outline-none transition`}
            />
            {errors.mealDate && <p className="text-xs text-rose-400 mt-1">{errors.mealDate}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              Start Time (24h) <span className="text-rose-400">*</span>
            </label>
            <input
              type="time"
              name="scheduledStartTime"
              value={formData.scheduledStartTime}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                errors.scheduledStartTime ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
              } rounded-xl text-slate-100 text-sm outline-none transition`}
            />
            {errors.scheduledStartTime && (
              <p className="text-xs text-rose-400 mt-1">{errors.scheduledStartTime}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              Expected End Time <span className="text-slate-500 text-[10px] lowercase">(optional)</span>
            </label>
            <input
              type="time"
              name="expectedServingEndTime"
              value={formData.expectedServingEndTime}
              onChange={handleChange}
              placeholder="e.g. 15:00"
              className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                errors.expectedServingEndTime ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
              } rounded-xl text-slate-100 text-sm outline-none transition`}
            />
            {errors.expectedServingEndTime && (
              <p className="text-xs text-rose-400 mt-1">{errors.expectedServingEndTime}</p>
            )}
          </div>
        </div>

        {/* Row 3: Expected Attendance & Quantity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                Expected Attendees <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-slate-500">Number of people</span>
            </div>
            <div className="relative">
              <input
                type="number"
                name="expectedAttendance"
                value={formData.expectedAttendance}
                onChange={handleChange}
                min="1"
                max="50000"
                placeholder="e.g., 120"
                className={`w-full pl-4 pr-16 py-2.5 bg-[#0d1117] border ${
                  errors.expectedAttendance ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                people
              </span>
            </div>
            {errors.expectedAttendance && (
              <p className="text-xs text-rose-400 mt-1">{errors.expectedAttendance}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                Food Quantity Prepared <span className="text-rose-400">*</span>
              </label>
              <span className="text-xs text-slate-500">Measured in kilograms</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                name="plannedQuantityKg"
                value={formData.plannedQuantityKg}
                onChange={handleChange}
                min="0.5"
                max="10000"
                placeholder="e.g., 65.0"
                className={`w-full pl-4 pr-14 py-2.5 bg-[#0d1117] border ${
                  errors.plannedQuantityKg ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-500 font-medium">
                kg
              </span>
            </div>
            {errors.plannedQuantityKg && (
              <p className="text-xs text-rose-400 mt-1">{errors.plannedQuantityKg}</p>
            )}
          </div>
        </div>

        {/* Cold-Start & History Note */}
        <div className="p-3.5 rounded-xl bg-[#0d1117] border border-[#30363d] text-xs text-slate-400 flex items-start gap-2.5">
          <HelpCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="text-slate-300 font-medium">How Surplus Prediction Works:</span> The system weights your verified past meals with matching food categories and attendance scales. First-time donors use calibrated catering baseline fallbacks, and the model improves naturally with each meal outcome you record.
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto px-7 py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Prediction Model...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Surplus Prediction</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
