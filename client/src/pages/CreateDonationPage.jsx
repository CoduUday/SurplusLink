import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import {
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
  ArrowLeft,
  Sparkles,
  Info,
  Crosshair
} from 'lucide-react';
import donationService from '../services/donationService';

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

export default function CreateDonationPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Compute a default deadline 4 hours in the future
  const getDefaultDeadline = () => {
    const d = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    foodName: '',
    category: 'Cooked Meals',
    quantity: '',
    quantityUnit: 'kg',
    foodType: 'VEGETARIAN',
    servings: '',
    pickupDeadline: getDefaultDeadline(),
    locationAddress: user?.address?.fullAddress || user?.address?.street || '',
    latitude: user?.location?.coordinates?.[1] ? String(user.location.coordinates[1]) : '',
    longitude: user?.location?.coordinates?.[0] ? String(user.location.coordinates[0]) : '',
    contactPerson: user?.name || '',
    contactPhone: user?.contact || '',
    pickupInstructions: '',
    allergensDeclared: [],
    ingredientNotes: '',
    declarationStatus: 'UNKNOWN_UNVERIFIED'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState(null);

  const handleAutoDetectLocation = () => {
    if (!navigator.geolocation) {
      setLocationFeedback({
        type: 'error',
        message: 'Geolocation is not supported by your browser. Please enter coordinates manually.'
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
          message: `Coordinates detected successfully via GPS (~${accuracy}m accuracy).`
        });
        setIsLocating(false);
      },
      (error) => {
        let msg = 'Unable to detect GPS coordinates.';
        if (error.code === 1) { // PERMISSION_DENIED
          msg = 'Location permission was denied. Please allow location access or type coordinates manually.';
        } else if (error.code === 2) { // POSITION_UNAVAILABLE
          msg = 'GPS position unavailable. Please enter latitude and longitude manually.';
        } else if (error.code === 3) { // TIMEOUT
          msg = 'GPS request timed out. Please retry or enter coordinates manually.';
        }
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

    if (!formData.foodName.trim()) {
      newErrors.foodName = 'Please enter a descriptive food name.';
    } else if (formData.foodName.trim().length > 150) {
      newErrors.foodName = 'Food name cannot exceed 150 characters.';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a food category.';
    }

    const qty = Number(formData.quantity);
    if (!formData.quantity || isNaN(qty) || qty <= 0) {
      newErrors.quantity = 'Quantity must be a positive number greater than 0.';
    }

    const srv = Number(formData.servings);
    if (!formData.servings || isNaN(srv) || !Number.isInteger(srv) || srv < 1) {
      newErrors.servings = 'Servings must be a positive whole number of people (at least 1).';
    }

    if (!formData.pickupDeadline) {
      newErrors.pickupDeadline = 'Pickup deadline date and time is required.';
    } else {
      const deadlineDate = new Date(formData.pickupDeadline);
      if (isNaN(deadlineDate.getTime())) {
        newErrors.pickupDeadline = 'Invalid pickup deadline format.';
      } else if (deadlineDate.getTime() <= Date.now()) {
        newErrors.pickupDeadline = 'Pickup deadline must be a future date and time.';
      }
    }

    if (!formData.locationAddress.trim()) {
      newErrors.locationAddress = 'Pickup address is required so NGOs can reach you.';
    }

    // Mandatory Latitude & Longitude for Proximity Matching
    if (!formData.latitude || !String(formData.latitude).trim()) {
      newErrors.latitude = 'Latitude is required for smart NGO proximity matching.';
    } else {
      const lat = Number(formData.latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Latitude must be between -90 and 90 degrees.';
      }
    }

    if (!formData.longitude || !String(formData.longitude).trim()) {
      newErrors.longitude = 'Longitude is required for smart NGO proximity matching.';
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
      newErrors.contactPhone = 'Valid contact phone number is required.';
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

    let coords = [0, 0];
    if (formData.longitude && formData.latitude) {
      coords = [parseFloat(formData.longitude), parseFloat(formData.latitude)];
    }

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
          type: 'Point',
          coordinates: coords
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

      const response = await donationService.createDonation(payload);
      if (response.success && response.donation) {
        setSuccessMessage('Food surplus listing created and published successfully!');
        setTimeout(() => {
          navigate(`/donations/${response.donation._id}`);
        }, 1200);
      }
    } catch (err) {
      console.error('Create donation error:', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.details && err.response.data.details.join(', ')) ||
        'Failed to publish donation listing. Please review the form and try again.';
      setServerError(msg);
      // Preserves entered form data on failure
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            to="/donor/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-emerald-400 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
          <Link
            to="/donor/my-donations"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition"
          >
            View My Listings →
          </Link>
        </div>

        {/* Page Header */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-emerald-400 text-xs font-semibold mb-3">
            <Utensils className="w-3.5 h-3.5" /> Food Surplus Listing
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">List Surplus Food for Donation</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-2xl">
            Publish prepared meals, bakery items, or excess groceries. Nearby verified NGOs will be alerted to claim and distribute food before the pickup deadline.
          </p>
        </div>

        {/* Feedback Alerts */}
        {serverError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Failed to Publish Listing</span>
              <span>{serverError}</span>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>{successMessage} Redirecting to listing details...</span>
          </div>
        )}

        {/* Listing Form */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Food Details */}
            <div className="border-b border-[#30363d] pb-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Utensils className="w-4 h-4 text-emerald-400" /> 1. Food Details & Categorization
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Food Name / Description <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="foodName"
                    value={formData.foodName}
                    onChange={handleChange}
                    placeholder="e.g., Vegetable Biryani, Assorted Bakery Croissants"
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.foodName ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
                  />
                  {errors.foodName && <p className="text-xs text-rose-400">{errors.foodName}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
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
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Food Type <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-4 max-w-md">
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, foodType: 'VEGETARIAN' }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.foodType === 'VEGETARIAN'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
                    }`}
                  >
                    <span>🌱</span>
                    <span>Vegetarian</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, foodType: 'NON_VEGETARIAN' }))}
                    className={`py-2.5 px-4 rounded-xl border text-xs font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                      formData.foodType === 'NON_VEGETARIAN'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-[#0d1117] border-[#30363d] text-slate-400 hover:text-slate-200 hover:bg-[#21262d]'
                    }`}
                  >
                    <span>🍗</span>
                    <span>Non-Vegetarian</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 2: Quantities & Servings */}
            <div className="border-b border-[#30363d] pb-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-emerald-400" /> 2. Quantity & Servings Capacity
                </h3>
                <span className="text-[11px] text-slate-400">Separately measured quantities</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Quantity Amount <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    placeholder="e.g. 15.0"
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.quantity ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
                  />
                  {errors.quantity && <p className="text-xs text-rose-400">{errors.quantity}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Measurement Unit <span className="text-rose-400">*</span>
                  </label>
                  <select
                    name="quantityUnit"
                    value={formData.quantityUnit}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-100 text-sm outline-none transition"
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
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-emerald-400" /> People Served <span className="text-rose-400">*</span>
                    </label>
                  </div>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    name="servings"
                    value={formData.servings}
                    onChange={handleChange}
                    placeholder="e.g. 50"
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.servings ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
                  />
                  {errors.servings && <p className="text-xs text-rose-400">{errors.servings}</p>}
                </div>
              </div>
            </div>

            {/* Section 3: Pickup Deadline & Location */}
            <div className="border-b border-[#30363d] pb-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" /> 3. Pickup Schedule & Logistics
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Pickup Deadline <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="pickupDeadline"
                    value={formData.pickupDeadline}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.pickupDeadline ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 text-sm outline-none transition`}
                  />
                  <span className="text-[11px] text-slate-400">
                    Food will be automatically retired from available feeds after this time.
                  </span>
                  {errors.pickupDeadline && <p className="text-xs text-rose-400">{errors.pickupDeadline}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Pickup Address <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="locationAddress"
                    value={formData.locationAddress}
                    onChange={handleChange}
                    placeholder="Street address, building, city"
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.locationAddress ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 placeholder-slate-500 text-sm outline-none transition`}
                  />
                  {errors.locationAddress && <p className="text-xs text-rose-400">{errors.locationAddress}</p>}
                </div>
              </div>

              {/* Coordinates Section with GPS Auto-detection */}
              <div className="space-y-3 bg-[#0d1117] p-4 rounded-xl border border-[#30363d]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
                      Geographic Coordinates <span className="text-rose-400">*</span>
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Required for Smart NGO proximity & service-radius matching.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAutoDetectLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#21262d] hover:bg-[#30363d] text-emerald-400 border border-[#30363d] text-xs font-semibold rounded-xl transition disabled:opacity-50 self-start sm:self-auto cursor-pointer"
                  >
                    {isLocating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Detecting GPS...
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-3.5 h-3.5" /> Auto-detect Location (GPS)
                      </>
                    )}
                  </button>
                </div>

                {locationFeedback && (
                  <div
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      locationFeedback.type === 'success'
                        ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
                    }`}
                  >
                    {locationFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{locationFeedback.message}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Latitude <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 12.9716"
                      className={`w-full px-3.5 py-2 bg-[#161b22] border ${
                        errors.latitude ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                      } rounded-xl text-slate-100 text-xs outline-none transition`}
                    />
                    {errors.latitude && <p className="text-xs text-rose-400">{errors.latitude}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">
                      Longitude <span className="text-rose-400">*</span>
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="e.g. 77.5946"
                      className={`w-full px-3.5 py-2 bg-[#161b22] border ${
                        errors.longitude ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                      } rounded-xl text-slate-100 text-xs outline-none transition`}
                    />
                    {errors.longitude && <p className="text-xs text-rose-400">{errors.longitude}</p>}
                  </div>
                </div>
              </div>

              {/* Pickup Instructions */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Pickup Instructions (optional)
                </label>
                <textarea
                  name="pickupInstructions"
                  rows="2"
                  value={formData.pickupInstructions}
                  onChange={handleChange}
                  placeholder="e.g., Ring bell at kitchen loading dock behind the main banquet hall. Bring clean food containers."
                  className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#30363d] focus:border-emerald-500 rounded-xl text-slate-200 placeholder-slate-500 text-xs outline-none transition"
                />
              </div>
            </div>

            {/* Section 4: Allergen Information */}
            <div className="border-b border-[#30363d] pb-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" /> 4. Structured Allergen & Ingredient Information
              </h3>

              <div className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Allergen Declaration Status:
                  </label>
                  <select
                    name="declarationStatus"
                    value={formData.declarationStatus}
                    onChange={handleChange}
                    className="px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-xs text-slate-200 outline-none focus:border-emerald-500 transition"
                  >
                    <option value="UNKNOWN_UNVERIFIED">Unknown / Not Formally Lab Verified</option>
                    <option value="DECLARED_ALLERGENS">Specific Allergens Declared Below</option>
                    <option value="ALLERGEN_FREE_VERIFIED">Verified Allergen-Free (Prepared in dedicated facility)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] text-slate-400 block font-medium">
                    Click to toggle known allergens present:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {ALLERGEN_OPTIONS.map((allergen) => {
                      const isChecked = formData.allergensDeclared.includes(allergen);
                      return (
                        <button
                          key={allergen}
                          type="button"
                          onClick={() => toggleAllergen(allergen)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
                            isChecked
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 font-semibold'
                              : 'bg-[#161b22] border-[#30363d] text-slate-300 hover:bg-[#21262d]'
                          }`}
                        >
                          {allergen}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">
                    Ingredient Notes (optional):
                  </label>
                  <input
                    type="text"
                    name="ingredientNotes"
                    value={formData.ingredientNotes}
                    onChange={handleChange}
                    placeholder="e.g., Basmati rice, green peas, paneer, refined sunflower oil, whole spices."
                    className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-xl text-slate-100 text-xs outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 5: Contact Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Phone className="w-4 h-4 text-emerald-400" /> 5. Pickup Contact Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contact Person Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.contactPerson ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 text-sm outline-none transition`}
                  />
                  {errors.contactPerson && <p className="text-xs text-rose-400">{errors.contactPerson}</p>}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Contact Phone Number <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className={`w-full px-4 py-2.5 bg-[#0d1117] border ${
                      errors.contactPhone ? 'border-rose-500' : 'border-[#30363d] focus:border-emerald-500'
                    } rounded-xl text-slate-100 text-sm outline-none transition`}
                  />
                  {errors.contactPhone && <p className="text-xs text-rose-400">{errors.contactPhone}</p>}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#30363d]">
              <span className="text-xs text-slate-400 text-center sm:text-left">
                Ensure all food meets local safety standards before listing for donation.
              </span>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Listing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Publish Surplus Listing</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
