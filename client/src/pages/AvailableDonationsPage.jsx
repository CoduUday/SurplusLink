import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  Clock,
  MapPin,
  Building,
  AlertTriangle,
  CheckCircle2,
  Users,
  Scale,
  Eye,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  ArrowLeft,
  Info,
  Sparkles,
  Phone,
  Loader2
} from 'lucide-react';
import donationService from '../services/donationService';
import DonationDetailsModal from '../components/donation/DonationDetailsModal';
import AcceptDonationModal from '../components/donation/AcceptDonationModal';
import RecommendedDonationsSection from '../components/matching/RecommendedDonationsSection';

const CATEGORIES = [
  'All Categories',
  'Cooked Meals',
  'Bakery & Bread',
  'Fresh Produce',
  'Dairy & Eggs',
  'Packaged Food',
  'Beverages',
  'Other'
];

export default function AvailableDonationsPage() {
  const { user } = useAuth();

  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [foodTypeFilter, setFoodTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const [donationToAccept, setDonationToAccept] = useState(null);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [acceptedTotal, setAcceptedTotal] = useState(0);
  const [isLoadingAccepted, setIsLoadingAccepted] = useState(false);

  const fetchAcceptedDonations = useCallback(async () => {
    setIsLoadingAccepted(true);
    try {
      const response = await donationService.getMyAcceptedDonations();
      if (response.success) {
        setAcceptedDonations(response.donations || []);
        setAcceptedTotal(response.total || 0);
      }
    } catch (err) {
      console.error('Failed to load accepted donations:', err);
    } finally {
      setIsLoadingAccepted(false);
    }
  }, []);

  const fetchAvailableDonations = useCallback(
    async (targetPage = 1, category = categoryFilter, foodType = foodTypeFilter, search = searchQuery) => {
      setIsLoading(true);
      try {
        const params = { page: targetPage, limit: 9 };
        if (category && category !== 'All Categories') params.category = category;
        if (foodType) params.foodType = foodType;
        if (search.trim()) params.search = search.trim();

        const response = await donationService.getAvailableDonations(params);
        if (response.success) {
          setDonations(response.donations || []);
          setTotal(response.total || 0);
          setPage(response.page || 1);
          setTotalPages(response.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to load available donations:', err);
      } finally {
        setIsLoading(false);
      }
    },
    [categoryFilter, foodTypeFilter, searchQuery]
  );

  useEffect(() => {
    fetchAvailableDonations(1, categoryFilter, foodTypeFilter, searchQuery);
    fetchAcceptedDonations();
  }, [fetchAvailableDonations, fetchAcceptedDonations, categoryFilter, foodTypeFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAvailableDonations(1, categoryFilter, foodTypeFilter, searchQuery);
  };

  const handleView = (donation) => {
    setSelectedDonation(donation);
    setIsDetailsOpen(true);
  };

  const handleOpenAccept = (donation) => {
    setDonationToAccept(donation);
    setIsAcceptOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            to="/ngo/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to NGO Dashboard
          </Link>
          <span className="text-xs text-slate-500">
            Authenticated as <strong className="text-slate-300">{user?.organization}</strong>
          </span>
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/20 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-2">
              <HeartHandshake className="w-3.5 h-3.5" /> NGO Food Redistribution Feed
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Available Food Surplus Donations</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Browse freshly listed surplus food offered by local donors. Claimed donations can be distributed to people in need before pickup deadlines expire.
            </p>
          </div>

          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl px-5 py-3 text-right">
            <span className="text-xs text-slate-400 block font-medium">Currently Available Donations</span>
            <span className="text-2xl font-bold text-blue-400">{total}</span>
          </div>
        </div>

        {/* View Mode Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Available Food</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-blue-300 font-bold">
              {total}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('recommended')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'recommended'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-300" />
            <span>Smart Recommendations</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('claimed');
              fetchAcceptedDonations();
            }}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition cursor-pointer whitespace-nowrap ${
              activeTab === 'claimed'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/50'
                : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 text-blue-300" />
            <span>My Claimed Pickups</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-emerald-400 font-bold">
              {acceptedTotal}
            </span>
          </button>
        </div>

        {activeTab === 'recommended' ? (
          <RecommendedDonationsSection ngoId={user?._id} />
        ) : activeTab === 'claimed' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-blue-400" />
                  Your Claimed Food Surplus Pickups
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct donor contact phone numbers and coordination notes for donations accepted by your organization.
                </p>
              </div>
              <button
                onClick={fetchAcceptedDonations}
                disabled={isLoadingAccepted}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Refresh
              </button>
            </div>

            {isLoadingAccepted ? (
              <div className="py-20 text-center space-y-3">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Loading your claimed food donations...</p>
              </div>
            ) : acceptedDonations.length === 0 ? (
              <div className="py-16 text-center space-y-4 bg-slate-900/60 border border-slate-800 rounded-3xl p-8">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mx-auto">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-200">No surplus food claimed yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    You haven't accepted any food donations yet. Switch to "All Available Food" or "Smart Recommendations" to claim food for redistribution.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('all')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition"
                >
                  Browse Available Food →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {acceptedDonations.map((item) => (
                  <div
                    key={item._id}
                    className="bg-slate-900/90 border border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-blue-400" />
                          CLAIMED BY YOU
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px]">
                          {item.category}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-lg font-bold text-white line-clamp-1">{item.foodName}</h3>
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>Offered by: <strong className="text-slate-200">{item.donor?.organization || 'Registered Donor'}</strong></span>
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-850 text-xs">
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Quantity</span>
                          <span className="font-bold text-slate-200">{item.quantity} {item.quantityUnit}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 text-[10px] uppercase font-semibold block">Servings</span>
                          <span className="font-bold text-emerald-400">{item.servings} people</span>
                        </div>
                      </div>

                      {/* Direct Donor Contact phone */}
                      <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[11px]">
                            <Phone className="w-3.5 h-3.5" /> Direct Donor Phone
                          </span>
                          <a
                            href={`tel:${item.contactPhone}`}
                            className="font-bold text-emerald-300 hover:underline"
                          >
                            {item.contactPhone}
                          </a>
                        </div>
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-400">Contact: </span>
                          <span className="font-semibold">{item.contactPerson}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-xs text-slate-300">
                        <div className="flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{item.location?.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>ETA: {item.estimatedPickupTime || 'Pending'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800">
                      <Link
                        to={`/donations/${item._id}`}
                        className="w-full py-2.5 px-4 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Full Pickup Coordination</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Search & Filters Bar */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search surplus by food name (e.g., Rice, Bread, Curry)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-600 text-xs sm:text-sm outline-none transition"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none transition"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c === 'All Categories' ? '' : c}>
                  {c}
                </option>
              ))}
            </select>

            {/* Food Type Filter */}
            <select
              value={foodTypeFilter}
              onChange={(e) => {
                setFoodTypeFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-blue-500 rounded-xl text-xs text-slate-200 outline-none transition"
            >
              <option value="">All Types (Veg & Non-Veg)</option>
              <option value="VEGETARIAN">🌱 Vegetarian Only</option>
              <option value="NON_VEGETARIAN">🍗 Non-Vegetarian Only</option>
            </select>

            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-md transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Donations Feed Grid */}
        {isLoading ? (
          <div className="py-24 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading available surplus donations...</p>
          </div>
        ) : donations.length === 0 ? (
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-850 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">No available surplus food right now</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                {categoryFilter || foodTypeFilter || searchQuery
                  ? 'No donations match your selected filters. Try clearing or expanding your search criteria.'
                  : 'All currently listed food surplus has either been accepted or reached its pickup deadline. Check back soon as donors publish after meal services.'}
              </p>
            </div>
            {(categoryFilter || foodTypeFilter || searchQuery) && (
              <button
                onClick={() => {
                  setCategoryFilter('');
                  setFoodTypeFilter('');
                  setSearchQuery('');
                  setPage(1);
                  fetchAvailableDonations(1, '', '', '');
                }}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {donations.map((item) => {
              const deadlineDate = new Date(item.pickupDeadline);
              const formattedDeadline = deadlineDate.toLocaleString(undefined, {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
              });

              // Time remaining calculation
              const diffMs = deadlineDate.getTime() - Date.now();
              const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
              const diffMinutes = Math.max(0, Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)));

              return (
                <div
                  key={item._id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-blue-500/30 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5 transition group"
                >
                  <div className="space-y-3">
                    {/* Header Tag Row */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-medium">
                        {item.category}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          item.foodType === 'VEGETARIAN'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {item.foodType === 'VEGETARIAN' ? '🌱 Vegetarian' : '🍗 Non-Vegetarian'}
                      </span>
                    </div>

                    {/* Food Name & Donor Organization */}
                    <div>
                      <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition line-clamp-1">
                        {item.foodName}
                      </h3>
                      <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-500" />
                        <span>{item.donor?.organization || 'Registered Food Donor'}</span>
                      </p>
                    </div>

                    {/* Quantity & Servings Capacity */}
                    <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-950/70 border border-slate-850 text-xs">
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Total Quantity</span>
                        <span className="font-bold text-slate-200">
                          {item.quantity} {item.quantityUnit}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] uppercase font-semibold block">Estimated Servings</span>
                        <span className="font-bold text-emerald-400">{item.servings} people</span>
                      </div>
                    </div>

                    {/* Location & Pickup Deadline */}
                    <div className="space-y-2 text-xs text-slate-300 pt-1">
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-1 text-slate-300">{item.location?.address}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>
                          Deadline: <strong className="text-white">{formattedDeadline}</strong>
                        </span>
                      </div>

                      {diffHours < 3 && (
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                          <span>⚡ Pickup needed soon ({diffHours}h {diffMinutes}m remaining)</span>
                        </div>
                      )}
                    </div>

                    {/* Allergen Badge preview */}
                    {item.allergenInfo?.allergensDeclared && item.allergenInfo.allergensDeclared.length > 0 ? (
                      <div className="text-[11px] text-amber-300/90 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-400" />
                        <span>Contains: {item.allergenInfo.allergensDeclared.join(', ')}</span>
                      </div>
                    ) : item.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED' ? (
                      <div className="text-[11px] text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Verified Allergen-Free</span>
                      </div>
                    ) : null}
                  </div>

                  {/* Card Action */}
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => handleView(item)}
                      className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Details</span>
                    </button>
                    <button
                      onClick={() => handleOpenAccept(item)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-blue-950/40 transition cursor-pointer"
                    >
                      <HeartHandshake className="w-3.5 h-3.5" />
                      <span>Claim Food</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-5 text-xs text-slate-400">
            <div>
              Showing <strong className="text-slate-200">{(page - 1) * 9 + 1}</strong> to{' '}
              <strong className="text-slate-200">{Math.min(page * 9, total)}</strong> of{' '}
              <strong className="text-slate-200">{total}</strong> available donations
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const prev = Math.max(1, page - 1);
                  setPage(prev);
                  fetchAvailableDonations(prev, categoryFilter, foodTypeFilter, searchQuery);
                }}
                disabled={page <= 1}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 text-slate-300 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => {
                  const next = Math.min(totalPages, page + 1);
                  setPage(next);
                  fetchAvailableDonations(next, categoryFilter, foodTypeFilter, searchQuery);
                }}
                disabled={page >= totalPages}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* Details Modal */}
      <DonationDetailsModal
        donation={selectedDonation}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDonation(null);
        }}
        onAcceptClick={(item) => handleOpenAccept(item)}
      />

      {/* Accept Donation Modal */}
      <AcceptDonationModal
        donation={donationToAccept}
        isOpen={isAcceptOpen}
        onClose={() => {
          setIsAcceptOpen(false);
          setDonationToAccept(null);
        }}
        onAccepted={(updated) => {
          setToastMessage(`🎉 Successfully accepted "${updated.foodName}"! Check My Claimed Pickups for contact info.`);
          fetchAvailableDonations(page, categoryFilter, foodTypeFilter, searchQuery);
          fetchAcceptedDonations();
          setTimeout(() => setToastMessage(null), 5000);
        }}
      />
    </div>
  );
}
