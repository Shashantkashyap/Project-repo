import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

function ValidationComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigated = useRef(false);

  useEffect(() => {
    const rollNo = localStorage.getItem("roll_no");
    if (rollNo && location.pathname !== "/assessment" && !hasNavigated.current) {
      hasNavigated.current = true;
      setLoading(false);
      // Delay navigation to avoid browser throttling/hang
      setTimeout(() => {
        navigate("/assessment");
      }, 1000);
      return;
    }

    const fetchRollNo = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/candidate/fetch-roll-no`
        );

       
        if (res.data && res.data.success && res.data.roll_no) {
          localStorage.setItem("roll_no", res.data.roll_no);
          setLoading(false);
          if (location.pathname !== "/assessment" && !hasNavigated.current) {
            hasNavigated.current = true;
            // Delay navigation to avoid browser throttling/hang
            setTimeout(() => {
              navigate("/assessment");
            }, 2000);
          }
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (err) {
        setError("Failed to validate. Please try again.");
        setLoading(false);
      }
    };

    if (!rollNo) fetchRollNo();
  }, [navigate, location]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 border-8 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-10 h-10 text-blue-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-blue-700 mb-2">Validating your session...</h2>
        <p className="text-gray-600 mb-4 text-center max-w-xs">
          Please wait while we verify your roll number and prepare your assessment.
        </p>
        {error && (
          <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-2">
            {error}
          </div>
        )}
        {loading && (
          <div className="text-blue-500 font-medium animate-pulse">Loading...</div>
        )}
      </div>
    </div>
  );
}

export default ValidationComponent;
