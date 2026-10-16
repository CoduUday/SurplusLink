import React, { useState, useEffect, useCallback } from 'react';
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
  Compass,
  History,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import SurplusPredictionForm from '../components/prediction/SurplusPredictionForm';
import PredictionResultCard from '../components/prediction/PredictionResultCard';
import PredictionHistoryTable from '../components/prediction/PredictionHistoryTable';
import PredictionFeedbackModal from '../components/prediction/PredictionFeedbackModal';
import predictionService from '../services/predictionService';

export default function DonorDashboard() {
  const { user } = useAuth();

  // Prediction State
  const [activePrediction, setActivePrediction] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({ foodCategory: '', feedbackStatus: '' });
  const [stats, setStats] = useState({
    totalPredictions: 0,
    totalPredictedKg: 0,
    pendingFeedbackCount: 0,
    submittedFeedbackCount: 0
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal State
  const [selectedForFeedback, setSelectedForFeedback] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Fetch prediction history
  const fetchPredictionHistory = useCallback(async (page = 1, queryFilters = filters) => {
    setIsLoadingHistory(true);
    try {
      const response = await predictionService.getPredictions({
        page,
        limit: 10,
        ...queryFilters
      });
      if (response.success) {
        setPredictions(response.predictions);
        setTotalPredictions(response.total);
        setCurrentPage(response.page);
        setTotalPages(response.totalPages);
        if (response.stats) {
          setStats(response.stats);
        }
      }
    } catch (err) {
      console.error('Failed to load predictions:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchPredictionHistory(1, filters);
  }, []);

  const handlePredictionGenerated = (newPrediction) => {
    setActivePrediction(newPrediction);
    fetchPredictionHistory(1, filters);
  };

  const handleOpenFeedback = (prediction) => {
    setSelectedForFeedback(prediction);
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedback = () => {
    setIsFeedbackModalOpen(false);
    setSelectedForFeedback(null);
  };

  const handleFeedbackSubmitted = (updatedPrediction) => {
    // If the currently viewed prediction was updated, update it too
    if (activePrediction && activePrediction._id === updatedPrediction._id) {
      setActivePrediction(updatedPrediction);
    }
    fetchPredictionHistory(currentPage, filters);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchPredictionHistory(newPage, filters);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
    fetchPredictionHistory(1, newFilters);
  };

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
              <a
                href="#prediction-section"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-2 transition"
              >
                <Sparkles className="w-4 h-4" />
                <span>Estimate Meal Surplus</span>
              </a>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Surplus Forecasts Generated</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{stats.totalPredictions}</span>
              <span className="text-xs text-emerald-400 font-medium">Recorded meals</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Total Predicted Surplus</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">{stats.totalPredictedKg.toFixed(1)} kg</span>
              <span className="text-xs text-slate-500 font-medium">Forecasted</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Logged Actual Outcomes</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{stats.submittedFeedbackCount}</span>
              <span className="text-xs text-emerald-500/80 font-medium">Feedback saved</span>
            </div>
          </div>

          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 space-y-2">
            <span className="text-xs text-slate-400 font-medium">Pending Meal Outcomes</span>
            <div className="flex items-baseline justify-between">
              <span className={`text-2xl font-bold ${stats.pendingFeedbackCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {stats.pendingFeedbackCount}
              </span>
              <span className="text-xs text-amber-500/80 font-medium">Awaiting feedback</span>
            </div>
          </div>
        </div>

        {/* FEATURE 2: AI Surplus Prediction Section */}
        <div id="prediction-section" className="space-y-8">
          {/* Active / Latest Prediction Showcase */}
          {activePrediction && (
            <PredictionResultCard
              prediction={activePrediction}
              onLogFeedbackClick={handleOpenFeedback}
              onReset={() => setActivePrediction(null)}
            />
          )}

          {/* Surplus Prediction Form */}
          <SurplusPredictionForm onPredictionGenerated={handlePredictionGenerated} />

          {/* Prediction History & Feedback Table */}
          <PredictionHistoryTable
            predictions={predictions}
            total={totalPredictions}
            page={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            onFilterChange={handleFilterChange}
            currentFilters={filters}
            onViewDetails={(item) => setActivePrediction(item)}
            onLogFeedback={handleOpenFeedback}
            isLoading={isLoadingHistory}
          />
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

          {/* AI Surplus Prediction Model Summary */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" /> Explainable Prediction System
              </div>
              <h3 className="text-xl font-bold text-white">How SurplusLink Learns Your Pattern</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                SurplusLink uses a weighted historical average algorithm that matches your event parameters (food category, meal occasion, attendance scale, and prepared quantities) with verified past outcomes.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-emerald-400 font-semibold block">Cold-Start Benchmarking</span>
                  <p className="text-xs text-slate-400">
                    New donors receive transparent institutional benchmarks (12% Vegetarian, 15% Non-vegetarian) without fabricated training claims.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-1">
                  <span className="text-xs text-emerald-400 font-semibold block">Adaptive Feedback Loop</span>
                  <p className="text-xs text-slate-400">
                    Every actual surplus outcome you record refines future predictions, tightening variance and increasing forecast reliability.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
              <span>Model version: <strong>v1.0.0-heuristic-baseline</strong></span>
              <span>IBM Granite boundary: <strong>Active & Modular</strong></span>
            </div>
          </div>
        </div>
      </main>

      {/* Post-Meal Feedback Modal */}
      <PredictionFeedbackModal
        prediction={selectedForFeedback}
        isOpen={isFeedbackModalOpen}
        onClose={handleCloseFeedback}
        onFeedbackSubmitted={handleFeedbackSubmitted}
      />
    </div>
  );
}
