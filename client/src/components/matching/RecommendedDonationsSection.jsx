import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Utensils,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import matchingService from '../../services/matchingService';

export default function RecommendedDonationsSection({ ngoId }) {
  const [rankedDonations, setRankedDonations] = useState([]);
  const [totalEligible, setTotalEligible] = useState(0);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRecommendedDonations = async () => {
    if (!ngoId) return;
    setIsLoading(true);
    setError(null);

    try {
      const response = await matchingService.getRecommendedDonations(ngoId, { limit: 6 });
      if (response.success) {
        setRankedDonations(response.rankedDonations || []);
        setTotalEligible(response.totalEligible || 0);
        setMessage(response.message || '');
      }
    } catch (err) {
      console.error('Fetch recommended donations error:', err);
      const msg = err.response?.data?.message || 'Failed to retrieve recommended donations.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendedDonations();
  }, [ngoId]);

  const getScoreBadgeColor = (score) => {
    if (score >= 85) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (score >= 70) return 'bg-teal-500/10 border-teal-500/30 text-teal-300';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
    return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
  };

  const formatDeadline = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getTimeRemaining = (dateString) => {
    const diff = new Date(dateString).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h remaining`;
    }
    return `${hours}h ${mins}m remaining`;
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Smart Recommendations
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            Recommended Surplus Food For You
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Ranked by proximity to your facility, declared serving capacity compatibility, and pickup feasibility.
          </p>
        </div>

        <button
          onClick={fetchRecommendedDonations}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-medium rounded-xl border border-slate-700/60 transition disabled:opacity-50 self-start sm:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="py-8 space-y-4">
          <div className="flex items-center justify-center gap-3 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
            <span>Finding available surplus food matching your serving capacity...</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-44 bg-slate-950/40 border border-slate-800/60 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchRecommendedDonations}
            className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold rounded-lg transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && rankedDonations.length === 0 && (
        <div className="p-8 text-center bg-slate-950/40 rounded-2xl border border-slate-800/60 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto">
            <Utensils className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-white">No Matched Donations Currently Available</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {message ||
              'There are no active food donations within your service radius matching your profile at this moment.'}
          </p>
          <div className="pt-2">
            <Link
              to="/ngo/available-donations"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 inline-flex items-center gap-1"
            >
              Browse all available listings →
            </Link>
          </div>
        </div>
      )}

      {/* Recommended Donations Cards Grid */}
      {!isLoading && !error && rankedDonations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rankedDonations.map((item) => {
            const { donation, totalScore, distanceKm, reasons } = item;
            const isVeg = donation.foodType === 'VEGETARIAN';

            return (
              <div
                key={donation._id}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 flex flex-col justify-between transition hover:shadow-lg space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar: Food Type & Match Score */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                        isVeg
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      }`}
                    >
                      {isVeg ? '🌱 Vegetarian' : '🍗 Non-Veg'}
                    </span>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-xl border flex items-center gap-1 ${getScoreBadgeColor(
                        totalScore
                      )}`}
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{totalScore}% Match</span>
                    </span>
                  </div>

                  {/* Food Name & Donor Org */}
                  <div>
                    <h3 className="text-base font-bold text-white line-clamp-1">{donation.foodName}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Offered by <span className="text-slate-300 font-medium">{donation.donorOrganization}</span>
                    </p>
                  </div>

                  {/* Quantity & Servings */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800/80">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">Quantity</span>
                      <p className="text-xs font-bold text-slate-200">
                        {donation.quantity} {donation.quantityUnit}
                      </p>
                    </div>

                    <div className="space-y-0.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold">People Served</span>
                      <p className="text-xs font-bold text-blue-400 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" /> {donation.servings} people
                      </p>
                    </div>
                  </div>

                  {/* Proximity & Pickup Deadline */}
                  <div className="space-y-1.5 text-xs text-slate-400">
                    {distanceKm !== null && (
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span><strong>{distanceKm} km</strong> away from your facility</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Deadline: {formatDeadline(donation.pickupDeadline)}</span>
                    </div>

                    <span className="text-[10px] text-amber-400/90 font-medium block">
                      ⏳ {getTimeRemaining(donation.pickupDeadline)}
                    </span>
                  </div>

                  {/* Match Reason snippet */}
                  {reasons && reasons.length > 0 && (
                    <div className="pt-2 border-t border-slate-800/60">
                      <p className="text-[11px] text-slate-300 flex items-start gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{reasons[0]}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Card Action Link */}
                <div className="pt-2">
                  <Link
                    to={`/donations/${donation._id}`}
                    className="w-full py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    <span>View Donation Details</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
