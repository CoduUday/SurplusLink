import React from "react";
import {
  Calendar,
  Clock,
  Utensils,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  MapPin,
} from "lucide-react";

export default function ScheduleDetailsModal({
  schedule,
  onClose,
  onEditSchedule,
  onRecordOutcome,
}) {
  if (!schedule) return null;

  const hasOutcome = Boolean(schedule.outcome);
  const outcome = schedule.outcome;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-4 border-b border-[#30363d]">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {schedule.mealType}
              </span>
              {schedule.isSpecialEvent && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Special Event
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-white mt-2 tracking-tight">
              Meal Schedule Details
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition p-2 rounded-xl hover:bg-[#21262d] cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6">
          {/* Schedule Summary Section */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              Planned Schedule
            </h3>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Date</span>
                <span className="text-slate-200 font-medium">
                  {schedule.mealDate}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Scheduled Time
                </span>
                <span className="text-slate-200 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  {schedule.scheduledStartTime} - {schedule.scheduledEndTime}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Expected Meals Prepared
                </span>
                <span className="text-slate-100 font-semibold">
                  {schedule.expectedMealsPrepared} portions
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Expected People Eating
                </span>
                <span className="text-slate-100 font-semibold">
                  {schedule.expectedPeopleEating} people
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Preparation Status
                </span>
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-0.5 ${
                    schedule.preparationStatus === "Completed"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                      : schedule.preparationStatus === "In Progress"
                        ? "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                        : "bg-[#21262d] text-slate-300 border border-[#30363d]"
                  }`}
                >
                  {schedule.preparationStatus}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">
                  Historical Leftover
                </span>
                <span className="text-slate-200 font-medium">
                  {schedule.typicalLeftoverQuantity !== null &&
                  schedule.typicalLeftoverQuantity !== undefined
                    ? `${schedule.typicalLeftoverQuantity} portions`
                    : "None recorded"}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#30363d]">
              <span className="text-xs text-slate-400 block">Menu Items</span>
              <p className="text-sm text-slate-200 mt-1 whitespace-pre-wrap leading-relaxed">
                {schedule.menuItems}
              </p>
            </div>
          </div>

          {/* AI-Predicted Surplus Section (for eligible meals) */}
          {(schedule.preparationStatus === "Not Started" ||
            schedule.preparationStatus === "In Progress") &&
            !hasOutcome &&
            schedule.prediction && (
              <div className="bg-[#0d1117] border border-emerald-500/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    AI-Predicted Surplus Forecast
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                    {schedule.prediction.predictionMethod === "machine_learning"
                      ? "Random Forest Regressor"
                      : schedule.prediction.predictionMethod === "historical_baseline"
                      ? "Historical Baseline"
                      : "Initial Baseline"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">Predicted Surplus</span>
                    <span className="text-xl font-bold text-white">
                      {schedule.prediction.predictedSurplusQuantity}{" "}
                      <span className="text-xs font-normal text-slate-400">meal portions</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">Estimation Method</span>
                    <span className="text-xs font-medium text-emerald-300">
                      {schedule.prediction.predictionMethod === "machine_learning"
                        ? "Machine Learning (Random Forest)"
                        : schedule.prediction.predictionMethod === "historical_baseline"
                        ? "Weighted Historical Baseline"
                        : "Planned Buffer Baseline"}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 bg-[#161b22] p-2.5 rounded-xl border border-[#30363d]">
                  {schedule.prediction.explanation}
                </p>

                <div className="text-[11px] text-amber-400 flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Portion quantity is an estimate only, not confirmed available food.</span>
                </div>
              </div>
            )}

          {/* Actual Outcome Section */}
          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <PackageCheck className="w-3.5 h-3.5 text-amber-400" />
              Actual Meal Outcome
            </h3>

            {hasOutcome ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-xs text-slate-400 block">
                    Actual Leftover Quantity
                  </span>
                  <span className="text-lg font-bold text-amber-400">
                    {outcome.actualLeftoverQuantity} portions
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">
                    Actual Meal End Time
                  </span>
                  <span className="text-slate-200 font-medium flex items-center gap-1 mt-0.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {outcome.actualMealEndTime}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">
                    Actual Meals Served
                  </span>
                  <span className="text-slate-200 font-medium">
                    {outcome.actualMealsServed !== null &&
                    outcome.actualMealsServed !== undefined
                      ? `${outcome.actualMealsServed} portions`
                      : "Not recorded"}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">
                    Ready for Pickup
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-semibold mt-0.5 px-2.5 py-0.5 rounded-full ${
                      outcome.foodReadyForPickup
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {outcome.foodReadyForPickup
                      ? "✓ Yes - Ready"
                      : "✕ No - Not Confirmed"}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center">
                <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-[#21262d] text-slate-300 border border-[#30363d]">
                  Outcome Not Recorded
                </span>
                <p className="text-xs text-slate-400 mt-2">
                  Once the meal finishes, record the actual leftovers and food
                  readiness for collection.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#30363d]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditSchedule(schedule);
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-200 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-xl transition cursor-pointer"
              >
                Edit Schedule
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onRecordOutcome(schedule);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded-xl shadow-sm transition cursor-pointer"
              >
                {hasOutcome ? "Edit Actual Outcome" : "Record Actual Outcome"}
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] rounded-xl transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
