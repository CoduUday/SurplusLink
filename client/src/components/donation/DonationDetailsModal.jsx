import React from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  MapPin,
  Clock,
  Phone,
  User,
  Building,
  AlertTriangle,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Utensils,
  Scale,
  Users,
  Info,
  Sparkles,
  HeartHandshake
} from 'lucide-react';

export default function DonationDetailsModal({ donation, isOpen, onClose, onAcceptClick }) {
  if (!isOpen || !donation) return null;

  const isExpired = new Date(donation.pickupDeadline).getTime() <= Date.now();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'AVAILABLE':
        return isExpired ? (
          <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-semibold">
            EXPIRED
          </span>
        ) : (
          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> AVAILABLE FOR PICKUP
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-semibold">
            ACCEPTED BY NGO
          </span>
        );
      case 'COLLECTED':
        return (
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 text-xs font-semibold">
            COLLECTED
          </span>
        );
      case 'DELIVERED':
        return (
          <span className="px-3 py-1 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 text-xs font-semibold">
            DELIVERED
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="px-3 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold">
            CANCELLED
          </span>
        );
      case 'EXPIRED':
      default:
        return (
          <span className="px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-xs font-semibold">
            EXPIRED
          </span>
        );
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-[#21262d] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-2 pr-8">
          <div className="flex flex-wrap items-center gap-2">
            {getStatusBadge(donation.status)}
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                donation.foodType === 'VEGETARIAN'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
              }`}
            >
              {donation.foodType === 'VEGETARIAN' ? '🌱 Vegetarian' : '🍗 Non-Vegetarian'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#21262d] border border-[#30363d] text-slate-300 text-xs">
              {donation.category}
            </span>
          </div>

          <h2 className="text-2xl font-bold text-white mt-1 tracking-tight">{donation.foodName}</h2>
          <p className="text-xs text-slate-400">
            Listed by <strong className="text-slate-200">{donation.donor?.organization || 'Food Donor'}</strong> • Created on {formattedCreated}
          </p>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Scale className="w-3.5 h-3.5 text-emerald-400" /> Quantity
            </span>
            <div className="text-xl font-bold text-white">
              {donation.quantity} <span className="text-xs text-slate-400 font-normal">{donation.quantityUnit}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" /> Feeds People
            </span>
            <div className="text-xl font-bold text-emerald-400">
              {donation.servings} <span className="text-xs text-slate-400 font-normal">servings</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1">
            <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Pickup Deadline
            </span>
            <div className={`text-sm font-bold ${isExpired ? 'text-amber-400' : 'text-slate-100'}`}>
              {formattedDeadline}
            </div>
          </div>
        </div>

        {/* Allergen & Ingredient Details */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Allergen & Ingredient Declaration
            </span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : donation.allergenInfo?.declarationStatus === 'DECLARED_ALLERGENS'
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  : 'bg-[#21262d] text-slate-300 border border-[#30363d]'
              }`}
            >
              {donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                ? 'Verified Allergen-Free'
                : donation.allergenInfo?.declarationStatus === 'DECLARED_ALLERGENS'
                ? 'Allergens Declared'
                : 'Not Formally Tested / Unknown'}
            </span>
          </div>

          {donation.allergenInfo?.allergensDeclared && donation.allergenInfo.allergensDeclared.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {donation.allergenInfo.allergensDeclared.map((allergen, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium"
                >
                  Contains: {allergen}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">
              {donation.allergenInfo?.declarationStatus === 'ALLERGEN_FREE_VERIFIED'
                ? 'Confirmed free of common major allergens by donor.'
                : 'No specific allergens declared by donor. Food should be handled according to standard food safety precautions.'}
            </p>
          )}

          {donation.allergenInfo?.ingredientNotes && (
            <div className="pt-2 border-t border-[#30363d] text-xs text-slate-300">
              <span className="text-slate-400 font-medium block">Ingredient Notes:</span>
              <p className="mt-0.5">{donation.allergenInfo.ingredientNotes}</p>
            </div>
          )}
        </div>

        {/* Location & Instructions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" /> Pickup Location
            </span>
            <p className="text-sm font-medium text-slate-100">{donation.location?.address}</p>
            {donation.location?.coordinates && donation.location.coordinates[0] !== 0 && (
              <span className="text-[11px] text-slate-400 block">
                GPS: [{donation.location.coordinates[1]?.toFixed(4)}° N, {donation.location.coordinates[0]?.toFixed(4)}° E]
              </span>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> Pickup Instructions
            </span>
            <p className="text-xs text-slate-300">
              {donation.pickupInstructions || 'Standard pickup at front desk or main entrance during operating hours.'}
            </p>
          </div>
        </div>

        {/* Contact Information */}
        <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contact Details (Authorized Access)
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Contact Person</span>
              <span className="font-semibold text-slate-100 text-sm">{donation.contactPerson}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Phone Number</span>
              <a
                href={`tel:${donation.contactPhone}`}
                className="font-semibold text-emerald-400 text-sm hover:underline"
              >
                {donation.contactPhone}
              </a>
            </div>
          </div>
        </div>

        {/* Acceptance Notice if accepted */}
        {donation.status === 'ACCEPTED' && (
          <div className="p-4 rounded-xl bg-[#0d1117] border border-blue-500/30 text-xs text-blue-300 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-white">
                <HeartHandshake className="w-4 h-4 text-blue-400" />
                Accepted by {donation.acceptedBy?.organization || 'Partner NGO'}
              </span>
              {donation.acceptedAt && (
                <span className="text-[11px] text-slate-400">
                  {new Date(donation.acceptedAt).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                <span className="text-slate-400 block">Contact Phone</span>
                <span className="text-emerald-400 font-semibold">{donation.acceptedBy?.contact || donation.acceptedBy?.phone || 'Direct contact'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Estimated ETA</span>
                <span className="text-amber-300 font-semibold">{donation.estimatedPickupTime || 'Coordinating'}</span>
              </div>
            </div>
            {donation.acceptNotes && (
              <p className="text-[11px] text-slate-300 italic pt-1 border-t border-[#30363d]">
                "{donation.acceptNotes}"
              </p>
            )}
          </div>
        )}

        {/* Cancellation Notice if applicable */}
        {donation.status === 'CANCELLED' && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 space-y-1">
            <span className="font-bold flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> This donation was cancelled by the donor
            </span>
            {donation.cancellationReason && (
              <p>Reason: {donation.cancellationReason}</p>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2">
            {donation._id && (
              <Link
                to={`/donations/${donation._id}`}
                className="px-4 py-2 rounded-xl bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-[#30363d] text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Open Full Page →</span>
              </Link>
            )}

            {onAcceptClick && donation.status === 'AVAILABLE' && !isExpired && (
              <button
                onClick={() => {
                  onClose();
                  onAcceptClick(donation);
                }}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>Accept & Claim Food</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 hover:text-white text-xs font-semibold transition self-end sm:self-auto cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
