import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import {
  Building2,
  Users,
  Clock,
  MapPin,
  Phone,
  Mail,
  HeartHandshake,
  Search,
  CheckCircle2,
  Compass
} from 'lucide-react';

export default function NgoDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-950/60 via-slate-900 to-slate-900 border border-blue-500/20 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5" /> NGO & Organization Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
                Welcome, {user?.name || 'Partner'}!
              </h1>
              <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Operating as <strong className="text-slate-200">{user?.organization}</strong>. Ready to receive surplus food matching your serving capacity of <span className="text-blue-300 font-semibold">{user?.servingCapacity || 0} meals/day</span>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-blue-950/50 flex items-center gap-2 transition"
                onClick={() => alert('Available Donation Feed is scheduled for the next phase!')}
              >
                <Search className="w-4 h-4" />
                <span>Browse Available Donations</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Daily Serving Capacity</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-blue-400">{user?.servingCapacity || 0}</span>
              <span className="text-xs text-blue-400 font-medium">Meals / People</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Incoming Requests</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-xs text-slate-500 font-medium">Pending response</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Completed Pickups</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">0</span>
              <span className="text-xs text-slate-500 font-medium">Distributed</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Matching System Status</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">Active</span>
              <span className="text-xs text-emerald-500/80 font-medium">Haversine geo ready</span>
            </div>
          </div>
        </div>

        {/* Profile & Registered Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" /> NGO Organization Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">Verified partner details stored in database</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Representative</span>
                <span className="text-slate-200 font-medium">{user?.name}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Organization</span>
                <span className="text-slate-200 font-medium">{user?.organization}</span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Operating Schedule</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-blue-400" /> {user?.operatingSchedule || 'Standard operating hours'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Serving Capacity</span>
                <span className="text-slate-200 font-medium flex items-center gap-1.5 mt-0.5">
                  <Users className="w-3.5 h-3.5 text-blue-400" /> {user?.servingCapacity || 0} meals / day
                </span>
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
                <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold block">Distribution Address</span>
                <span className="text-slate-200 font-medium flex items-start gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{user?.address?.fullAddress || user?.address?.street || 'Not provided'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Activity Placeholder */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-center items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <HeartHandshake className="w-8 h-8" />
            </div>
            <div className="max-w-md space-y-1">
              <h3 className="text-lg font-bold text-white">Ready for matching</h3>
              <p className="text-sm text-slate-400">
                Your NGO profile and serving capacity have been successfully registered. When nearby food donors list surplus food, our smart matching algorithm will notify you based on distance, quantity, and deadline.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
