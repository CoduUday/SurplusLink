import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Utensils,
  Building2,
  HeartHandshake,
  Mail,
  Lock,
  Phone,
  MapPin,
  Clock,
  Users,
  Compass,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  // Role state: 'DONOR' or 'NGO'
  const [role, setRole] = useState("DONOR");

  // Form input fields
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    organization: "",
    contact: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    // Donor specific
    latitude: "",
    longitude: "",
    locationName: "",
    // NGO specific
    operatingSchedule: "Mon - Sat, 8:00 AM - 8:00 PM",
    servingCapacity: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrorMessage("");
  };

  // Browser Geolocation auto-detect for Donor
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage("Geolocation is not supported by your browser.");
      return;
    }

    setDetectingLocation(true);
    setErrorMessage("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData((prev) => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        setDetectingLocation(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 4000);
      },
      (error) => {
        setDetectingLocation(false);
        setErrorMessage(
          error.code === 1
            ? "Location access denied. Please enter coordinates manually."
            : "Failed to acquire location. Please enter manually.",
        );
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Client-side validations
    if (!formData.name.trim())
      return setErrorMessage("Please enter your full name.");
    if (!formData.email.trim())
      return setErrorMessage("Please enter a valid email address.");
    if (!formData.organization.trim())
      return setErrorMessage("Please enter your organization name.");
    if (!formData.contact.trim())
      return setErrorMessage("Please enter a contact phone number.");
    if (formData.password.length < 6) {
      return setErrorMessage("Password must be at least 6 characters long.");
    }
    if (formData.password !== formData.confirmPassword) {
      return setErrorMessage("Passwords do not match.");
    }

    // Role-specific validations
    if (role === "NGO") {
      if (!formData.servingCapacity || Number(formData.servingCapacity) <= 0) {
        return setErrorMessage(
          "Please enter a valid daily serving capacity (number of people/meals).",
        );
      }
      if (!formData.operatingSchedule.trim()) {
        return setErrorMessage("Please enter your operating schedule.");
      }
    }

    // Build payload
    const fullAddress = [
      formData.street,
      formData.city,
      formData.state,
      formData.zipCode,
    ]
      .filter(Boolean)
      .join(", ");

    const payload = {
      role,
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      organization: formData.organization.trim(),
      contact: formData.contact.trim(),
      address: {
        street: formData.street.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        zipCode: formData.zipCode.trim(),
        fullAddress:
          fullAddress ||
          `${formData.city || ""} ${formData.state || ""}`.trim(),
      },
    };

    if (role === "DONOR") {
      const lat = parseFloat(formData.latitude) || 0;
      const lng = parseFloat(formData.longitude) || 0;
      payload.location = {
        type: "Point",
        coordinates: [lng, lat],
        locationName: formData.locationName || fullAddress,
      };
    } else {
      payload.operatingSchedule = formData.operatingSchedule.trim();
      payload.servingCapacity = Number(formData.servingCapacity);
    }

    setLoading(true);

    const result = await register(payload);
    setLoading(false);

    if (result.success) {
      if (role === "DONOR") {
        navigate("/donor/dashboard");
      } else {
        navigate("/ngo/dashboard");
      }
    } else {
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar animate={false} />

      <main className="flex-1 py-10 px-4 sm:px-6 lg:px-8 flex justify-center items-center bg-[#0d1117]">
        <div className="w-full max-w-2xl bg-[#2c313711] border border-[#3d444d] rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl animate-fade-in-up">
          {/* Header */}
          <div className="text-center space-y-2 mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create Your Account
            </h1>
            <p className="text-sm text-slate-400">
              Select your organization type to register for the food
              redistribution network.
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div className="grid grid-cols-2 gap-3 p-1.5 bg-[#151B23] rounded-2xl border border-slate-800 mb-8">
            <button
              type="button"
              onClick={() => {
                setRole("DONOR");
                setErrorMessage("");
              }}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                role === "DONOR"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#21262d]"
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Food Donor</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("NGO");
                setErrorMessage("");
              }}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${
                role === "NGO"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>NGO / Organization</span>
            </button>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-medium">Registration Error</p>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  {errorMessage}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Basic & Organization Information */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                Account & Organization Details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {role === "DONOR"
                      ? "Contact Person Name *"
                      : "Representative Name *"}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Rahul Patil"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition "
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    {role === "DONOR"
                      ? "Donor / Business Name *"
                      : "NGO / Organization Name *"}
                  </label>
                  <input
                    type="text"
                    name="organization"
                    value={formData.organization}
                    onChange={handleChange}
                    placeholder={
                      role === "DONOR"
                        ? "Shree Ganesh Family Restaurant, Pune"
                        : "Annapurna Seva Foundation, Pimpri-Chinchwad"
                    }
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@organization.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Contact Number *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      name="contact"
                      value={formData.contact}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                  </div>
                </div>
              </div>

              {/* Password Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min 6 characters"
                      required
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Address */}
            <div className="space-y-4 pt-2">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-800 pb-1">
                Physical Address
              </h2>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Street Address
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleChange}
                    placeholder="120, Laxmi Road, Sadashiv Peth, Pune"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Pune"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    ZIP / PIN Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    placeholder="411001"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Role-Specific Details */}
            {role === "DONOR" ? (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Compass className="w-4 h-4" /> Donor Location & Geotagging
                  </h2>
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    disabled={detectingLocation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 text-emerald-300 transition"
                  >
                    <Compass
                      className={`w-3.5 h-3.5 ${detectingLocation ? "animate-spin" : ""}`}
                    />
                    {detectingLocation
                      ? "Detecting GPS..."
                      : "📍 Auto-Detect Location"}
                  </button>
                </div>

                {locationSuccess && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    GPS Coordinates successfully detected and filled!
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Latitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      placeholder="e.g. 12.971598"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Longitude
                    </label>
                    <input
                      type="number"
                      step="any"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      placeholder="e.g. 77.594566"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Location Landmark / Pickup Point Note
                  </label>
                  <input
                    type="text"
                    name="locationName"
                    value={formData.locationName}
                    onChange={handleChange}
                    placeholder="e.g. Main kitchen loading bay behind gate 2"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-white text-sm transition"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-blue-400 border-b border-slate-800 pb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> NGO Operations & Capacity
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Daily Serving Capacity (Meals / People) *
                    </label>
                    <div className="relative">
                      <Users className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="number"
                        min="1"
                        name="servingCapacity"
                        value={formData.servingCapacity}
                        onChange={handleChange}
                        placeholder="e.g. 250"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Used by smart matching algorithm to match food donations
                      with adequate scale.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Operating / Distribution Schedule *
                    </label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        name="operatingSchedule"
                        value={formData.operatingSchedule}
                        onChange={handleChange}
                        placeholder="e.g. Mon - Sat, 8:00 AM - 9:00 PM"
                        required
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-[#151B23] border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Hours when your team is available to accept and collect
                      surplus food.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 px-4 rounded-xl text-white font-semibold shadow-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                role === "DONOR"
                  ? "bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700"
                  : "bg-blue-600 hover:bg-blue-500 active:bg-blue-700"
              } disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </>
              ) : (
                <span>
                  Register as {role === "DONOR" ? "Food Donor" : "NGO"}
                </span>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-8 text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-4"
            >
              Sign In here
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
