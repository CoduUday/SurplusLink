import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
  Utensils,
  MapPin,
  Clock,
  Phone,
  User,
  Building,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Scale,
  Users,
  ArrowLeft,
  Edit2,
  Trash2,
  ShieldCheck,
  Loader2,
  AlertCircle,
  HeartHandshake
} from 'lucide-react';
import donationService from '../services/donationService';
import EditDonationModal from '../components/donation/EditDonationModal';
import CancelDonationModal from '../components/donation/CancelDonationModal';
import AcceptDonationModal from '../components/donation/AcceptDonationModal';
import RecommendedNgosSection from '../components/matching/RecommendedNgosSection';

export default function DonationDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [donation, setDonation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [isAcceptOpen, setIsAcceptOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDonation = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await donationService.getDonationById(id);
      if (response.success && response.donation) {
        setDonation(response.donation);
      }
    } catch (err) {
      console.error('Fetch donation details error:', err);
      const msg = err.response?.data?.message || 'Failed to retrieve donation details.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDonation();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Loading donation details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !donation) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-xl mx-auto px-4 py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">Donation Record Unavailable</h2>
          <p className="text-xs text-slate-400">{error || 'The requested listing could not be found or you do not have permission to view it.'}</p>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    );
  }

  const isOwner = donation.donor?._id === user?._id || donation.donor === user?._id;
  const isNgo = user?.role === 'NGO';
  const isAvailable = donation.status === 'AVAILABLE';
  const isAccepted = donation.status === 'ACCEPTED';
  const isAcceptingNgo = isNgo && (donation.acceptedBy?._id === user?._id || donation.acceptedBy === user?._id);
  const isExpired = new Date(donation.pickupDeadline).getTime() <= Date.now();

  const formattedDeadline = new Date(donation.pickupDeadline).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  const formattedCreated = new Date(donation.createdAt).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Go Back
          </button>

          {isOwner && (
            <Link
              to="/donor/my-donations"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
            >
              All My Listings →
            </Link>
          )}
        </div>

        {/* Toast */}
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Hero Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    donation.status === 'AVAILABLE'
                      ? isExpired
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}
                >
                  {donation.status === 'AVAILABLE' && isExpired ? 'EXPIRED' : donation.status}
                </span>

                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    donation.foodType === 'VEGETARIAN'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {donation.foodType === 'VEGETARIAN' ? '🌱 Vegetarian' : '🍗 Non-Vegetarian'}
                </span>

                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs">
                  {donation.category}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{donation.foodName}</h1>
              <p className="text-xs text-slate-400">
                Offered by <strong className="text-slate-200">{donation.donor?.organization || 'Food Donor'}</strong> • Published {formattedCreated}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 self-start sm:self-auto">
              {isOwner && isAvailable && (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setIsCancelOpen(true)}
                    className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Cancel
                  </button>
                </>
              )}

              {isNgo && isAvailable && !isExpired && (
                <button
                  onClick={() => setIsAcceptOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-950/50 transition cursor-pointer"
                >
                 
                  <span>Accept & Claim Food</span>
                </button>
              )}
            </div>
          </div>

          {/* Prominent Accepted Status Card */}
          {isAccepted && (
            <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-500/20 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                    <HeartHandshake className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Donation Accepted & Claimed for Pickup</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold border border-blue-500/30">
                        ACCEPTED
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {isOwner
                        ? 'Good news! An authorized NGO partner has committed to picking up this surplus food.'
                        : isAcceptingNgo
                        ? 'Your organization has claimed this donation. Please collect the food before the deadline.'
                        : 'This listing has already been accepted by a partner NGO.'}
                    </p>
                  </div>
                </div>

                {donation.acceptedAt && (
                  <span className="text-[11px] text-slate-400 font-medium sm:text-right">
                    Accepted on: <strong className="text-slate-200">{new Date(donation.acceptedAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true })}</strong>
                  </span>
                )}
              </div>

              {/* NGO & Coordination Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block">
                    Claiming NGO
                  </span>
                  <div className="font-bold text-slate-100 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-blue-400" />
                    <span>{donation.acceptedBy?.organization || 'Registered NGO Partner'}</span>
                  </div>
                  {donation.acceptedBy?.name && (
                    <div className="text-[11px] text-slate-400">
                      Rep: {donation.acceptedBy.name}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block">
                    NGO Contact Phone
                  </span>
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" />
                    <a href={`tel:${donation.acceptedBy?.contact || donation.acceptedBy?.phone}`} className="hover:underline">
                      {donation.acceptedBy?.contact || donation.acceptedBy?.phone || 'Direct phone verified'}
                    </a>
                  </div>
                  {donation.acceptedBy?.email && (
                    <div className="text-[11px] text-slate-400 truncate">
                      {donation.acceptedBy.email}
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block">
                    Estimated Pickup ETA
                  </span>
                  <div className="font-bold text-amber-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{donation.estimatedPickupTime || 'Pending coordination'}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Deadline: {formattedDeadline}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-slate-500 uppercase tracking-wider font-semibold text-[10px] block">
                    Coordination Notes
                  </span>
                  <p className="text-slate-200 italic line-clamp-2">
                    {donation.acceptNotes ? `"${donation.acceptNotes}"` : 'No coordination notes provided.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-400" /> Total Food Quantity
              </span>
              <div className="text-2xl font-bold text-white">
                {donation.quantity} <span className="text-xs text-slate-400 font-normal">{donation.quantityUnit}</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" /> Potential Beneficiaries
              </span>
              <div className="text-2xl font-bold text-emerald-400">
                {donation.servings} <span className="text-xs text-slate-400 font-normal">people served</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-850 space-y-1">
              <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Must Be Picked Up By
              </span>
              <div className={`text-sm font-bold ${isExpired ? 'text-amber-400' : 'text-slate-200'}`}>
                {formattedDeadline}
              </div>
            </div>
          </div>

          {/* Allergen & Ingredient Information */}
          <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> Allergen & Safety Information
              </h3>
              {/* <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium ${
                  donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : donation.allergenInfo?.declarationStatus === 'DECLARED_ALLERGENS'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                  ? 'Verified Allergen-Free'
                  : donation.allergenInfo?.declarationStatus === 'DECLARED_ALLERGENS'
                  ? 'Allergens Declared'
                  : 'Not Formally Tested / Unknown'}
              </span> */}
            </div>

            {donation.allergenInfo?.allergensDeclared && donation.allergenInfo.allergensDeclared.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {donation.allergenInfo.allergensDeclared.map((allergen, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium"
                  >
                    Contains: {allergen}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                {donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                  ? 'Donor has verified this food was prepared in a facility free of common major allergens.'
                  : 'No specific allergens were declared. Please exercise standard institutional food safety precautions.'}
              </p>
            )}

            {donation.allergenInfo?.ingredientNotes && (
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300">
                <span className="text-slate-500 font-medium block">Ingredient Notes:</span>
                <p className="mt-0.5">{donation.allergenInfo.ingredientNotes}</p>
              </div>
            )}
          </div>

          {/* Location & Instructions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Pickup Location
              </h3>
              <p className="text-sm font-medium text-slate-200">{donation.location?.address}</p>
              {donation.location?.coordinates && donation.location.coordinates[0] !== 0 && (
                <span className="text-[11px] text-slate-500 block">
                  GPS: [{donation.location.coordinates[1]?.toFixed(4)}° N, {donation.location.coordinates[0]?.toFixed(4)}° E]
                </span>
              )}
            </div>

            <div className="p-5 rounded-2xl bg-slate-950/50 border border-slate-800 space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" /> Pickup Instructions
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {donation.pickupInstructions || 'Standard pickup at front desk or loading bay during operating hours.'}
              </p>
            </div>
          </div>

          {/* Contact Details */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contact Details (Authorized Access)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Contact Person</span>
                <span className="font-semibold text-slate-200 text-sm">{donation.contactPerson}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Phone Number</span>
                <a
                  href={`tel:${donation.contactPhone}`}
                  className="font-semibold text-emerald-400 text-sm hover:underline"
                >
                  {donation.contactPhone}
                </a>
              </div>
            </div>
          </div>

          {/* Cancellation Notice if applicable */}
          {donation.status === 'CANCELLED' && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
              <span className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" /> This listing was cancelled by the donor
              </span>
              {donation.cancellationReason && (
                <p>Reason: {donation.cancellationReason}</p>
              )}
            </div>
          )}
        </div>

        {/* Feature 4: Smart NGO Matching Section for Donors */}
        {isOwner && (
          <RecommendedNgosSection donationId={donation._id} isAvailable={isAvailable} />
        )}
      </main>

      {/* Edit Modal */}
      <EditDonationModal
        donation={donation}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={(updated) => {
          setDonation(updated);
          setToastMessage('Donation listing updated successfully.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Cancel Modal */}
      <CancelDonationModal
        donation={donation}
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        onCancelled={(cancelled) => {
          setDonation(cancelled);
          setToastMessage('Donation listing cancelled.');
          setTimeout(() => setToastMessage(null), 3000);
        }}
      />

      {/* Accept Donation Modal for NGOs */}
      <AcceptDonationModal
        donation={donation}
        isOpen={isAcceptOpen}
        onClose={() => setIsAcceptOpen(false)}
        onAccepted={(updated) => {
          setDonation(updated);
          setToastMessage('🎉 Donation accepted successfully! Pickup coordination details unlocked.');
          setTimeout(() => setToastMessage(null), 4000);
        }}
      />
    </div>
  );
}
