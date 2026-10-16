import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import donationService from '../services/donationService';
import RecommendedDonationsSection from '../components/matching/RecommendedDonationsSection';
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
  Compass,
  Eye,
  ArrowRight
} from 'lucide-react';

export default function NgoDashboard() {
  const { user } = useAuth();
  const [availableDonationsCount, setAvailableDonationsCount] = useState(0);
  const [acceptedDonations, setAcceptedDonations] = useState([]);
  const [acceptedDonationsCount, setAcceptedDonationsCount] = useState(0);

  useEffect(() => {
    donationService
      .getAvailableDonations({ limit: 1 })
      .then((res) => {
        if (res.success) setAvailableDonationsCount(res.total || 0);
      })
      .catch(() => {});

    donationService
      .getMyAcceptedDonations({ limit: 4 })
      .then((res) => {
        if (res.success) {
          setAcceptedDonations(res.donations || []);
          setAcceptedDonationsCount(res.total || 0);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#0d1117] text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Welcome Banner */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 shadow-sm animate-fade-in-up">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21262d] border border-[#30363d] text-slate-300 text-xs font-semibold mb-3">
                <Building2 className="w-3.5 h-3.5 text-blue-400" /> NGO & Organization Portal
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome, {user?.name || 'Partner'}!
              </h1>
              <p className="text-slate-300 text-sm mt-1.5 max-w-xl leading-relaxed">
                Operating as <strong className="text-white font-semibold">{user?.organization}</strong>. Ready to receive surplus food matching your serving capacity of <span className="text-white font-semibold">{user?.servingCapacity || 0} meals/day</span>.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/ngo/available-donations"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-sm flex items-center gap-2 transition hover:-translate-y-0.5"
              >
                <Search className="w-4 h-4" />
                <span>Browse Available Donations</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-100 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Daily Serving Capacity</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{user?.servingCapacity || 0}</span>
              <span className="text-xs text-slate-400 font-normal">Meals / People</span>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-150 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Available Donations Nearby</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{availableDonationsCount}</span>
              <Link to="/ngo/available-donations" className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium">
                View feed →
              </Link>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-200 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Claimed Food Pickups</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-white">{acceptedDonationsCount}</span>
              <Link to="/ngo/available-donations" className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-medium">
                Manage pickups →
              </Link>
            </div>
          </div>

          <div className="bg-[#161b22] border border-[#30363d] hover:border-slate-600 rounded-2xl p-5 space-y-2 hover:-translate-y-0.5 transition-all duration-200 animate-fade-in-up animation-delay-250 shadow-sm">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold block">Matching System Status</span>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold text-emerald-400">Active</span>
              <span className="text-xs text-slate-400 font-normal">Haversine geo ready</span>
            </div>
          </div>
        </div>

        {/* Smart NGO Matching Feed */}
        {user?._id && (
          <div className="animate-fade-in-up animation-delay-300">
            <RecommendedDonationsSection ngoId={user._id} />
          </div>
        )}

        {/* Profile & Registered Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in-up animation-delay-350">
          <div className="lg:col-span-1 bg-[#161b22] border border-[#30363d] rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="border-b border-[#30363d] pb-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-slate-300" /> NGO Organization Profile
              </h2>
              <p className="text-xs text-slate-400 mt-1">Verified partner details stored in database</p>
            </div>

            <div className="space-y-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Representative</span>
                <span className="text-slate-100 font-medium">{user?.name}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Organization</span>
                <span className="text-slate-100 font-medium">{user?.organization}</span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Operating Schedule</span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> {user?.operatingSchedule || 'Standard operating hours'}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Serving Capacity</span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400" /> {user?.servingCapacity || 0} meals / day
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Email Address</span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /> {user?.email}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Contact Number</span>
                <span className="text-slate-100 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" /> {user?.contact}
                </span>
              </div>

              <div>
                <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold block mb-0.5">Distribution Address</span>
                <span className="text-slate-100 font-medium flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span>{user?.address?.fullAddress || user?.address?.street || 'Not provided'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Claimed Food Pickups Section */}
          <div className="lg:col-span-2 bg-[#161b22] border border-[#30363d] rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#30363d] pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-blue-400" />
                  Claimed Food Pickups
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Surplus donations claimed by your NGO awaiting collection
                </p>
              </div>

              <Link
                to="/ngo/available-donations"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition"
              >
                <span>View All ({acceptedDonationsCount})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {acceptedDonations.length === 0 ? (
              <div className="py-10 flex flex-col justify-center items-center text-center space-y-4">
                <div className="w-14 h-14 rounded-2xl bg-[#21262d] border border-[#30363d] flex items-center justify-center text-slate-400">
                  <HeartHandshake className="w-7 h-7" />
                </div>
                <div className="max-w-md space-y-1">
                  <h3 className="text-base font-bold text-white">No active pickups claimed</h3>
                  <p className="text-xs text-slate-400">
                    Explore available donations or use our smart matching recommendations above to claim fresh surplus food from donors.
                  </p>
                </div>
                <Link
                  to="/ngo/available-donations"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition shadow-sm"
                >
                  Browse Available Surplus Food →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {acceptedDonations.map((item) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-xl bg-[#0d1117] border border-[#30363d] hover:border-slate-600 transition space-y-3 flex flex-col justify-between shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#21262d] text-slate-300 border border-[#30363d] text-[10px] font-semibold">
                          {item.category}
                        </span>
                        <span className="text-[10px] font-bold text-slate-200">
                          {item.servings} servings
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-white line-clamp-1">{item.foodName}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-500" />
                        <span>{item.donor?.organization || 'Food Donor'}</span>
                      </p>

                      <div className="p-2.5 rounded-lg bg-[#161b22] border border-[#30363d] space-y-1 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 text-[11px]">Donor Phone:</span>
                          <a href={`tel:${item.contactPhone}`} className="text-slate-200 font-semibold hover:underline text-[11px]">
                            {item.contactPhone}
                          </a>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">ETA:</span>
                          <span className="text-slate-200 font-medium">{item.estimatedPickupTime || 'Coordinating'}</span>
                        </div>
                      </div>
                    </div>

                    <Link
                      to={`/donations/${item._id}`}
                      className="w-full py-2 bg-[#21262d] hover:bg-[#30363d] text-slate-200 border border-[#30363d] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-400" />
                      <span>View Pickup Details</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
