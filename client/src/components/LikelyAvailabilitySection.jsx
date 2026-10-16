import React, { useState, useMemo } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Calendar,
  Utensils,
  ChevronRight,
  TrendingDown,
  ShieldCheck,
  PackageCheck,
  History,
  Timer,
  Info
} from "lucide-react";

export default function LikelyAvailabilitySection({
  schedules = [],
  onViewDetails,
  onRecordOutcome
}) {
  const [activeFilter, setActiveFilter] = useState("ACTIVE"); // 'ACTIVE', 'CONFIRMED', 'UPCOMING', 'ALL'

  // Extract all schedules with availability predictions
  const availabilityData = useMemo(() => {
    return schedules.map((schedule) => {
      const avail = schedule.availabilityPrediction || schedule.prediction?.availability || null;
      const outcome = schedule.outcome || null;
      const isConfirmed = Boolean(avail?.isConfirmedReady || (outcome?.foodReadyForPickup && outcome?.actualSurplusReadyAt));

      let timeDisplay = "N/A";
      if (avail?.predictedAvailableTime) {
        timeDisplay = avail.predictedAvailableTime;
      } else if (avail?.predictedAvailableAt) {
        const d = new Date(avail.predictedAvailableAt);
        if (!isNaN(d.getTime())) {
          timeDisplay = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
        }
      }

      const isHistoricalMethod =
        avail?.referenceType === "predicted_actual_end" ||
        avail?.predictionMethod === "historical_median";

      return {
        schedule,
        avail,
        outcome,
        isConfirmed,
        timeDisplay,
        isHistoricalMethod,
        prepStatus: schedule.preparationStatus || "Not Started",
        mealType: schedule.mealType,
        mealDate: schedule.mealDate,
        startTime: schedule.scheduledStartTime,
        endTime: schedule.scheduledEndTime,
        menuItems: schedule.menuItems,
        isSpecialEvent: schedule.isSpecialEvent,
        portions: schedule.prediction?.predictedSurplusQuantity ?? schedule.typicalLeftoverQuantity ?? null
      };
    });
  }, [schedules]);

  // Filtered schedules
  const filteredData = useMemo(() => {
    return availabilityData.filter((item) => {
      if (activeFilter === "CONFIRMED") return item.isConfirmed;
      if (activeFilter === "UPCOMING") return item.prepStatus === "Not Started" && !item.isConfirmed;
      if (activeFilter === "ACTIVE") {
        // Active means not completed with outcome, or recently confirmed ready
        return !item.outcome || item.isConfirmed || item.prepStatus === "In Progress";
      }
      return true; // 'ALL'
    });
  }, [availabilityData, activeFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const confirmedCount = availabilityData.filter((i) => i.isConfirmed).length;
    const inProgressCount = availabilityData.filter((i) => i.prepStatus === "In Progress").length;
    const upcomingCount = availabilityData.filter((i) => i.prepStatus === "Not Started").length;
    const historicalCount = availabilityData.filter((i) => i.isHistoricalMethod).length;

    return {
      confirmedCount,
      inProgressCount,
      upcomingCount,
      historicalCount
    };
  }, [availabilityData]);

  return (
    <section id="likely-availability-section" className="space-y-5">
      {/* Section Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
              <Timer className="w-3.5 h-3.5 text-indigo-400" />
              <span>Surplus Pickup Timetable</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
              Likely Surplus Availability Times
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Forecasts when leftover food will be ready for NGO pickup, predicted directly from{" "}
              <strong className="text-slate-200">past actual meal end times</strong> and packaging turnaround.
            </p>
          </div>

          {/* Quick Metrics Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Confirmed Ready</span>
              <span className="text-lg font-bold text-emerald-400">{metrics.confirmedCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">In Progress</span>
              <span className="text-lg font-bold text-blue-400">{metrics.inProgressCount}</span>
            </div>
            <div className="px-3.5 py-2 rounded-2xl bg-slate-950/70 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Historical Predictions</span>
              <span className="text-lg font-bold text-indigo-400">{metrics.historicalCount}</span>
            </div>
          </div>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-2xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveFilter("ACTIVE")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                activeFilter === "ACTIVE"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Active & Today ({availabilityData.filter((i) => !i.outcome || i.isConfirmed).length})
            </button>
            <button
              onClick={() => setActiveFilter("CONFIRMED")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                activeFilter === "CONFIRMED"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Confirmed Ready ({metrics.confirmedCount})
            </button>
            <button
              onClick={() => setActiveFilter("UPCOMING")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                activeFilter === "UPCOMING"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-950"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Upcoming ({metrics.upcomingCount})
            </button>
            <button
              onClick={() => setActiveFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                activeFilter === "ALL"
                  ? "bg-slate-800 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              All Batches ({availabilityData.length})
            </button>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Updates dynamically when meals complete or outcomes are logged</span>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {filteredData.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Meal Batches Match Current Filter</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {activeFilter === "CONFIRMED"
              ? "No surplus batches are currently confirmed ready for pickup. Mark food ready once service concludes."
              : "Schedule a meal batch to generate AI-predicted availability times."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((item) => {
            const { schedule, avail, isConfirmed, timeDisplay, isHistoricalMethod } = item;

            return (
              <div
                key={schedule._id}
                className={`rounded-3xl border p-5 sm:p-6 transition flex flex-col justify-between space-y-4 relative overflow-hidden group shadow-lg ${
                  isConfirmed
                    ? "bg-gradient-to-b from-emerald-950/40 via-slate-900/90 to-slate-950 border-emerald-500/40 hover:border-emerald-500/60 shadow-emerald-950/20"
                    : isHistoricalMethod
                    ? "bg-gradient-to-b from-slate-900/90 via-slate-900/90 to-indigo-950/30 border-slate-800 hover:border-indigo-500/40 shadow-slate-950/40"
                    : "bg-slate-900/70 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Header: Meal Type, Badge & Date */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-base sm:text-lg flex items-center gap-1.5">
                        <Utensils className="w-4 h-4 text-emerald-400" />
                        {schedule.mealType}
                      </span>
                      {schedule.isSpecialEvent && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[9px] font-bold uppercase tracking-wide">
                          Event
                        </span>
                      )}
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        isConfirmed
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 flex items-center gap-1"
                          : isHistoricalMethod
                          ? "bg-indigo-500/10 text-indigo-300 border-indigo-500/30 flex items-center gap-1"
                          : "bg-slate-800 text-slate-400 border-slate-700"
                      }`}
                    >
                      {isConfirmed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Ready for Pickup
                        </>
                      ) : isHistoricalMethod ? (
                        <>
                          <History className="w-3 h-3 text-indigo-400" /> Historical Actual End
                        </>
                      ) : (
                        "Baseline Estimate"
                      )}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {schedule.mealDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {schedule.scheduledStartTime} – {schedule.scheduledEndTime}
                    </span>
                  </div>
                </div>

                {/* Hero Stat: Likely Available At */}
                <div
                  className={`p-4 rounded-2xl border space-y-2 ${
                    isConfirmed
                      ? "bg-emerald-950/50 border-emerald-500/30"
                      : "bg-slate-950/70 border-slate-800/80"
                  }`}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                    <span>{isConfirmed ? "Confirmed Surplus Ready At" : "Likely Surplus Available At"}</span>
                    {isConfirmed ? (
                      <span className="text-[10px] text-emerald-400 font-bold lowercase">confirmed</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-medium">estimated</span>
                    )}
                  </span>

                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                        isConfirmed ? "text-emerald-300" : "text-white"
                      }`}
                    >
                      {timeDisplay}
                    </span>

                    {item.portions !== null && (
                      <div className="text-right">
                        <span className="text-xs font-semibold text-emerald-400 block">
                          ~{item.portions} portions
                        </span>
                        <span className="text-[10px] text-slate-400">surplus volume</span>
                      </div>
                    )}
                  </div>

                  {/* Breakdown details */}
                  <div className="pt-2 border-t border-slate-800/80 text-[11px] space-y-1">
                    {avail?.referenceType === "predicted_actual_end" ? (
                      <div className="text-indigo-300 flex items-center justify-between">
                        <span>Predicted Service Finish:</span>
                        <strong>{avail.predictedMealEndTime12 || avail.referenceEndTime}</strong>
                      </div>
                    ) : avail?.referenceType === "actual_end" ? (
                      <div className="text-emerald-300 flex items-center justify-between">
                        <span>Actual Service Ended:</span>
                        <strong>{avail.predictedMealEndTime12 || avail.referenceEndTime}</strong>
                      </div>
                    ) : (
                      <div className="text-slate-400 flex items-center justify-between">
                        <span>Scheduled Meal End:</span>
                        <strong>{schedule.scheduledEndTime}</strong>
                      </div>
                    )}

                    <div className="text-slate-400 flex items-center justify-between">
                      <span>Packaging & Sorting Delay:</span>
                      <span className="text-slate-300 font-medium">
                        {typeof avail?.estimatedDelayMinutes === "number"
                          ? `+${avail.estimatedDelayMinutes} min`
                          : "+25 min default"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                {avail?.explanation && (
                  <p className="text-[11px] text-slate-400 bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60 line-clamp-2 leading-relaxed">
                    {avail.explanation}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                  <button
                    onClick={() => onViewDetails && onViewDetails(schedule)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-slate-200 text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <span>View Forecast</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {!isConfirmed && (
                    <button
                      onClick={() => onRecordOutcome && onRecordOutcome(schedule)}
                      className="py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                      title="Confirm food readiness or record outcome"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Confirm Ready</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
