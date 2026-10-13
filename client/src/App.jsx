import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DonorDashboard from './pages/DonorDashboard';
import NgoDashboard from './pages/NgoDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Role-Protected Donor Dashboard */}
        <Route
          path="/donor/dashboard"
          element={
            <ProtectedRoute allowedRoles={['DONOR']}>
              <DonorDashboard />
            </ProtectedRoute>
          }
        />

        {/* Role-Protected NGO Dashboard */}
        <Route
          path="/ngo/dashboard"
          element={
            <ProtectedRoute allowedRoles={['NGO']}>
              <NgoDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  );
}

export default App;
