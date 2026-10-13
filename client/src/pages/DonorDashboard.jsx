import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Utensils,
  MapPin,
  Phone,
  Mail,
  Building,
  PlusCircle,
  Clock,
  Sparkles,
  TrendingUp,
  PackageCheck,
  Compass
} from 'lucide-react';

export default function DonorDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold mb-3">
                <Utensils className="w-3.5 h-3.5" /> Food Donor Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome back, {user?.name || 'Donor'}!
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Ready to redirect surplus food from <strong className="text-slate-200">{user?.organization}</strong> to nearby NGOs and prevent food waste.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
                onClick={() => alert('Food Listing form is scheduled for the next phase!')}
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Surplus Food</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Active Surplus Listings</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-xs text-emerald-400 font-medium">Ready for pickup</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Total Donations Completed</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-xs text-slate-500 font-medium">All time</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Estimated Meals Provided</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">0</span>
              <span className="text-xs text-emerald-500/80 font-medium">People served</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">AI Surplus Forecast</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-amber-400">Ready</span>
              <span className="text-xs text-amber-500/80 font-medium">Smart AI model</span>
            </div>
          </div>
        </div>

        {/* Profile & Registered Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-emerald-400" /> Organization Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">Verified Donor credentials stored in database</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Donor Name</span>
                <span className="text-slate-200 font-medium">{user?.name}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Organization</span>
                <span className="text-slate-200 font-medium">{user?.organization}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Email Address</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Contact Number</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {user?.contact}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Address</span>
                <span className="text-slate-200 font-medium flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{user?.address?.fullAddress || user?.address?.street || 'Not provided'}</span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Geotagged Coordinates</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  {user?.location?.coordinates && user.location.coordinates[0] !== 0
                    ? `[${user.location.coordinates[1]?.toFixed(4)}° N, ${user.location.coordinates[0]?.toFixed(4)}° E]`
                    : 'Coordinates will be updated on donation'}
                </span>
              </div>
            </div>
          </div>

          {/* Activity Placeholder */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <PackageCheck className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-white">No active donations yet</h3>
              <p className="text-sm text-slate-400">
                Authentication and donor profile setup are complete. Next, you will be able to list excess cooked or packaged food, run surplus forecasting, and dispatch donations to matched NGOs.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
