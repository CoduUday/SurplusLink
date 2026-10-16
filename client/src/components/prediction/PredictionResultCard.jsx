import React from 'react';
import {
  Sparkles,
  TrendingDown,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Database,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Info,
  ArrowRight
} from 'lucide-react';

export default function PredictionResultCard({ prediction, onLogFeedbackClick, onReset }) {
  if (!prediction) return null;

  const {
    mealName,
    mealType,
    foodCategory,
    mealDate,
    scheduledStartTime,
    plannedQuantityKg,
    expectedAttendance,
    predictedSurplusKg,
    estimatedSurplusRate,
    predictedAvailabilityTime,
    availabilityTimeSource,
    predictionMethod,
    reliabilityLevel,
    historicalRecordsUsed,
    explanation,
    assumptions,
    feedbackStatus
  } = prediction;

  const formattedDate = new Date(mealDate).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const formattedAvailability = new Date(predictedAvailabilityTime).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedAvailabilityDate = new Date(predictedAvailabilityTime).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });

  // Reliability visual tokens
  const getReliabilityBadge = (level) => {
    switch (level) {
      case 'High':
        return {
          bg: 'bg-[#21262d] border-emerald-500/40 text-emerald-400',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'High Reliability',
          desc: 'Backed by consistent historical donor records'
        };
      case 'Medium':
        return {
          bg: 'bg-[#21262d] border-sky-500/40 text-sky-400',
          icon: <ShieldCheck className="w-3.5 h-3.5" />,
          label: 'Medium Reliability',
          desc: 'Moderate historical sample size'
        };
      case 'Low':
      default:
        return {
          bg: 'bg-[#21262d] border-amber-500/40 text-amber-400',
          icon: <ShieldAlert className="w-3.5 h-3.5" />,
          label: 'Low / Baseline',
          desc: 'Limited data or cold-start fallback'
        };
    }
  };

  const relBadge = getReliabilityBadge(reliabilityLevel);

  const getSourceLabel = (src) => {
    switch (src) {
      case 'donor_input':
        return 'Donor Specified End Time';
      case 'historical_median':
        return 'Historical Median Duration';
      case 'default_assumption':
      default:
        return 'Default Event Duration';
    }
  };

  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-[#21262d] text-emerald-400 border border-[#30363d] text-xs font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Prediction Generated
            </span>
            <span className={`px-2.5 py-0.5 rounded-full border text-xs font-medium flex items-center gap-1 ${relBadge.bg}`}>
              {relBadge.icon} {relBadge.label}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-slate-300 text-xs">
              {predictionMethod === 'historical_weighted_average' ? 'Weighted Model' : 'Baseline Fallback'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">{mealName}</h3>
          <p className="text-xs text-slate-400 flex flex-wrap items-center gap-3">
            <span>{mealType} ({foodCategory})</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formattedDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Starts {scheduledStartTime}</span>
          </p>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="self-start sm:self-center px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-xs text-slate-200 hover:text-white font-medium transition"
          >
            Plan Another Meal
          </button>
        )}
      </div>

      {/* Primary Key Metric Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Metric 1: Predicted Surplus */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Estimated Surplus Food
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400">
              {predictedSurplusKg.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-slate-400">kg</span>
          </div>
          <p className="text-xs text-emerald-400/90 font-medium flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            {(estimatedSurplusRate * 100).toFixed(1)}% of planned {plannedQuantityKg} kg
          </p>
        </div>

        {/* Metric 2: Availability Time */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Available For Pickup
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-white">
              {formattedAvailability}
            </span>
            <span className="text-xs text-slate-400">{formattedAvailabilityDate}</span>
          </div>
          <p className="text-xs text-slate-400 font-medium truncate" title={getSourceLabel(availabilityTimeSource)}>
            Source: <strong className="text-slate-300">{getSourceLabel(availabilityTimeSource)}</strong>
          </p>
        </div>

        {/* Metric 3: Historical Basis */}
        <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block">
            Historical Data Basis
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-200">
              {historicalRecordsUsed}
            </span>
            <span className="text-xs text-slate-400">past records used</span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Attendance scale: <strong className="text-slate-300">{expectedAttendance} people</strong>
          </p>
        </div>
      </div>

      {/* Explanation & Assumptions Box */}
      <div className="bg-[#0d1117] border border-[#30363d] rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
          <Info className="w-4 h-4 text-emerald-400" />
          <span>Why was this surplus predicted?</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {explanation}
        </p>

        {assumptions && assumptions.length > 0 && (
          <div className="pt-2 border-t border-[#30363d] space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Model Assumptions & Parameters:
            </span>
            <ul className="space-y-1">
              {assumptions.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <p className="text-[11px] text-slate-400 text-center sm:text-left">
          Actual surplus may vary. Recording actual outcomes after the meal refines future forecasts.
        </p>

        {feedbackStatus === 'pending' && onLogFeedbackClick && (
          <button
            onClick={() => onLogFeedbackClick(prediction)}
            className="w-full sm:w-auto px-5 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <span>Log Actual Outcome Feedback</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
