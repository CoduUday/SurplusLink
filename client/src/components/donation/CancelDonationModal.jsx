import React, { useState } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import donationService from '../../services/donationService';

export default function CancelDonationModal({ donation, isOpen, onClose, onCancelled }) {
  if (!isOpen || !donation) return null;

  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleCancel = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await donationService.cancelDonation(donation._id, reason);
      if (response.success && response.donation) {
        onCancelled(response.donation);
        onClose();
      }
    } catch (err) {
      console.error('Cancel donation error:', err);
      const msg =
        err.response?.data?.message || 'Failed to cancel donation listing. Please try again.';
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl space-y-5 relative">
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Cancel Surplus Listing</h3>
            <p className="text-xs text-slate-400">
              Are you sure you want to cancel <strong className="text-slate-200">{donation.foodName}</strong>?
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Once cancelled, this food listing will be permanently removed from the available NGO feed and cannot be accepted by partner organizations.
        </p>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleCancel} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Reason for Cancellation (optional)
            </label>
            <textarea
              rows="2"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Food repurposed internally, unexpected storage issue, or prepared quantity miscalculation."
              className="w-full px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-rose-500 transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
            >
              Keep Listing
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-rose-950/50 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Cancelling...</span>
                </>
              ) : (
                <span>Confirm Cancellation</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
