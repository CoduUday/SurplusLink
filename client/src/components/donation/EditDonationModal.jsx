import React, { useState } from 'react';
import {
  X,
  Utensils,
  Calendar,
  Clock,
  Users,
  Scale,
  MapPin,
  Phone,
  User,
  AlertCircle,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Crosshair
} from 'lucide-react';
import donationService from '../../services/donationService';

const ALLERGEN_OPTIONS = [
  'Dairy',
  'Gluten',
  'Peanuts',
  'Tree Nuts',
  'Eggs',
  'Soy',
  'Fish',
  'Shellfish',
  'Sesame'
];

export default function EditDonationModal({ donation, isOpen, onClose, onUpdated }) {
  if (!isOpen || !donation) return null;

  // Format initial pickup deadline to YYYY-MM-DDTHH:MM for datetime-local
  const getInitialDateTimeLocal = (dateInput) => {
    if (!dateInput) return '';
    const date = new Date(dateInput);
    const offset = date.getTimezoneOffset() * 60000;
    const localTime = new Date(date.getTime() - offset);
    return localTime.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    foodName: donation.foodName || '',
    category: donation.category || 'Cooked Meals',
    quantity: String(donation.quantity || ''),
    quantityUnit: donation.quantityUnit || 'kg',
    foodType: donation.foodType || 'VEGETARIAN',
    servings: String(donation.servings || ''),
    pickupDeadline: getInitialDateTimeLocal(donation.pickupDeadline),
    locationAddress: donation.location?.address || '',
    latitude: donation.location?.coordinates?.[1] ? String(donation.location.coordinates[1]) : '',
    longitude: donation.location?.coordinates?.[0] ? String(donation.location.coordinates[0]) : '',
    contactPerson: donation.contactPerson || '',
    contactPhone: donation.contactPhone || '',
    pickupInstructions: donation.pickupInstructions || '',
    allergensDeclared: donation.allergenInfo?.allergensDeclared || [],
    ingredientNotes: donation.allergenInfo?.ingredientNotes || '',
    declarationStatus: donation.allergenInfo?.declarationStatus || 'UNKNOWN_UNVERIFIED'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState(null);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your browser.'
      });
      return;
    }

    setIsLocating(true);
    setLocationFeedback(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        const accuracy = Math.round(position.coords.accuracy);

        setFormData((prev) => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));

        setErrors((prev) => {
          const updated = { ...prev };
          delete updated.latitude;
          delete updated.longitude;
          return updated;
        });

        setLocationFeedback({
          type: 'success',
          message: `Location updated via GPS (~${accuracy}m accuracy).`
        });
        setIsLocating(false);
      },
      (error) => {
        let msg = 'Unable to detect GPS coordinates.';
        if (error.code === 1) msg = 'Location access denied.';
        else if (error.code === 2) msg = 'GPS position unavailable.';
        else if (error.code === 3) msg = 'GPS request timed out.';
        setLocationFeedback({
          type: 'error',
          message: msg
        });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.foodName.trim()) newErrors.foodName = 'Food name is required.';
    if (!formData.category) newErrors.category = 'Category is required.';

    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number greater than 0.';
    }

    const srv = Number(formData.servings);
    if (!formData.servings || isNaN(srv) || !Number.isInteger(srv) || srv < 1) {
      newErrors.servings = 'Servings must be a positive whole integer of at least 1 person.';
    }

    if (!formData.pickupDeadline) {
      newErrors.pickupDeadline = 'Pickup deadline is required.';
    } else {
      const deadlineDate = new Date(formData.pickupDeadline);
      if (deadlineDate.getTime() <= Date.now()) {
        newErrors.pickupDeadline = 'Pickup deadline must be set to a future date and time.';
      }
    }

    if (!formData.locationAddress.trim()) {
      newErrors.locationAddress = 'Pickup address is required.';
    }

    // Latitude & Longitude validation
    if (!formData.latitude || !String(formData.latitude).trim()) {
      newErrors.latitude = 'Latitude is required.';
    } else {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90 degrees.';
      }
    }

    if (!formData.longitude || !String(formData.longitude).trim()) {
      newErrors.longitude = 'Longitude is required.';
    } else {
      const lng = Number(formData.longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Longitude must be between -180 and 180 degrees.';
      }
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person name is required.';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone number is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
    if (serverError) setServerError(null);
  };

  const toggleAllergen = (allergen) => {
    setFormData((prev) => {
      const exists = prev.allergensDeclared.includes(allergen);
      const updated = exists
        ? prev.allergensDeclared.filter((a) => a !== allergen)
        : [...prev.allergensDeclared, allergen];

      let newStatus = prev.declarationStatus;
      if (updated.length > 0) {
        newStatus = 'DECLARED_ALLERGENS';
      }

      return {
        ...prev,
        allergensDeclared: updated,
        declarationStatus: newStatus
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    setServerError(null);

    try {
      const payload = {
        foodName: formData.foodName.trim(),
        category: formData.category,
        quantity: parseFloat(formData.quantity),
        quantityUnit: formData.quantityUnit,
        foodType: formData.foodType,
        servings: parseInt(formData.servings, 10),
        pickupDeadline: new Date(formData.pickupDeadline).toISOString(),
        location: {
          address: formData.locationAddress.trim(),
          coordinates: [parseFloat(formData.longitude), parseFloat(formData.latitude)]
        },
        contactPerson: formData.contactPerson.trim(),
        contactPhone: formData.contactPhone.trim(),
        pickupInstructions: formData.pickupInstructions.trim(),
        allergenInfo: {
          allergensDeclared: formData.allergensDeclared,
          ingredientNotes: formData.ingredientNotes.trim(),
          declarationStatus: formData.declarationStatus
        }
      };

      const response = await donationService.updateDonation(donation._id, payload);
      if (response.success && response.donation) {
        onUpdated(response.donation);
        onClose();
      }
    } catch (err) {
      console.error('Update donation error:', err);
      const msg =
        err.response?.data?.message || 'Failed to update donation listing. Please check your inputs.';
      setServerError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-6 right-6 text-slate-400 hover:text-white p-1 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-2">
            <Utensils className="w-3.5 h-3.5" /> Edit Food Listing
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Update Surplus Listing</h2>
          <p className="text-xs text-slate-400 mt-1">
            Modifications can only be saved while the listing is in Available status.
          </p>
        </div>

        {serverError && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Update Failed</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Food Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Food Item Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="foodName"
                value={formData.foodName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.foodName ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.foodName && <p className="text-xs text-rose-400">{errors.foodName}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Category <span className="text-rose-400">*</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
              >
                <option value="Cooked Meals">Cooked Meals</option>
                <option value="Bakery & Bread">Bakery & Bread</option>
                <option value="Fresh Produce">Fresh Produce</option>
                <option value="Dairy & Eggs">Dairy & Eggs</option>
                <option value="Packaged Food">Packaged Food</option>
                <option value="Beverages">Beverages</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Food Type Toggle */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Food Type <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, foodType: 'VEGETARIAN' }))}
                className={`py-2 px-4 rounded-xl border text-xs font-semibold transition ${
                  formData.foodType === 'VEGETARIAN'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🌱 Vegetarian
              </button>
              <button
                type="button"
                onClick={() => setFormData((p) => ({ ...p, foodType: 'NON_VEGETARIAN' }))}
                className={`py-2 px-4 rounded-xl border text-xs font-semibold transition ${
                  formData.foodType === 'NON_VEGETARIAN'
                    ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                🍗 Non-Vegetarian
              </button>
            </div>
          </div>

          {/* Quantity, Unit & Servings */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Quantity <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.quantity ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Quantity Unit <span className="text-rose-400">*</span>
              </label>
              <select
                name="quantityUnit"
                value={formData.quantityUnit}
                onChange={handleChange}
                className="w-full px-3 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
              >
                <option value="kg">kg (kilograms)</option>
                <option value="grams">grams</option>
                <option value="litres">litres</option>
                <option value="packets">packets</option>
                <option value="servings">servings</option>
                <option value="boxes">boxes</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                People Served <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="1"
                min="1"
                name="servings"
                value={formData.servings}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.servings ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.servings && <p className="text-xs text-rose-400">{errors.servings}</p>}
            </div>
          </div>

          {/* Pickup Deadline */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              Pickup Deadline <span className="text-rose-400">*</span>
            </label>
            <input
              type="datetime-local"
              name="pickupDeadline"
              value={formData.pickupDeadline}
              onChange={handleChange}
              className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                errors.pickupDeadline ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
              } rounded-xl text-slate-100 text-sm outline-none transition`}
            />
            {errors.pickupDeadline && <p className="text-xs text-rose-400">{errors.pickupDeadline}</p>}
          </div>

          {/* Allergen Information */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Allergen & Ingredient Declaration
            </label>

            <div className="space-y-2">
              <span className="text-[11px] text-slate-400">Select any declared allergens:</span>
              <div className="flex flex-wrap gap-2">
                {ALLERGEN_OPTIONS.map((allergen) => {
                  const isChecked = formData.allergensDeclared.includes(allergen);
                  return (
                    <button
                      key={allergen}
                      type="button"
                      onClick={() => toggleAllergen(allergen)}
                      className={`px-3 py-1 rounded-xl text-xs font-medium border transition ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {allergen}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-[11px] text-slate-400">Ingredient Notes (optional):</label>
              <textarea
                name="ingredientNotes"
                rows="2"
                value={formData.ingredientNotes}
                onChange={handleChange}
                placeholder="e.g., Prepared in a peanut-free commercial kitchen; includes dairy butter in sauce."
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Location & Instructions */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pickup Address <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="locationAddress"
                value={formData.locationAddress}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.locationAddress ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.locationAddress && <p className="text-xs text-rose-400">{errors.locationAddress}</p>}
            </div>

            {/* Coordinates Section with GPS Auto-detection */}
            <div className="space-y-2.5 bg-slate-950/50 p-3.5 rounded-2xl border border-slate-800/80">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                  Geographic Coordinates <span className="text-rose-400">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAutoDetectLocation}
                  disabled={isLocating}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold rounded-lg transition disabled:opacity-50 cursor-pointer"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" /> Detecting...
                    </>
                  ) : (
                    <>
                      <Crosshair className="w-3 h-3" /> Auto-detect GPS
                    </>
                  )}
                </button>
              </div>

              {locationFeedback && (
                <div
                  className={`p-2 rounded-lg text-xs flex items-center gap-1.5 ${
                    locationFeedback.type === 'success'
                      ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {locationFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>{locationFeedback.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Latitude <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="latitude"
                    value={formData.latitude}
                    onChange={handleChange}
                    placeholder="e.g. 12.9716"
                    className={`w-full px-3 py-1.5 bg-slate-900 border ${
                      errors.latitude ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                    } rounded-xl text-slate-200 text-xs outline-none transition`}
                  />
                  {errors.latitude && <p className="text-xs text-rose-400">{errors.latitude}</p>}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Longitude <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="any"
                    name="longitude"
                    value={formData.longitude}
                    onChange={handleChange}
                    placeholder="e.g. 77.5946"
                    className={`w-full px-3 py-1.5 bg-slate-900 border ${
                      errors.longitude ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                    } rounded-xl text-slate-200 text-xs outline-none transition`}
                  />
                  {errors.longitude && <p className="text-xs text-rose-400">{errors.longitude}</p>}
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Pickup Instructions (optional)
              </label>
              <textarea
                name="pickupInstructions"
                rows="2"
                value={formData.pickupInstructions}
                onChange={handleChange}
                className="w-full px-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-200 text-xs outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Contact Person <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.contactPerson ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.contactPerson && <p className="text-xs text-rose-400">{errors.contactPerson}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Contact Phone <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 bg-slate-950/80 border ${
                  errors.contactPhone ? 'border-rose-500' : 'border-slate-800 focus:border-emerald-500'
                } rounded-xl text-slate-100 text-sm outline-none transition`}
              />
              {errors.contactPhone && <p className="text-xs text-rose-400">{errors.contactPhone}</p>}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-lg shadow-emerald-950/50 transition disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
