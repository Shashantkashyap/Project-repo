import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigationType,
  useNavigate,
} from 'react-router-dom';

import Assessment from './pages/Assessment';
import Login from './pages/Login';
import Navbar from './Components/Navbar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Admin components
import AdminLayout from './Components/AdminLayout';
import SubmissionsPage from './pages/SubmissionsPage';
import QuestionsPage from './pages/QuestionsPage';
import UserPage from './pages/UserPage';
import ValidationComponent from './Components/validationComponent';
import SectionsPage from './pages/SectionsPage';
import ErrorPage from './Components/ErrorPage';


// ✅ NavigationWatcher: Clear ONLY on back/forward (not reload)
const NavigationWatcher = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const navigate = useNavigate();

  // useEffect(() => {
  //   if (navigationType === 'POP') {
  //     console.warn('[NavigationWatcher] Back/forward detected!');
  //     // Clear only critical values
  //     localStorage.removeItem('roll_no');
  //     localStorage.removeItem('token');
  //     // Optional: clear all if needed
  //     // localStorage.clear();
  //     navigate('/error?reason=session-expired');
  //   }
  // }, [navigationType]);

  return null;
};

// ✅ Admin-only route guard
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    window.addEventListener('pageshow', (e) => {
      if (e.persisted) window.location.reload();
    });
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin-login" replace />;
  }

  return children;
};

// ✅ Protected assessment route with back button block
function ProtectedAssessment() {
  const [allowed, setAllowed] = React.useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const rollNo = localStorage.getItem('roll_no');
    if (rollNo) {
      setAllowed(true);
    } else {
      setAllowed(false);
    }

    // Block back navigation
    const blockBack = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', blockBack);

    // BFCACHE reload fix
    const handlePageShow = (e) => {
      if (e.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', handlePageShow);

    return () => {
      window.removeEventListener('popstate', blockBack);
      window.removeEventListener('pageshow', handlePageShow);
    };
  }, []);

  if (allowed === null) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!allowed) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <div>Not authorized. Please start from the home page.</div>
        <button
          onClick={() =>
            (window.location.href = 'http://10.70.231.137/ia24/Default.aspx')
          }
          className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200"
        >
          Go Home
        </button>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Assessment />
    </>
  );
}

// ✅ Main App component
function App() {
  return (
    <AuthProvider>
      <Router>
        <NavigationWatcher />
        <Routes>
          <Route path="/" element={<ValidationComponent />} />
          <Route path="/check-Post" element={<ValidationComponent />} />
          <Route path="/validation:token" element={<ValidationComponent />} />
          <Route path="/assessment" element={<ProtectedAssessment />} />
          <Route path="/admin-login" element={<Login />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<SubmissionsPage />} />
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
