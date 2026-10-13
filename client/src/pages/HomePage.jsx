import React, { useState } from 'react';
import { HeartHandshake, Utensils, Building2, Brain, Activity, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function HomePage() {
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
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">Surplus<span className="text-emerald-400">Link</span></span>
              <span className="ml-2 px-2 py-0.5 text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 rounded-full font-medium">
                Scaffold v1.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Environment Initialized
            </span>
          </div>
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-10">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs font-medium">
            <Brain className="w-3.5 h-3.5" /> AI-Powered Food Surplus Redistribution Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Bridging Food Surplus to Communities in Need
          </h1>
          <p className="text-slate-400 text-base sm:text-lg">
            Monorepo development scaffold ready for feature development: role-based authentication, AI surplus forecasting, smart NGO matching, and delivery tracking.
          </p>
        </div>

        {/* Backend Connectivity Verification Panel */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-semibold text-white">Environment Health Check</h2>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition duration-150 flex items-center gap-2"
            >
              {loading ? 'Pinging API...' : 'Test Backend Connection'}
            </button>
          </div>

          {healthStatus && (
            <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4 space-y-2 text-sm text-slate-300">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> Backend API Responding
              </div>
              <p><span className="text-slate-400">Status:</span> {healthStatus.status}</p>
              <p><span className="text-slate-400">Message:</span> {healthStatus.message}</p>
              <p><span className="text-slate-400">Timestamp:</span> {healthStatus.timestamp}</p>
              <p><span className="text-slate-400">Database:</span> {healthStatus.database} (Mongoose scaffolded)</p>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-4 text-sm text-rose-300 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Backend connection test note:</p>
                <p className="text-xs text-rose-300/90 mt-1">{error}</p>
                <p className="text-xs text-slate-400 mt-2">Make sure the Express server is running with <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200">npm run dev:server</code> or <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200">npm run dev</code>.</p>
              </div>
            </div>
          )}

          {!healthStatus && !error && (
            <p className="text-xs text-slate-500 text-center py-2">
              Click the button above to verify proxy routing from React Vite client to Express server (/api/health).
            </p>
          )}
        </div>

        {/* Feature Architecture Cards (Scaffold View) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">1. Dual Role Authentication</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Scaffolded for Food Donors (Hostels, Restaurants, Institutions) and NGOs with JWT and bcrypt authentication.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">2. Surplus Listing & AI</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Models and services structured for meal schedules, surplus listings, and AI-assisted surplus prediction.
            </p>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">3. Smart Matching & Tracking</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ready for Haversine geospatial calculations, NGO capacity matching, and 5-stage delivery lifecycle tracking.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-500">
        SurplusLink Platform Scaffolding • React 18 + Vite + Express + MongoDB/Mongoose
      </footer>
    </div>
  );
}
