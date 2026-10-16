import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Building2,
  MapPin,
  Users,
  Clock,
  Utensils,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import matchingService from '../../services/matchingService';

export default function RecommendedNgosSection({ donationId, isAvailable }) {
  const [rankedNgos, setRankedNgos] = useState([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedNgoId, setExpandedNgoId] = useState(null);

  const fetchRecommendations = async () => {
    if (!donationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await matchingService.getRecommendedNgos(donationId);
      if (response.success) {
        setRankedNgos(response.rankedNgos || []);
        setTotalEligible(response.totalEligible || 0);
        setMessage(response.message || '');
      }
    } catch (err) {
      console.error('Fetch NGO recommendations error:', err);
      const msg = err.response?.data?.message || 'Failed to calculate suitable NGO matches.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [donationId]);

  const toggleExpand = (id) => {
    setExpandedNgoId((prev) => (prev === id ? null : id));
  };

  const getScoreBadgeColor = (score) => {
    if (score >= 85) {
      return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    }
    if (score >= 70) {
      return 'bg-teal-500/10 border-teal-500/30 text-teal-300';
    }
    if (score >= 50) {
      return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    }
    return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Smart NGO Matching System
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Recommended Distribution Partners
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Ranked by multi-factor suitability based on distance, serving capacity, operating schedule, and food preferences.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/60 transition disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Matches</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
            <span>Calculating optimal NGO rankings based on proximity and capacity...</span>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-28 bg-slate-950/40 border border-slate-800/60 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-rose-200">Unable to load recommended NGOs</p>
              <p className="text-slate-400 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchRecommendations}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && rankedNgos.length === 0 && (
        <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Matching NGOs Found</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {message ||
              'No eligible partner organizations were found matching this donation’s food type, location, or pickup window.'}
          </p>
          <div className="pt-2 flex justify-center gap-2">
            <span className="text-[11px] text-slate-500 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
              💡 Tip: Verify your pickup coordinates or extend the deadline to widen NGO availability.
            </span>
          </div>
        </div>
      )}

      {/* Ranked NGOs List */}
      {!isLoading && !error && rankedNgos.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{rankedNgos.length}</strong> eligible partner{rankedNgos.length === 1 ? '' : 's'}
            </span>
         
          </div>

          <div className="space-y-3">
            {rankedNgos.map((item, index) => {
              const { ngo, totalScore, distanceKm, criteria, reasons, warnings } = item;
              const isExpanded = expandedNgoId === ngo._id;

              return (
                <div
                  key={ngo._id}
                  className="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 transition space-y-4"
                >
                  {/* NGO Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                          #{index + 1}
                        </span>
                        <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                          {ngo.organization}
                          {ngo.isVerified && (
                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" title="Verified NGO Partner" />
                          )}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        {distanceKm !== null && (
                          <span className="flex items-center gap-1 text-slate-300">
                            <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                            <strong>{distanceKm} km</strong> away
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-blue-400" />
                          Cap: {ngo.servingCapacity || 'Not declared'} people/day
                        </span>
                        {ngo.operatingSchedule && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {ngo.operatingSchedule}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Match Score Badge */}
                    <div className="flex items-center gap-3 self-start sm:self-center">
                      <div
                        className={`px-3 py-1.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 ${getScoreBadgeColor(
                          totalScore
                        )}`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{totalScore}% Match</span>
                      </div>

                      <button
                        onClick={() => toggleExpand(ngo._id)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition text-xs flex items-center gap-1"
                      >
                        <span className="hidden sm:inline">{isExpanded ? 'Hide Details' : 'Why this match?'}</span>
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Summary Reasons Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {reasons.slice(0, 3).map((reason, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{reason}</span>
                      </span>
                    ))}
                  </div>

                  {/* Missing Info / Warnings */}
                  {warnings && warnings.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{warnings.join(' • ')}</span>
                    </div>
                  )}

                  {/* Expanded Breakdown Accordion */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-800/80 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Proximity (35 pts max)
                          </span>
                          <div className="text-slate-200 font-semibold flex justify-between">
                            <span>Score: {criteria?.proximity?.score || 0}/35</span>
                            <span className="text-emerald-400">{criteria?.proximity?.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{criteria?.proximity?.reason}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Capacity (25 pts max)
                          </span>
                          <div className="text-slate-200 font-semibold flex justify-between">
                            <span>Score: {criteria?.capacity?.score || 0}/25</span>
                            <span className="text-blue-400">{criteria?.capacity?.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{criteria?.capacity?.reason}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Schedule (20 pts max)
                          </span>
                          <div className="text-slate-200 font-semibold flex justify-between">
                            <span>Score: {criteria?.schedule?.score || 0}/20</span>
                            <span className="text-amber-400">{criteria?.schedule?.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{criteria?.schedule?.reason}</p>
                        </div>

                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Food Compatibility (20 pts max)
                          </span>
                          <div className="text-slate-200 font-semibold flex justify-between">
                            <span>Score: {criteria?.foodCompatibility?.score || 0}/20</span>
                            <span className="text-teal-400">{criteria?.foodCompatibility?.status}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {criteria?.foodCompatibility?.reasons?.join(', ')}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
