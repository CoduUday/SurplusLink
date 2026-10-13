import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HeartHandshake,
  Utensils,
  Building2,
  Brain,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkBackendHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/health');
      setHealthStatus(response.data);
    } catch (err) {
      setError(err.message || 'Failed to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      {/* Main Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-10">
        <div className="text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Food Surplus Redistribution Platform
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Bridging Food Surplus to Communities in Need
          </h1>
          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Connecting restaurants, mess halls, and caterers with local NGOs and food distribution networks to eliminate waste and nourish communities.
          </p>

          {/* Call to Actions */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'NGO' ? '/ngo/dashboard' : '/donor/dashboard'}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
              >
                <span>Go to {user?.role === 'NGO' ? 'NGO' : 'Donor'} Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Join as Food Donor</span>
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-lg shadow-blue-950/50 flex items-center gap-2 transition"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Join as NGO / Organization</span>
                </Link>

                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-sm transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Backend & MongoDB Verification Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-semibold text-white">System Diagnostics</h2>
                <span className="text-xs text-slate-400">Verify API & MongoDB connection status</span>
              </div>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-xl text-xs font-semibold transition border border-slate-700 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check DB Status'}
            </button>
          </div>

          {healthStatus && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> SurplusLink API & Database Operational
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><span className="text-slate-500">API Status:</span> <span className="text-slate-200">{healthStatus.status}</span></div>
                <div>
                  <span className="text-slate-500">Database:</span>{' '}
                  <span className={healthStatus.database === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {healthStatus.database}
                  </span>
                </div>
                <div><span className="text-slate-500">Environment:</span> <span className="text-slate-200">{healthStatus.environment}</span></div>
                <div><span className="text-slate-500">Checked:</span> <span className="text-slate-400">{new Date(healthStatus.timestamp).toLocaleTimeString()}</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-2xl p-4 text-xs text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Cannot reach backend API:</p>
                <p className="mt-1 text-slate-400">{error}</p>
                <p className="mt-1.5 text-slate-500">Run <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-300">npm run dev</code> from project root.</p>
              </div>
            </div>
          )}

          {!healthStatus && !error && (
            <p className="text-xs text-slate-500 text-center py-1">
              Click the button above to run real-time checks on the Express server and MongoDB.
            </p>
          )}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Food Donors</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Restaurants, messes, hostels, and caterers register with organization details, contact info, and GPS coordinates to list surplus food with pickup deadlines.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">NGOs & Charities</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Community distributors register with daily meal capacity and operating schedules to get automatically matched with suitable nearby surplus donations.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Secure Authentication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Password encryption using bcrypt hashing, signed JWT token-based sessions, and role-protected access control for Donors and NGOs.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        SurplusLink Platform • AI-Powered Food Surplus Redistribution
      </footer>
    </div>
  );
}
