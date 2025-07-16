import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { decryptData, decryptDefaultAES } from "../utils/decryptionHelper";
import { encryptSectionData } from "../utils/encryptHelper";

function ValidationComponent() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const hasNavigated = useRef(false);

  useEffect(() => {

    localStorage.removeItem("roll_no");

      if (localStorage.getItem("roll_no")) localStorage.removeItem("sso_id");
      if (localStorage.getItem("name")) localStorage.removeItem("name");
      if (localStorage.getItem("exam_name")) localStorage.removeItem("exam_name");
      if (localStorage.getItem("session")) localStorage.removeItem("session");

      
    const rollNo = localStorage.getItem("roll_no");

    const redirectToAssessment = () => {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate("/assessment");
      }
    };

    // Get token from URL query param
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get("token");

    console.log("Token from URL:", token);


    if (rollNo) {
      redirectToAssessment();
    } else {
      if (!token) {
        setError("No token found in URL");
        setLoading(false);
        return;
      }
      // Use .env secret for decryption
      const secretKey = import.meta.env.VITE_SECRET_KEY;
       const data = decryptData(
          token,
          import.meta.env.VITE_SECRET_KEY
        );

        console.log(data)
      
      if (data ) {
        localStorage.setItem("roll_no", encryptSectionData(data.roll_no, secretKey));
        if (data.sso_id) localStorage.setItem("sso_id", encryptSectionData(data.sso_id, secretKey));
        if (data.name) localStorage.setItem("name", encryptSectionData(data.name, secretKey));
        if (data.exam_name) localStorage.setItem("exam_name", encryptSectionData(data.exam_name, secretKey));
        if (data.session) localStorage.setItem("session", encryptSectionData(data.session, secretKey));
        redirectToAssessment();
      } else {
        setError("Failed to decrypt or validate token");
      }
      setLoading(false);
    }
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
