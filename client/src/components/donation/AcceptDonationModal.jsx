import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  HeartHandshake,
  Clock,
  MapPin,
  Building,
  Users,
  Scale,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Phone
} from 'lucide-react';
import donationService from '../../services/donationService';

export default function AcceptDonationModal({ donation, isOpen, onClose, onAccepted }) {
  if (!isOpen || !donation) return null;

  const [estimatedPickupTime, setEstimatedPickupTime] = useState('Within 45–60 minutes');
  const [acceptNotes, setAcceptNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const presets = [
    'Within 30 minutes',
    'Within 1 hour',
    'Today by 4:00 PM',
    'Before pickup deadline'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await donationService.acceptDonation(donation._id, {
        estimatedPickupTime: estimatedPickupTime.trim(),
        acceptNotes: acceptNotes.trim()
      });

      if (response.success && response.donation) {
        if (onAccepted) onAccepted(response.donation);
        onClose();
      }
    } catch (err) {
      console.error('Accept donation error:', err);
      const msg = err.response?.data?.message || 'Failed to accept donation. It may have already been claimed.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-[#30363d] flex items-center justify-between bg-[#161b22]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#21262d] border border-[#30363d] text-blue-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Accept & Claim Food Surplus</h3>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#21262d] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Donation Summary Card */}
          <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white">{donation.foodName}</span>
              <span className="px-2 py-0.5 rounded-full bg-[#21262d] text-blue-400 border border-[#30363d] text-[10px] font-semibold">
                {donation.category}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px] pt-1">
              <div className="flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-emerald-400" />
                <span>Quantity: <strong className="text-slate-200">{donation.quantity} {donation.quantityUnit}</strong></span>
              </div>
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Servings: <strong className="text-blue-300">{donation.servings} people</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1 border-t border-[#30363d]">
              <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span className="line-clamp-1">{donation.location?.address}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Estimated Pickup Time */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Estimated Pickup Time / ETA <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={estimatedPickupTime}
              onChange={(e) => setEstimatedPickupTime(e.target.value)}
              placeholder="e.g. Today around 3:30 PM, or within 45 mins"
              className="w-full px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setEstimatedPickupTime(preset)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                    estimatedPickupTime === preset
                      ? 'bg-blue-600/20 border-blue-500/40 text-blue-300 font-semibold'
                      : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Coordination Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
              Pickup Coordination Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={acceptNotes}
              onChange={(e) => setAcceptNotes(e.target.value)}
              placeholder="e.g., Driver John will arrive in a silver van. Bringing insulated containers."
              className="w-full px-3.5 py-2 bg-[#0d1117] border border-[#30363d] focus:border-blue-500 rounded-xl text-slate-100 placeholder-slate-500 text-xs outline-none transition"
            />
          </div>

          {/* Commitment Notice */}
          <div className="p-3.5 rounded-xl bg-[#0d1117] border border-blue-500/30 text-blue-300 text-[11px] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Direct Coordination Guarantee
            </div>
            <p className="text-slate-400 leading-relaxed">
              Upon acceptance, this listing will be marked <strong>ACCEPTED</strong> in real-time on the donor’s dashboard. Direct donor contact phone number and pickup notes will be unlocked for you immediately.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-[#30363d]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-300 text-xs font-semibold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !estimatedPickupTime.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming Acceptance...</span>
                </>
              ) : (
                <span>Confirm & Claim Food</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
