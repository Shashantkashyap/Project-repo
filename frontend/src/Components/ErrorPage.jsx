import React from "react";
import { useNavigate, useLocation } from "react-router-dom";

const ErrorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Get reason from query param
  const searchParams = new URLSearchParams(location.search);
  const reason = searchParams.get("reason");

  // Map known reasons to user-friendly messages
  const reasonMessages = {
    "session-invalid":
      "Your session is invalid or has expired. Please try logging in again.",
    unauthorized: "You are not authorized to access this page.",
    "not-found": "The page you're looking for doesn't exist.",
    // Add more mappings as needed
  };

  const message = reason
    ? reasonMessages[reason] || reason
    : "Oops! The page you're looking for doesn't exist.";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 animate-fadeIn">
      <svg
        className="w-32 h-32 text-indigo-400 animate-bounce mb-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z"
        />
      </svg>
      <h1 className="text-5xl font-extrabold text-indigo-700 mb-2 animate-fadeInUp">
        404
      </h1>
      <p className="text-xl text-gray-600 mb-6 animate-fadeInUp delay-100">
        {message}
      </p>
      <button
        onClick={() =>
          (window.location.href = "http://10.70.231.137/ia24/Default.aspx")
        }
        className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition-all duration-200 animate-fadeInUp delay-200"
      >
        Go Home
      </button>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.8s ease; }
        .animate-fadeInUp { animation: fadeInUp 0.8s cubic-bezier(.39,.575,.565,1) both; }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
      `}</style>
    </div>
  );
};

export default ErrorPage;
