import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  Clock3,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Eye,
  PlusCircle,
  AlertCircle
} from 'lucide-react';

export default function PredictionHistoryTable({
  predictions,
  total,
  page,
  totalPages,
  onPageChange,
  onFilterChange,
  currentFilters,
  onViewDetails,
  onLogFeedback,
  isLoading
}) {
  const [filterCategory, setFilterCategory] = useState(currentFilters?.foodCategory || '');
  const [filterStatus, setFilterStatus] = useState(currentFilters?.feedbackStatus || '');

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    setFilterCategory(val);
    onFilterChange({ ...currentFilters, foodCategory: val, page: 1 });
  };

  const handleStatusChange = (e) => {
    const val = e.target.value;
    setFilterStatus(val);
    onFilterChange({ ...currentFilters, feedbackStatus: val, page: 1 });
  };

  const getReliabilityBadge = (level) => {
    switch (level) {
      case 'High':
        return <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">High</span>;
      case 'Medium':
        return <span className="px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-medium">Medium</span>;
      case 'Low':
      default:
        return <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-medium">Low / Base</span>;
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">Prediction History & Feedback</h3>
          <p className="text-xs text-slate-400 mt-1">
            Browse previous surplus forecasts and log post-meal outcomes to improve future predictions.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          <select
            value={filterCategory}
            onChange={handleCategoryChange}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Categories</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Non-vegetarian">Non-vegetarian</option>
            <option value="Mixed">Mixed</option>
          </select>

          <select
            value={filterStatus}
            onChange={handleStatusChange}
            className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
          >
            <option value="">All Feedback</option>
            <option value="pending">Pending Outcome</option>
            <option value="submitted">Feedback Logged</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 text-sm space-y-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p>Loading prediction records...</p>
        </div>
      ) : !predictions || predictions.length === 0 ? (
        <div className="py-14 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mx-auto text-slate-400">
            <Clock3 className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-slate-200">No predictions found</h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {filterCategory || filterStatus
              ? 'No predictions match the selected filter criteria. Try resetting filters.'
              : 'You have not generated any surplus forecasts yet. Use the form above to plan your upcoming meal.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Meal & Occasion</th>
                <th className="py-3 px-4 font-semibold">Date & Time</th>
                <th className="py-3 px-4 font-semibold">Planned Food</th>
                <th className="py-3 px-4 font-semibold">Predicted Surplus</th>
                <th className="py-3 px-4 font-semibold">Available At</th>
                <th className="py-3 px-4 font-semibold">Reliability</th>
                <th className="py-3 px-4 font-semibold">Actual Outcome</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-850 text-slate-300">
              {predictions.map((item) => {
                const mealDateFormatted = new Date(item.mealDate).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric'
                });

                const availabilityTimeFormatted = new Date(item.predictedAvailabilityTime).toLocaleTimeString(
                  undefined,
                  { hour: '2-digit', minute: '2-digit', hour12: true }
                );

                return (
                  <tr key={item._id} className="hover:bg-slate-850/50 transition">
                    <td className="py-3.5 px-4 font-medium text-white">
                      <div className="font-semibold text-sm">{item.mealName}</div>
                      <div className="text-[11px] text-slate-400">
                        {item.mealType} • <span className="text-slate-300">{item.foodCategory}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{mealDateFormatted}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Starts {item.scheduledStartTime}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="font-semibold text-slate-200">{item.plannedQuantityKg} kg</span>
                      <div className="text-[11px] text-slate-400">{item.expectedAttendance} attendees</div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-emerald-400 text-sm">
                        {item.predictedSurplusKg.toFixed(1)} kg
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {(item.estimatedSurplusRate * 100).toFixed(1)}% buffer
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-200">{availabilityTimeFormatted}</div>
                      <div className="text-[10px] text-slate-400 capitalize">
                        {item.availabilityTimeSource.replace('_', ' ')}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {getReliabilityBadge(item.reliabilityLevel)}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {item.feedbackStatus === 'submitted' ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> {item.actualSurplusKg} kg actual
                          </span>
                          <div className="text-[10px] text-slate-500">Feedback logged</div>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[11px] font-medium">
                          <Clock3 className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                      <button
                        onClick={() => onViewDetails(item)}
                        title="View details & assumptions"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {item.feedbackStatus === 'pending' ? (
                        <button
                          onClick={() => onLogFeedback(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-[11px] transition inline-flex items-center gap-1"
                        >
                          <span>Log Outcome</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onLogFeedback(item)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] transition inline-flex items-center gap-1"
                        >
                          <span>Edit</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div>
            Showing <strong className="text-slate-200">{(page - 1) * 10 + 1}</strong> to{' '}
            <strong className="text-slate-200">{Math.min(page * 10, total)}</strong> of{' '}
            <strong className="text-slate-200">{total}</strong> predictions
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 text-slate-300 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
