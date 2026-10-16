import React, { useState, useEffect } from "react";
import {
  Calendar,
  PlusCircle,
  Clock,
  Utensils,
  Sparkles,
  Filter,
  Eye,
  Edit2,
  CheckCircle2,
  AlertCircle,
  PackageCheck,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { mealScheduleService } from "../services/mealSchedule.service";
import MealScheduleModal from "./MealScheduleModal";
import ActualOutcomeModal from "./ActualOutcomeModal";
import ScheduleDetailsModal from "./ScheduleDetailsModal";

export default function MealScheduleSection({ onSchedulesChange }) {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterType, setFilterType] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");

  // Modals state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleToEdit, setScheduleToEdit] = useState(null);

  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [scheduleForOutcome, setScheduleForOutcome] = useState(null);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const fetchSchedules = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await mealScheduleService.getAll();
      const data = res.data || [];
      setSchedules(data);
      if (onSchedulesChange) onSchedulesChange(data);
    } catch (err) {
      console.error("Failed to load meal schedules:", err);
      setError("Could not fetch meal schedules. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  // Filter schedules
  const filteredSchedules = schedules.filter((s) => {
    if (filterDate && s.mealDate !== filterDate) return false;
    if (filterType !== "ALL" && s.mealType !== filterType) return false;
    if (filterStatus !== "ALL" && s.preparationStatus !== filterStatus)
      return false;
    return true;
  });

  const handleOpenAddSchedule = () => {
    setScheduleToEdit(null);
    setIsScheduleModalOpen(true);
  };

  const handleOpenEditSchedule = (schedule) => {
    setScheduleToEdit(schedule);
    setIsScheduleModalOpen(true);
  };

  const handleOpenOutcome = (schedule) => {
    setScheduleForOutcome(schedule);
    setIsOutcomeModalOpen(true);
  };

  const handleOpenDetails = (schedule) => {
    setSelectedSchedule(schedule);
    setIsDetailsModalOpen(true);
  };

  return (
    <section
      id="meal-schedules"
      className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm scroll-mt-6"
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#30363d]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#21262d] rounded-xl text-emerald-400 border border-[#30363d]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Donor Meal Schedules
              </h2>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchSchedules}
            disabled={loading}
            title="Refresh schedules"
            className="p-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-300 hover:text-white rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={handleOpenAddSchedule}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 transition hover:-translate-y-0.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Meal Schedule</span>
          </button>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchSchedules}
            className="underline text-rose-300 hover:text-white ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-3 sm:p-4 flex flex-wrap items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold mr-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filters:</span>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Date:</span>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-500"
          />
        </div>

        {/* Meal Type Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Meal:</span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-500"
          >
            <option value="ALL">All Meals</option>
            <option value="Breakfast">Breakfast</option>
            <option value="Lunch">Lunch</option>
            <option value="Dinner">Dinner</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400">Status:</span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-slate-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Not Started">Not Started</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        {(filterDate || filterType !== "ALL" || filterStatus !== "ALL") && (
          <button
            onClick={() => {
              setFilterDate("");
              setFilterType("ALL");
              setFilterStatus("ALL");
            }}
            className="ml-auto text-xs text-slate-400 hover:text-emerald-400 transition underline"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Main Content: Loading / Empty / Responsive List */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
          <span className="text-sm text-slate-400">
            Loading your meal schedules...
          </span>
        </div>
      ) : filteredSchedules.length === 0 ? (
        /* Empty State */
        <div className="py-12 px-4 border border-dashed border-slate-800 rounded-3xl flex flex-col items-center justify-center text-center space-y-3 bg-slate-950/40">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Calendar className="w-7 h-7" />
          </div>
          <div className="max-w-md">
            <h3 className="text-base font-bold text-white">
              {schedules.length === 0
                ? "No Meal Schedules Created Yet"
                : "No schedules match your filters"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {schedules.length === 0
                ? "Create your first meal schedule to track planned meals and record actual leftovers ready for NGO collection."
                : "Try adjusting your date, meal type, or status filters to view other schedules."}
            </p>
          </div>
          {schedules.length === 0 ? (
            <button
              onClick={handleOpenAddSchedule}
              className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add Meal Schedule</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setFilterDate("");
                setFilterType("ALL");
                setFilterStatus("ALL");
              }}
              className="mt-2 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl transition"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (Hidden on mobile) */}
          <div className="hidden lg:block overflow-x-auto border border-[#30363d] rounded-xl bg-[#0d1117]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#30363d] text-[11px] uppercase tracking-wider text-slate-300 bg-[#161b22] font-semibold">
                  <th className="py-3 px-4">Date & Meal</th>
                  <th className="py-3 px-4">Scheduled Window</th>
                  <th className="py-3 px-4">Planned Prep / Eating</th>
                  <th className="py-3 px-4">Menu Items</th>
                  <th className="py-3 px-4">Prep Status</th>
                  <th className="py-3 px-4 min-w-[240px]">AI-Predicted Surplus</th>
                  <th className="py-3 px-4">Actual Outcome</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#30363d] text-xs">
                {filteredSchedules.map((schedule) => {
                  const outcome = schedule.outcome;
                  const isEligible =
                    (schedule.preparationStatus === "Not Started" ||
                      schedule.preparationStatus === "In Progress") &&
                    !outcome;
                  const prediction = schedule.prediction;

                  return (
                    <tr
                      key={schedule._id}
                      className="hover:bg-slate-900/40 transition group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{schedule.mealType}</span>
                          {schedule.isSpecialEvent && (
                            <span className="p-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[9px] font-bold uppercase tracking-tight">
                              Event
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {schedule.mealDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>
                            {schedule.scheduledStartTime} -{" "}
                            {schedule.scheduledEndTime}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">
                          {schedule.expectedMealsPrepared} prepared
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {schedule.expectedPeopleEating} people eating
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-[180px]">
                        <p
                          className="truncate text-slate-300"
                          title={schedule.menuItems}
                        >
                          {schedule.menuItems}
                        </p>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium text-center ${
                            schedule.preparationStatus === "Completed"
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                              : schedule.preparationStatus === "In Progress"
                                ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                                : "bg-slate-800 text-slate-400 border border-slate-700"
                          }`}
                        >
                          {schedule.preparationStatus}
                        </span>
                      </td>

                      {/* AI-Predicted Surplus Column */}
                      <td className="py-3.5 px-4">
                        {isEligible ? (
                          prediction ? (
                            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/20 space-y-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1 text-emerald-400 font-bold text-xs">
                                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                                  <span>Predicted Surplus:</span>
                                </div>
                                <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                                  {prediction.predictionMethod === "machine_learning"
                                    ? "Random Forest"
                                    : prediction.predictionMethod === "historical_baseline"
                                    ? "Historical Baseline"
                                    : "Baseline"}
                                </span>
                              </div>
                              <div className="text-base font-extrabold text-white">
                                {prediction.predictedSurplusQuantity}{" "}
                                <span className="text-xs font-normal text-slate-300">
                                  meals 
                                </span>
                              </div>
                         
                              
                            </div>
                          ) : (
                            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 italic flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                              <span>Estimating surplus...</span>
                            </div>
                          )
                        ) : (
                          <div className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/80 text-[10px] text-slate-500">
                            <span className="block font-medium text-slate-400">
                              {outcome ? "Outcome Recorded" : "Meal Completed"}
                            </span>
                            <span>Active prediction retired</span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {outcome ? (
                          <div className="space-y-0.5">
                            <div className="text-amber-400 font-bold flex items-center gap-1">
                              <span>
                                {outcome.actualLeftoverQuantity} leftover
                              </span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                (Ended {outcome.actualMealEndTime})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px]">
                              {outcome.actualMealsServed !== null && (
                                <span className="text-slate-400">
                                  {outcome.actualMealsServed} served •
                                </span>
                              )}
                              <span
                                className={`font-semibold ${
                                  outcome.foodReadyForPickup
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                                }`}
                              >
                                {outcome.foodReadyForPickup
                                  ? "Ready for Pickup"
                                  : "Pickup Pending"}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 text-center">
                            Outcome Not Recorded
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenDetails(schedule)}
                            title="View Schedule Details"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEditSchedule(schedule)}
                            title="Edit Schedule"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenOutcome(schedule)}
                            title={
                              outcome
                                ? "Edit Actual Outcome"
                                : "Record Actual Outcome"
                            }
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                              outcome
                                ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30"
                                : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                            }`}
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>
                              {outcome ? "Edit Outcome" : "Record Outcome"}
                            </span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card View (Shown on screens < lg) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:hidden gap-4">
            {filteredSchedules.map((schedule) => {
              const outcome = schedule.outcome;
              return (
                <div
                  key={schedule._id}
                  className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-4 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base text-white">
                          {schedule.mealType}
                        </span>
                        {schedule.isSpecialEvent && (
                          <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-bold">
                            Special Event
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400 mt-0.5 block">
                        {schedule.mealDate}
                      </span>
                    </div>

                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        schedule.preparationStatus === "Completed"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : schedule.preparationStatus === "In Progress"
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                      }`}
                    >
                      {schedule.preparationStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-300 py-2 border-y border-slate-900">
                    <div>
                      <span className="text-slate-500 text-[11px] block">
                        Window
                      </span>
                      <span className="font-medium text-slate-200">
                        {schedule.scheduledStartTime} -{" "}
                        {schedule.scheduledEndTime}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[11px] block">
                        Planned
                      </span>
                      <span className="font-medium text-slate-200">
                        {schedule.expectedMealsPrepared} prep /{" "}
                        {schedule.expectedPeopleEating} eating
                      </span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="text-slate-500 text-[11px] block mb-0.5">
                      Menu
                    </span>
                    <p className="text-slate-300 line-clamp-2">
                      {schedule.menuItems}
                    </p>
                  </div>

                  {/* AI-Predicted Surplus Panel (for eligible meals: Not Started or In Progress without outcome) */}
                  {(schedule.preparationStatus === "Not Started" ||
                    schedule.preparationStatus === "In Progress") &&
                    !outcome &&
                    schedule.prediction && (
                      <div className="p-3 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>AI-Predicted Surplus</span>
                          </div>
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            {schedule.prediction.predictionMethod === "machine_learning"
                              ? "Random Forest"
                              : schedule.prediction.predictionMethod === "historical_baseline"
                              ? "Historical Baseline"
                              : "Baseline"}
                          </span>
                        </div>
                        <div className="text-base font-extrabold text-white">
                          {schedule.prediction.predictedSurplusQuantity}{" "}
                          <span className="text-xs font-normal text-slate-300">
                            meals (~portions)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          {schedule.prediction.explanation}
                        </p>
                        <div className="text-[10px] text-amber-400/90 flex items-center gap-1 pt-0.5 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          <span>Estimate only — not confirmed available food</span>
                        </div>
                      </div>
                    )}

                  {/* Actual Outcome section on card (shown for completed meals or recorded outcomes) */}
                  {(outcome || schedule.preparationStatus === "Completed") && (
                    <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs">
                      <span className="text-slate-500 text-[11px] uppercase tracking-wider block font-semibold mb-1">
                        Actual Outcome
                      </span>
                      {outcome ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">Leftovers:</span>
                            <span className="text-amber-400 font-bold">
                              {outcome.actualLeftoverQuantity} portions
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-300">
                              Actual End Time:
                            </span>
                            <span className="text-slate-200 font-medium">
                              {outcome.actualMealEndTime}
                            </span>
                          </div>
                          {outcome.actualMealsServed !== null && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300">
                                Meals Served:
                              </span>
                              <span className="text-slate-200">
                                {outcome.actualMealsServed}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                            <span className="text-slate-300">Pickup Ready:</span>
                            <span
                              className={`font-semibold ${
                                outcome.foodReadyForPickup
                                  ? "text-emerald-400"
                                  : "text-amber-400"
                              }`}
                            >
                              {outcome.foodReadyForPickup ? "✓ Yes" : "✕ No"}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          Meal completed — actual outcome pending logging
                        </span>
                      )}
                    </div>
                  )}

                  {/* Card Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDetails(schedule)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                      >
                        Details
                      </button>
                      <button
                        onClick={() => handleOpenEditSchedule(schedule)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition"
                      >
                        Edit
                      </button>
                    </div>

                    <button
                      onClick={() => handleOpenOutcome(schedule)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition ${
                        outcome
                          ? "bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30"
                          : "bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>{outcome ? "Edit Outcome" : "Record Outcome"}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Schedule Modal (Add/Edit) */}
      {isScheduleModalOpen && (
        <MealScheduleModal
          schedule={scheduleToEdit}
          onClose={() => setIsScheduleModalOpen(false)}
          onSuccess={() => {
            setIsScheduleModalOpen(false);
            fetchSchedules();
          }}
        />
      )}

      {/* Actual Outcome Modal */}
      {isOutcomeModalOpen && (
        <ActualOutcomeModal
          schedule={scheduleForOutcome}
          onClose={() => setIsOutcomeModalOpen(false)}
          onSuccess={() => {
            setIsOutcomeModalOpen(false);
            fetchSchedules();
          }}
        />
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && (
        <ScheduleDetailsModal
          schedule={selectedSchedule}
          onClose={() => setIsDetailsModalOpen(false)}
          onEditSchedule={(s) => handleOpenEditSchedule(s)}
          onRecordOutcome={(s) => handleOpenOutcome(s)}
        />
      )}
    </section>
  );
}
