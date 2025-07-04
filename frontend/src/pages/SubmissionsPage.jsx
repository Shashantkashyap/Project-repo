import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';

function SubmissionsPage() {
  const [examNames, setExamNames] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [candidate, setCandidate] = useState(null);
  const [responses, setResponses] = useState([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Fetch exam names for dropdown
    const fetchExamNames = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/get-exam-names`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setExamNames(response.data.examNames || []);
      } catch (err) {
        setError('Failed to load exam names');
      } finally {
        setLoading(false);
      }
    };
    fetchExamNames();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCandidate(null);
    setResponses([]);
    setSubmitted(false);
    if (!selectedExam || !rollNo) {
      setError('Please select an exam and enter roll number.');
      return;
    }
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-submissions`,
        { roll_no: rollNo, exam_name: selectedExam },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      setCandidate(response.data.candidate?.[0] || null);
      setResponses(response.data.responses || []);
      setSubmitted(true);
    } catch (err) {
      setError('No data found for the given roll number and exam.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto  p-8 bg-white rounded-2xl shadow-xl  border border-blue-100 "
    >
      <h1 className="text-3xl font-bold text-blue-700 mb-8 text-center tracking-tight">Submission Lookup</h1>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-center justify-center mb-8 animate-fade-in">
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 ">Exam Name</label>
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            value={selectedExam}
            onChange={e => setSelectedExam(e.target.value)}
            required
          >
            <option value="">Select Exam</option>
            {examNames.map((exam, idx) => (
              <option key={idx} value={exam.exam_name}>{exam.exam_name}</option>
            ))}
          </select>
        </div>
        <div className="w-full md:w-1/3">
          <label className="block text-sm font-medium text-gray-700 ">Roll Number</label>
          <input
            type="text"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition"
            placeholder="Enter Roll No."
            value={rollNo}
            onChange={e => setRollNo(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full md:w-auto mt-5 px-8 py-2 bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold rounded-lg shadow hover:from-blue-600 hover:to-blue-800 transition-all duration-200 transform hover:scale-105"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center"><span className="animate-spin h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full"></span>Loading...</span>
          ) : (
            'Search'
          )}
        </button>
      </form>
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          {error}
        </motion.div>
      )}
      {submitted && candidate && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gray-50 rounded-xl p-6 shadow mb-8 animate-fade-in">
          <h2 className="text-xl font-bold text-blue-800 mb-2">Candidate Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><span className="font-semibold">Name:</span> {candidate.candidate_name}</div>
            <div><span className="font-semibold">Roll No:</span> {candidate.roll_no}</div>
            <div><span className="font-semibold">Exam:</span> {candidate.exam_name}</div>
            <div><span className="font-semibold">SSO ID:</span> {candidate.sso_id}</div>
            <div><span className="font-semibold">Submitted At:</span> {new Date(candidate.created_at).toLocaleString()}</div>
          </div>
        </motion.div>
      )}
      {submitted && responses.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl p-6 shadow animate-fade-in">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Responses</h2>
          <div className="space-y-4">
            {responses.map((resp, idx) => (
              <motion.div key={resp.question_id} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }} className="p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition-all">
                <div className="font-semibold text-black"><span className='text-red-500'> Q{idx + 1}:</span> {resp.question_text}</div>
                <div className="mt-1 text-gray-700"><span className="font-medium text-black">Answer:</span> {resp.option_text}</div>
                <div className="mt-1 text-sm text-gray-500">Rating: <span className="font-semibold text-blue-700">{resp.rating}</span></div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
      {submitted && !candidate && !loading && !error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 text-center text-gray-500">No data found for this roll number and exam.</motion.div>
      )}
    </motion.div>
  );
}

export default SubmissionsPage;
