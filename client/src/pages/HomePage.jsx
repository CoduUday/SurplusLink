import React, { useState, useRef } from 'react';
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
  Sparkles,
  Pause,
  Play
} from 'lucide-react';
import Navbar from '../components/Navbar';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import carVideo from '../assets/Car.mp4';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();
  const [healthStatus, setHealthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef(null);

  const toggleVideoPlayback = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

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
    <div className="relative min-h-screen text-slate-100 flex flex-col overflow-x-hidden">
      {/* Background Video Layer */}
      <div className="fixed inset-0 w-full h-full -z-10 overflow-hidden pointer-events-none">
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover scale-105 transition-transform duration-1000"
          src={carVideo}
        />
        {/* Layered overlays for contrast, readability, and modern dark aesthetic */}
        <div className="absolute inset-0  backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 " />
      </div>

      <Navbar />

      {/* Main Hero & Content on top of video */}
      <main className="relative z-10 flex-1 max-w-6xl mx-auto px-6 py-12 flex flex-col gap-10 w-full">
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-4 sm:pt-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-emerald-950/50">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>AI-Powered Food Surplus Redistribution Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight drop-shadow-md">
            Bridging Food Surplus to Communities in Need
          </h1>

          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed drop-shadow">
            Connecting restaurants, mess halls, and caterers with local NGOs and food distribution networks to eliminate waste and nourish communities.
          </p>

          {/* Call to Actions on top of video */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            {isAuthenticated ? (
              <Link
                to={user?.role === 'NGO' ? '/ngo/dashboard' : '/donor/dashboard'}
                className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-xl shadow-emerald-950/70 backdrop-blur-sm flex items-center gap-2 transition transform hover:-translate-y-0.5"
              >
                <span>Go to {user?.role === 'NGO' ? 'NGO' : 'Donor'} Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm shadow-xl shadow-emerald-950/70 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  <Utensils className="w-4 h-4" />
                  <span>Join as Food Donor</span>
                </Link>

                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm shadow-xl shadow-blue-950/70 flex items-center gap-2 transition transform hover:-translate-y-0.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Join as NGO / Organization</span>
                </Link>

                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-700/80 backdrop-blur-md text-slate-200 font-semibold text-sm transition transform hover:-translate-y-0.5"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Backend & MongoDB Verification Panel (Frosted Glassmorphism) */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-6 shadow-2xl max-w-2xl mx-auto w-full">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-4">
            <div className="flex items-center gap-2.5">
              <Activity className="w-5 h-5 text-emerald-400" />
              <div>
                <h2 className="text-base font-semibold text-white">System Diagnostics</h2>
                <span className="text-xs text-slate-300">Verify API & MongoDB connection status</span>
              </div>
            </div>
            <button
              onClick={checkBackendHealth}
              disabled={loading}
              className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition border border-slate-600 flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Checking...' : 'Check DB Status'}
            </button>
          </div>

          {healthStatus && (
            <div className="bg-slate-950/80 border border-emerald-500/40 rounded-2xl p-4 space-y-2 text-sm text-slate-200 shadow-inner">
              <div className="flex items-center gap-2 text-emerald-400 font-medium">
                <CheckCircle2 className="w-4 h-4" /> SurplusLink API & Database Operational
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div><span className="text-slate-400">API Status:</span> <span className="text-slate-100 font-medium">{healthStatus.status}</span></div>
                <div>
                  <span className="text-slate-400">Database:</span>{' '}
                  <span className={healthStatus.database === 'connected' ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                    {healthStatus.database}
                  </span>
                </div>
                <div><span className="text-slate-400">Environment:</span> <span className="text-slate-100">{healthStatus.environment}</span></div>
                <div><span className="text-slate-400">Checked:</span> <span className="text-slate-300">{new Date(healthStatus.timestamp).toLocaleTimeString()}</span></div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-rose-950/50 border border-rose-800/50 rounded-2xl p-4 text-xs text-rose-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-100">Cannot reach backend API:</p>
                <p className="mt-1 text-slate-300">{error}</p>
                <p className="mt-1.5 text-slate-400">Run <code className="bg-slate-800 px-1 py-0.5 rounded text-slate-200">npm run dev</code> from project root.</p>
              </div>
            </div>
          )}

          {!healthStatus && !error && (
            <p className="text-xs text-slate-400 text-center py-1">
              Click the button above to run real-time checks on the Express server and MongoDB.
            </p>
          )}
        </div>

        {/* Feature Highlights Grid (Frosted Glass Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-700/60 hover:border-emerald-500/40 rounded-2xl p-6 space-y-3 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Utensils className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Food Donors</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Restaurants, messes, hostels, and caterers register with organization details, contact info, and GPS coordinates to list surplus food with pickup deadlines.
            </p>
          </div>

          <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-700/60 hover:border-blue-500/40 rounded-2xl p-6 space-y-3 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">NGOs & Charities</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Community distributors register with daily meal capacity and operating schedules to get automatically matched with suitable nearby surplus donations.
            </p>
          </div>

          <div className="bg-slate-900/65 backdrop-blur-xl border border-slate-700/60 hover:border-purple-500/40 rounded-2xl p-6 space-y-3 transition duration-300 shadow-xl group">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-white">Secure Authentication</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Password encryption using bcrypt hashing, signed JWT token-based sessions, and role-protected access control for Donors and NGOs.
            </p>
          </div>
        </div>
      </main>

      {/* Floating Video Pause/Play Toggle Button for Accessibility */}
      <div className="fixed bottom-5 right-5 z-20">
        <button
          onClick={toggleVideoPlayback}
          className="p-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/70 backdrop-blur-md shadow-lg transition"
          title={isPlaying ? 'Pause background video' : 'Play background video'}
          aria-label={isPlaying ? 'Pause background video' : 'Play background video'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </button>
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/80 py-6 px-6 text-center text-xs text-slate-400 bg-slate-950/70 backdrop-blur-md">
        SurplusLink Platform • AI-Powered Food Surplus Redistribution
      </footer>
    </div>
  );
}

