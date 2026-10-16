import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import CreateDonationPage from './pages/CreateDonationPage';
import MyDonationsPage from './pages/MyDonationsPage';
import AvailableDonationsPage from './pages/AvailableDonationsPage';
import DonationDetailsPage from './pages/DonationDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Role-Protected Donor Dashboard & Feature 3 Pages */}
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DONOR']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/create-donation"
          element={
            <ProtectedRoute allowedRoles={['DONOR']}>
              <CreateDonationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/donor/my-donations"
          element={
            <ProtectedRoute allowedRoles={['DONOR']}>
              <MyDonationsPage />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected NGO Dashboard & Feature 3 Feed */}
        <Route
          path="/ngo/dashboard"
          element={
            <ProtectedRoute allowedRoles={['NGO']}>
              <NgoDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ngo/available-donations"
          element={
            <ProtectedRoute allowedRoles={['NGO']}>
              <AvailableDonationsPage />
            </ProtectedRoute>
          }
        />

        {/* Shared Authenticated Donation Details View */}
        <Route
          path="/donations/:id"
          element={
            <ProtectedRoute allowedRoles={['DONOR', 'NGO']}>
              <DonationDetailsPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
