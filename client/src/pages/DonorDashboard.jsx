import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import MealScheduleSection from "../components/MealScheduleSection";
import donationService from "../services/donationService";
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
  AlertCircle,
  HeartHandshake
} from "lucide-react";
import SurplusPredictionForm from "../components/prediction/SurplusPredictionForm";
import PredictionResultCard from "../components/prediction/PredictionResultCard";
import PredictionHistoryTable from "../components/prediction/PredictionHistoryTable";
import PredictionFeedbackModal from "../components/prediction/PredictionFeedbackModal";
import predictionService from "../services/predictionService";
import { mealScheduleService } from "../services/mealSchedule.service";

export default function DonorDashboard() {
  const { user } = useAuth();

  // Meal Schedules state for dashboard-level surplus totals
  const [mealSchedules, setMealSchedules] = useState([]);

  // Calculate total predicted surplus portions across eligible meal schedules
  const totalPredictedSurplusMeals = mealSchedules.reduce((acc, s) => {
    // Only sum active predictions for eligible meals (Not Started or In Progress without recorded outcome)
    if (
      (s.preparationStatus === "Not Started" ||
        s.preparationStatus === "In Progress") &&
      !s.outcome
    ) {
      if (s.prediction && typeof s.prediction.predictedSurplusQuantity === "number") {
        return acc + s.prediction.predictedSurplusQuantity;
      }
      const prep = Number(s.expectedMealsPrepared) || 0;
      const eating = Number(s.expectedPeopleEating) || 0;
      return acc + Math.max(0, prep - eating);
    }
    return acc;
  }, 0);

  // Prediction State
  const [activePrediction, setActivePrediction] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [totalPredictions, setTotalPredictions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    foodCategory: "",
    feedbackStatus: "",
  });
  const [stats, setStats] = useState({
    totalPredictions: 0,
    totalPredictedKg: 0,
    pendingFeedbackCount: 0,
    submittedFeedbackCount: 0,
  });
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal State
  const [selectedForFeedback, setSelectedForFeedback] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  // Fetch prediction history
  const fetchPredictionHistory = useCallback(
    async (page = 1, queryFilters = filters) => {
      setIsLoadingHistory(true);
      try {
        const response = await predictionService.getPredictions({
          page,
          limit: 10,
          ...queryFilters,
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
        console.error("Failed to load predictions:", err);
      } finally {
        setIsLoadingHistory(false);
      }
    },
    [filters],
  );

  const fetchMealSchedules = useCallback(async () => {
    try {
      const res = await mealScheduleService.getAll();
      if (res && res.data) {
        setMealSchedules(res.data);
      }
    } catch (err) {
      console.error("Failed to load meal schedules for dashboard metrics:", err);
    }
  }, []);

  const [activeListingsCount, setActiveListingsCount] = useState(0);
  const [acceptedListingsCount, setAcceptedListingsCount] = useState(0);

  const fetchListingsCounts = useCallback(async () => {
    try {
      const [availRes, acceptRes] = await Promise.all([
        donationService.getMyDonations({ status: "AVAILABLE", limit: 1 }),
        donationService.getMyDonations({ status: "ACCEPTED", limit: 1 })
      ]);
      if (availRes.success) {
        setActiveListingsCount(availRes.total || 0);
      }
      if (acceptRes.success) {
        setAcceptedListingsCount(acceptRes.total || 0);
      }
    } catch (err) {
      // Non-blocking
    }
  }, []);

  useEffect(() => {
    fetchPredictionHistory(1, filters);
    fetchMealSchedules();
    fetchListingsCounts();
  }, [fetchMealSchedules, fetchListingsCounts]);

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
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-slate-300 text-xs font-semibold mb-3">
                <Utensils className="w-3.5 h-3.5 text-emerald-400" /> Food Donor Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, {user?.name || "Donor"}
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl leading-relaxed">
                Ready to redirect surplus food from{" "}
                <strong className="text-white font-semibold">{user?.organization}</strong>{" "}
                to nearby NGOs and prevent food waste.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/donor/create-donation"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 transition hover:-translate-y-0.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>List Surplus Food</span>
              </Link>
              <Link
                to="/donor/my-donations"
                className="px-4 py-2.5 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] text-slate-200 text-sm font-medium rounded-xl transition flex items-center gap-1.5 hover:-translate-y-0.5"
              >
                <span>My Listings ({activeListingsCount})</span>
                {acceptedListingsCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[11px] font-bold border border-blue-500/30">
                    {acceptedListingsCount} claimed
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* NGO Acceptance Alert for Donor */}
        {acceptedListingsCount > 0 && (
          <div className="p-4 sm:p-5 rounded-2xl bg-[#161b22] border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm animate-fade-in-up animation-delay-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <HeartHandshake className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Surplus Food Accepted by Partner NGOs!</span>
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold border border-blue-500/30">
                    {acceptedListingsCount} {acceptedListingsCount === 1 ? 'LISTING CLAIMED' : 'LISTINGS CLAIMED'}
                  </span>
                </h3>
              </div>
            </div>

            <Link
              to="/donor/my-donations"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-sm hover:-translate-y-0.5"
            >
              <span>View Accepted Listings →</span>
            </Link>
          </div>
        )}

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-150 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Scheduled Meal Batches
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                {mealSchedules.length}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Batches
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Total Predicted Surplus
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                {totalPredictedSurplusMeals} <span className="text-sm font-normal text-slate-400">meals</span>
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-250 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Logged Actual Outcomes
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                {mealSchedules.filter((s) => Boolean(s.outcome)).length}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Logged
              </span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-300 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">
              Pending Meal Outcomes
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">
                {mealSchedules.filter((s) => !s.outcome).length}
              </span>
              <span className="text-xs text-slate-400 font-normal">
                Pending
              </span>
            </div>
          </div>
        </div>

        {/* Feature 2: Meal Schedule & Actual Leftover Recording Section */}
        <div className="animate-fade-in-up animation-delay-350">
          <MealScheduleSection onSchedulesChange={setMealSchedules} />
        </div>

        {/* Profile & Registered Details Card */}
        <div className="flex gap-6 animate-fade-in-up animation-delay-450">
          <div className="lg:col-span-1 w-full bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-[#30363d] pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-slate-300" /> Donor Profile
              </h2>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Donor Name
                </span>
                <span className="text-slate-100 font-medium">{user?.name}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Organization
                </span>
                <span className="text-slate-100 font-medium">
                  {user?.organization}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Email Address
                </span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Contact Number
                </span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />{" "}
                  {user?.contact}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Address
                </span>
                <span className="text-slate-100 font-medium flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>
                    {user?.address?.fullAddress ||
                      user?.address?.street ||
                      "Not provided"}
                  </span>
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">
                  Geotagged Coordinates
                </span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-slate-400" />
                  {user?.location?.coordinates &&
                  user.location.coordinates[0] !== 0
                    ? `[${user.location.coordinates[1]?.toFixed(4)}° N, ${user.location.coordinates[0]?.toFixed(4)}° E]`
                    : "Coordinates will be updated on donation"}
                </span>
              </div>
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
