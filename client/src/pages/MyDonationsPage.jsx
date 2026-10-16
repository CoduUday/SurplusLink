import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  PlusCircle,
  Clock,
  Calendar,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  AlertTriangle,
  Scale,
  Users,
  Sparkles
} from 'lucide-react';
import donationService from '../services/donationService';
import DonationDetailsModal from '../components/donation/DonationDetailsModal';
import EditDonationModal from '../components/donation/EditDonationModal';
import CancelDonationModal from '../components/donation/CancelDonationModal';

export default function MyDonationsPage() {
  const { user } = useAuth();

  const [donations, setDonations] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);

  const [notification, setNotification] = useState(null);

  const fetchListings = useCallback(async (targetPage = 1, status = statusFilter) => {
    setIsLoading(true);
    try {
      const params = { page: targetPage, limit: 10 };
      if (status) params.status = status;

      const response = await donationService.getMyDonations(params);
      if (response.success) {
        setDonations(response.donations || []);
        setTotal(response.total || 0);
        setPage(response.page || 1);
        setTotalPages(response.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to load donor listings:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchListings(1, statusFilter);
  }, [fetchListings, statusFilter]);

  const handleStatusFilterChange = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    setPage(1);
  };

  const handleView = (donation) => {
    setSelectedDonation(donation);
    setIsDetailsOpen(true);
  };

  const handleEdit = (donation) => {
    setSelectedDonation(donation);
    setIsEditOpen(true);
  };

  const handleCancelClick = (donation) => {
    setSelectedDonation(donation);
    setIsCancelOpen(true);
  };

  const handleUpdated = (updatedDonation) => {
    setNotification('Donation listing updated successfully.');
    fetchListings(page, statusFilter);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCancelled = (cancelledDonation) => {
    setNotification('Donation listing was cancelled.');
    fetchListings(page, statusFilter);
    setTimeout(() => setNotification(null), 3000);
  };

  const getStatusBadge = (donation) => {
    const isExpired = new Date(donation.pickupDeadline).getTime() <= Date.now();

    switch (donation.status) {
      case 'AVAILABLE':
        return isExpired ? (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[11px] font-semibold">
            EXPIRED
          </span>
        ) : (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> AVAILABLE
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-[11px] font-semibold">
            ACCEPTED
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-[11px] font-semibold">
            COLLECTED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[11px] font-semibold">
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-[11px] font-semibold">
            CANCELLED
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px] font-semibold">
            EXPIRED
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <Link
            to="/donor/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>

          <Link
            to="/donor/create-donation"
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition hover:-translate-y-0.5 self-start sm:self-auto"
          >
            <PlusCircle className="w-4 h-4" />
            <span>List New Surplus Food</span>
          </Link>
        </div>

        {/* Page Banner */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-slate-300 text-xs font-semibold mb-2">
              <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Donor Food Catalog
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">My Food Surplus Listings</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
              Track the live lifecycle of your surplus donations, make changes to available listings, or record cancellations.
            </p>
          </div>

          <div className="bg-[#0d1117] border border-[#30363d] rounded-xl px-5 py-3 text-right">
            <span className="text-xs text-slate-400 block font-medium">Total Listings Recorded</span>
            <span className="text-2xl font-bold text-white">{total}</span>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="p-4 rounded-xl bg-[#161b22] border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{notification}</span>
          </div>
        )}

        {/* Table / Card Container */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm animate-fade-in-up animation-delay-150">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#30363d] pb-5">
            <h2 className="text-lg font-bold text-white">All Published Surplus Items</h2>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Status:
              </span>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="px-3 py-1.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-slate-200 outline-none focus:border-slate-500 transition"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available</option>
                <option value="ACCEPTED">Accepted by NGO</option>
                <option value="COLLECTED">Collected</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>
          </div>

          {/* Table Content */}
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-slate-400">Loading your food listings...</p>
            </div>
          ) : donations.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-slate-500 mx-auto">
                <Utensils className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-200">No surplus food listings found</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  {statusFilter
                    ? `No listings currently match the '${statusFilter}' filter.`
                    : 'You have not listed any surplus food yet. Create your first donation to redirect excess meals to local communities.'}
                </p>
              </div>
              <Link
                to="/donor/create-donation"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5" /> List Food Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto border border-[#30363d] rounded-xl bg-[#0d1117]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#161b22] text-slate-300 uppercase tracking-wider text-[11px] border-b border-[#30363d]">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Food Item</th>
                    <th className="py-3 px-4 font-semibold">Category & Type</th>
                    <th className="py-3 px-4 font-semibold">Quantity / Servings</th>
                    <th className="py-3 px-4 font-semibold">Pickup Deadline</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Created</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#30363d] text-slate-300">
                  {donations.map((item) => {
                    const isAvailable = item.status === 'AVAILABLE';
                    const deadlineFormatted = new Date(item.pickupDeadline).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: true
                    });
                    const createdFormatted = new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric'
                    });

                    return (
                      <tr key={item._id} className="hover:bg-[#161b22]/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-sm text-white">{item.foodName}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <span>{item.location?.address}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="text-slate-200 font-medium">{item.category}</div>
                          <span
                            className={`inline-block text-[10px] font-semibold mt-0.5 ${
                              item.foodType === 'VEGETARIAN' ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.foodType === 'VEGETARIAN' ? '🌱 Veg' : '🍗 Non-Veg'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-slate-200">
                            {item.quantity} {item.quantityUnit}
                          </div>
                          <div className="text-[11px] text-emerald-400 font-medium">
                            {item.servings} servings
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 text-slate-200">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{deadlineFormatted}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">{getStatusBadge(item)}</td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">{createdFormatted}</td>

                        <td className="py-3.5 px-4 whitespace-nowrap text-right space-x-1.5">
                          <Link
                            to={`/donations/${item._id}`}
                            title="Find suitable NGOs (Smart Matching)"
                            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-[#30363d] transition inline-block align-middle"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </Link>

                          <button
                            onClick={() => handleView(item)}
                            title="Quick preview details"
                            className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition inline-block align-middle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {isAvailable ? (
                            <>
                              <button
                                onClick={() => handleEdit(item)}
                                title="Edit listing"
                                className="p-1.5 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-slate-300 hover:text-white border border-[#30363d] transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancelClick(item)}
                                title="Cancel listing"
                                className="p-1.5 rounded-lg bg-[#21262d] hover:bg-rose-950/60 text-rose-400 border border-[#30363d] transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-500 italic">Locked</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
              <div>
                Showing <strong className="text-slate-200">{(page - 1) * 10 + 1}</strong> to{' '}
                <strong className="text-slate-200">{Math.min(page * 10, total)}</strong> of{' '}
                <strong className="text-slate-200">{total}</strong> listings
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const prev = Math.max(1, page - 1);
                    setPage(prev);
                    fetchListings(prev, statusFilter);
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
                    fetchListings(next, statusFilter);
                  }}
                  disabled={page >= totalPages}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed text-slate-300 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Details Modal */}
      <DonationDetailsModal
        donation={selectedDonation}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedDonation(null);
        }}
      />

      {/* Edit Modal */}
      <EditDonationModal
        donation={selectedDonation}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedDonation(null);
        }}
        onUpdated={handleUpdated}
      />

      {/* Cancel Modal */}
      <CancelDonationModal
        donation={selectedDonation}
        isOpen={isCancelOpen}
        onClose={() => {
          setIsCancelOpen(false);
          setSelectedDonation(null);
        }}
        onCancelled={handleCancelled}
      />
    </div>
  );
}
