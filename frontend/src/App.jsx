import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Assessment from './pages/Assessment';
import Login from './pages/Login';
import Navbar from './Components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Admin components
import AdminLayout from './Components/AdminLayout';
import DashboardHome from './pages/DashboardHome';
import SubmissionsPage from './pages/SubmissionsPage';
import QuestionsPage from './pages/QuestionsPage';
import UserPage from './pages/UserPage';
import ValidationComponent from './Components/validationComponent';

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  // Show loading state while checking authentication
  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Always show ValidationComponent at root */}
          <Route path="/" element={<ValidationComponent />} />

          {/* Assessment page after validation */}
          <Route path="/assessment" element={
            <>
              <Navbar />
              <Assessment />
            </>
          } />

          <Route path="/admin-login" element={<Login />} />

          {/* Protected admin routes with admin layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }>
            {/* <Route  element={<DashboardHome />} /> */}
            <Route index  element={<SubmissionsPage />} />
            <Route path="questions" element={<QuestionsPage />} />
            <Route path="users" element={<UserPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;