import React, { useState } from 'react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
              <HeartHandshake className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Accept & Claim Food Surplus</h3>
            
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          {/* Donation Summary Card */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white text-sm">{donation.foodName}</span>
              <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-semibold">
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

            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
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
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Estimated Pickup Time / ETA <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={estimatedPickupTime}
              onChange={(e) => setEstimatedPickupTime(e.target.value)}
              placeholder="e.g. Today around 3:30 PM, or within 45 mins"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 text-xs outline-none transition"
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
                      ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Coordination Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider block">
              Pickup Coordination Notes (Optional)
            </label>
            <textarea
              rows="2"
              value={acceptNotes}
              onChange={(e) => setAcceptNotes(e.target.value)}
              placeholder="e.g., Driver John will arrive in a silver van. Bringing insulated containers."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl text-slate-100 text-xs outline-none transition"
            />
          </div>

          {/* Commitment Notice */}
          <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[11px] space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              Direct Coordination Guarantee
            </div>
            <p className="text-slate-400 leading-relaxed">
              Upon acceptance, this listing will be marked <strong>ACCEPTED</strong> in real-time on the donor’s dashboard. Direct donor contact phone number and pickup notes will be unlocked for you immediately.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting || !estimatedPickupTime.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white text-xs font-bold shadow-lg shadow-blue-950/60 flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Confirming Acceptance...</span>
                </>
              ) : (
                <>
                
                  <span>Confirm & Claim Food</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
