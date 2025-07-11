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
import SectionsPage from './pages/SectionsPage';
import ErrorPage from './Components/ErrorPage';

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

function ProtectedAssessment() {
  const [allowed, setAllowed] = React.useState(null);

  React.useEffect(() => {
    if (localStorage.getItem("roll_no")) {
      setAllowed(true);
    } else {
      setAllowed(false);
    }
  }, []);

  if (allowed === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }
  if (!allowed) {
    // Optionally show a message or redirect UI, but do NOT navigate
    return <div className="flex items-center justify-center h-screen">Not authorized. Please start from the home page.</div>;
  }

  return (
    <>
      <Navbar />
      <Assessment />
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/check-Post' element={<ValidationComponent />} />
          {/* Always show ValidationComponent at root */}
          <Route path="/" element={<ValidationComponent />} />
          {/* Accept encrypted token as a param after /validation */}
          <Route path="/validation:token" element={<ValidationComponent />} />
          {/* Assessment page after validation only */}
          <Route path="/assessment" element={<ProtectedAssessment />} />

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
            <Route path="sections" element={<SectionsPage />} />
            <Route path="users" element={<UserPage />} />
          </Route>

          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<ErrorPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;