import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "motion/react"
import "../axiosInterceptor";


function SubmissionsPage() {
  const [examNames, setExamNames] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [activeTab, setActiveTab] = useState("completed"); // New state for tabs

  useEffect(() => {
    // Fetch exam names for dropdown
    const fetchExamNames = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem("adminToken");
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/admin/get-exam-names`, 
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            withCredentials: true // Ensure cookies are sent with the request
          }
        );
        setExamNames(response.data.examNames || []);
      } catch (err) {
        setError("Failed to load exam names");
      } finally {
        setLoading(false);
      }
    };
    fetchExamNames();
  }, []);

  // Fetch submissions when exam is selected
  const fetchSubmissions = async (examName, tab = activeTab, rollNo = "") => {
    if (!examName) {
      setSubmissions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("adminToken");
      
      // Use different endpoints based on the tab parameter
      const endpoint = tab === "completed" 
        ? `${import.meta.env.VITE_API_BASE_URL}/admin/get-all-completed-submissions`
        : `${import.meta.env.VITE_API_BASE_URL}/v1/admin/get-all-pending-submissions`;

      const payload = { exam_name: examName };
      if (rollNo) {
        payload.roll_no = parseInt(rollNo);
      }

      const response = await axios.post(
        endpoint,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );

      setSubmissions(response.data.submissions || []);
    } catch (error) {
      console.error("Error fetching submissions:", error);
      setError("Failed to load submissions for this exam");
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle exam selection change
  const handleExamChange = (examName) => {
    setSelectedExam(examName);
    setSearchTerm(""); // Reset search when exam changes
    fetchSubmissions(examName, activeTab, "");
  };

  // Handle tab change and refetch data
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (selectedExam) {
      fetchSubmissions(selectedExam, tab, searchTerm);
    }
  };

  // Handle search - debounced search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (selectedExam) {
      // Debounce the search
      clearTimeout(window.searchTimeout);
      window.searchTimeout = setTimeout(() => {
        fetchSubmissions(selectedExam, activeTab, value);
      }, 500);
    }
  };

  // Filter submissions based on search term (client-side filtering as backup)
  const filteredSubmissions = submissions.filter((submission) => {
    const matchesSearch =
      !searchTerm ||
      submission.candidate_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      submission.roll_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      submission.sso_id.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const handleViewResponses = async (candidate) => {
    // Only allow viewing responses for completed submissions
    if (candidate.status !== "Completed") {
      setError("Cannot view responses for pending submissions");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-submissions`,
        {
          roll_no: candidate.roll_no,
          exam_name: candidate.exam_name,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      setSelectedCandidate({
        ...candidate,
        responses: response.data.responses || [],
      });
      setShowModal(true);
    } catch (error) {
      console.error("Error fetching candidate responses:", error);
      setError("Failed to load candidate responses");
    } finally {
      setLoading(false);
    }
  };

  const ResponseModal = () => {
    if (!showModal || !selectedCandidate) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={() => setShowModal(false)}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          className="bg-white rounded-xl max-w-4xl w-full h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fixed Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white rounded-t-xl flex-shrink-0">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-blue-800 mb-2">Candidate Responses</h2>
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 text-sm text-gray-600">
                <div>
                  <span className="font-medium text-gray-800">Name:</span> {selectedCandidate.candidate_name}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Roll No:</span> {selectedCandidate.roll_no}
                </div>
                <div>
                  <span className="font-medium text-gray-800">Exam:</span> {selectedCandidate.exam_name}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="ml-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-800 transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-lg mb-3">Detailed Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">SSO ID:</span>{" "}
                  {selectedCandidate.sso_id}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{" "}
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      selectedCandidate.status === "Completed"
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {selectedCandidate.status}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="font-medium">Submitted At:</span>{" "}
                  {new Date(selectedCandidate.created_at).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-gray-800">Question Responses</h3>
              {selectedCandidate.responses &&
              selectedCandidate.responses.length > 0 ? (
                selectedCandidate.responses.map((resp, idx) => (
                  <div
                    key={resp.question_id || idx}
                    className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-semibold text-black mb-3">
                      <span className="text-red-500">Q{idx + 1}:</span>{" "}
                      {resp.question_text}
                    </div>
                    <div className="mt-2 text-gray-700">
                      <span className="font-medium text-black">Answer:</span>{" "}
                      <span className="text-blue-700">{resp.option_text}</span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="font-medium text-gray-700">Rating:</span>{" "}
                      <span className="font-bold text-blue-700 bg-blue-100 px-2 py-1 rounded">
                        {resp.rating}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Responses Found</h3>
                  <p className="text-gray-500">No responses were found for this candidate.</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto p-4 sm:p-6 lg:p-8 bg-white rounded-2xl shadow-xl border border-blue-100 max-w-7xl"
    >
      <h1 className="text-2xl sm:text-3xl font-bold text-blue-700 mb-6 sm:mb-8 text-center tracking-tight">
        Submissions Management
      </h1>

      {/* Filters - Responsive */}
      <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-4 mb-6">
        <div className="w-full sm:w-1/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select Exam
          </label>
          <select
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm sm:text-base"
            value={selectedExam}
            onChange={(e) => handleExamChange(e.target.value)}
          >
            <option value="">Select an exam...</option>
            {examNames.map((exam, idx) => (
              <option key={idx} value={exam.exam_name}>
                {exam.exam_name}
              </option>
            ))}
          </select>
        </div>
        <div className="w-full sm:w-2/3">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Search by Roll Number
          </label>
          <input
            type="text"
            className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition text-sm sm:text-base"
            placeholder="Search by roll number..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            disabled={!selectedExam}
          />
        </div>
      </div>

      {/* Tabs - Responsive */}
      {selectedExam && (
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange("completed")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === "completed"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="hidden sm:inline">Completed Submissions</span>
                <span className="sm:hidden">Completed</span>
                <span className="ml-2 bg-blue-100 text-blue-600 py-1 px-2 rounded-full text-xs">
                  {activeTab === "completed" ? submissions.length : 0}
                </span>
              </button>
              <button
                onClick={() => handleTabChange("pending")}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeTab === "pending"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <span className="hidden sm:inline">Pending Submissions</span>
                <span className="sm:hidden">Pending</span>
                <span className="ml-2 bg-yellow-100 text-yellow-600 py-1 px-2 rounded-full text-xs">
                  {activeTab === "pending" ? submissions.length : 0}
                </span>
              </button>
            </nav>
          </div>
        </div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded"
        >
          {error}
        </motion.div>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading submissions...</p>
        </div>
      )}

      {/* Show message when no exam is selected */}
      {!selectedExam && !loading && (
        <div className="text-center py-12 text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Select an Exam
          </h3>
          <p className="text-gray-500">
            Choose an exam from the dropdown to view submissions.
          </p>
        </div>
      )}

      {/* Submissions Table - Responsive */}
      {selectedExam && !loading && (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full table-auto">
            <thead className="bg-blue-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Roll No
                </th>
                <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  SSO ID
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  {activeTab === "completed" ? "Submitted At" : "Started At"}
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-blue-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSubmissions.map((submission, idx) => (
                <motion.tr
                  key={submission.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <div className="max-w-[150px] sm:max-w-none truncate">
                      {submission.candidate_name}
                    </div>
                    {/* Show SSO ID on mobile under name */}
                    <div className="sm:hidden text-xs text-gray-500 mt-1">
                      SSO: {submission.sso_id}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.roll_no}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {submission.sso_id}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        submission.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {submission.status}
                    </span>
                    {/* Show date on mobile under status */}
                    <div className="md:hidden text-xs text-gray-400 mt-1">
                      {new Date(submission.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(submission.created_at).toLocaleString()}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {activeTab === "completed" ? (
                      <button
                        onClick={() => handleViewResponses(submission)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition-colors duration-200 text-xs sm:text-sm"
                      >
                        <span className="hidden sm:inline">View Responses</span>
                        <span className="sm:hidden">View</span>
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs sm:text-sm">
                        <span className="hidden sm:inline">Assessment in progress</span>
                        <span className="sm:hidden">In progress</span>
                      </span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredSubmissions.length === 0 && selectedExam && !loading && (
            <div className="text-center py-8 text-gray-500">
              {activeTab === "completed"
                ? "No completed submissions found for this exam."
                : "No pending submissions found for this exam."}
            </div>
          )}
        </div>
      )}

      <ResponseModal />
    </motion.div>
  );
}

export default SubmissionsPage;
