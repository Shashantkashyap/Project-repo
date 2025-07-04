import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { decryptData } from '../utils/decryptionHelper';
import { updateQuestion } from '../api/questions';
import toast, { Toaster } from 'react-hot-toast';
import CryptoJS from 'crypto-js';
import { section } from 'framer-motion/client';

// EditQuestionModal component
function EditQuestionModal({ open, question, onClose, onSave }) {
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text);
      setOptions(
        question.options.map(opt =>
          typeof opt === 'object'
            ? { ...opt }
            : { option_id: 0, option_text: String(opt), rating: 0 }
        )
      );
      setError('');
    }
  }, [question]);

  const handleOptionChange = (idx, field, value) => {
    setOptions(opts =>
      opts.map((opt, i) =>
        i === idx ? { ...opt, [field]: value } : opt
      )
    );
  };

  // Add new option with option_id: 0
  const handleAddOption = () => {
    setOptions(opts => [
      ...opts,
      { option_id: 0, option_text: '', rating: 0 }
    ]);
  };

  // Remove option by index
  const handleRemoveOption = (idx) => {
    setOptions(opts => opts.filter((_, i) => i !== idx));
  };

  // Animate close
  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updatedQuestion = {
        question_id: question.question_id,
        question_text: questionText,
        options: options.map(opt => ({
          ...opt,
          rating: Number(opt.rating) || 0
        }))
      };
      // Call the API
      await updateQuestion(updatedQuestion);
      // Update UI state
      onSave({
        ...question,
        question_text: questionText,
        options: updatedQuestion.options
      });
      toast.success('Question updated successfully!');
      handleClose();
    } catch (err) {
      setError('Failed to update question');
      toast.error('Failed to update question');
    } finally {
      setSaving(false);
    }
  };

  if (!open || !question) return null;

  return (
    <AnimatePresence>
      {!closing && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative max-w-xl w-full rounded-2xl shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.95)",
              backdropFilter: "blur(8px)"
            }}
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <button
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold cursor-pointer"
              onClick={handleClose}
              aria-label="Close"
              style={{ background: "none", border: "none" }}
            >
              &times;
            </button>
            <div className="p-10">
              <div className="text-center font-bold text-blue-700 text-lg uppercase tracking-wider mb-6">
                Edit Question
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Question Text</label>
                <input
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                />
              </div>
              <div>
                <div className="text-gray-700 font-semibold mb-3 flex items-center justify-between">
                  <span>Options</span>
                  <button
                    type="button"
                    className="ml-2 px-3 py-1 rounded bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition text-lg"
                    onClick={handleAddOption}
                  >
                    +
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {options.map((opt, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-4 shadow flex flex-col gap-2 relative">
                      <input
                        className="w-full px-2 py-1 rounded border border-gray-200 focus:ring-1 focus:ring-blue-300 outline-none"
                        value={opt.option_text}
                        onChange={e => handleOptionChange(idx, 'option_text', e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                      />
                      <div className="flex  items-center gap-2">
                        <label className="text-xs text-gray-500">Rating:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className="w-16 px-2 py-1 rounded border border-gray-200 focus:ring-1 focus:ring-blue-300 outline-none"
                          value={opt.rating}
                          onChange={e => handleOptionChange(idx, 'rating', e.target.value)}
                        />
                      </div>
                      {options.length > 1 && (
                        <button
                          type="button"
                          className="absolute -top-2 right-0 text-red-400 hover:text-red-600 text-xl font-bold cursor-pointer"
                          onClick={() => handleRemoveOption(idx)}
                          title="Remove Option"
                        >
                          &times;
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {error && <div className="text-red-500 text-xs mt-4">{error}</div>}
              <div className="flex justify-end mt-10 gap-3">
                <button
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition cursor-pointer"
                  onClick={handleClose}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// --- Add Section Modal ---
function AddSectionModal({ open, onClose, onAdd }) {
  const [examNames, setExamNames] = useState([]);
  const [exam, setExam] = useState('');
  const [customExam, setCustomExam] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loadingExams, setLoadingExams] = useState(false);
  const [examApiError, setExamApiError] = useState('');
  const [adding, setAdding] = useState(false); // <-- for API loading state

  const isOther = exam === 'Other';
  // Only require sectionName and exam (not description)
  const isAddDisabled = !sectionName.trim() || !exam || (isOther && !customExam.trim());

  useEffect(() => {
    if (open) {
      setSectionName('');
      setCustomExam('');
      setExam('');
      setDescription('');
      setError('');
      setExamApiError('');
      setExamNames([]);
      setLoadingExams(true);

      // Fetch exam names from API
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/get-exam-names`)
        .then(res => {
          // API returns: { examNames: [{ exam_name: "abcd" }, ...] }
          
          const rows = res.data.examNames;
          
          if (!rows || !Array.isArray(rows) || rows.length === 0) {
            setExamApiError("No exam names found");
            setExamNames(["Other"]);
          } else {
            const names = rows.map(row => row.exam_name).filter(Boolean);
            setExamNames([...names, "Other"]);
          }
        })
        .catch(() => {
          setExamApiError("Failed to load exam names");
          setExamNames(["Other"]);
        })
        .finally(() => setLoadingExams(false));
    }
  }, [open]);

  const handleAdd = async () => {
    if (!exam || (isOther && !customExam.trim()) || !sectionName.trim()) {
      setError('Please fill all required fields');
      return;
    }
    setAdding(true);
    setError('');
    const examName = isOther ? customExam.trim() : exam;
    try {
      const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
      const payload = {
        name: sectionName.trim(),
        description: description.trim() || null,
        exam_name: examName
      };
      const encryptedData = CryptoJS.AES.encrypt(
        JSON.stringify(payload),
        SECRET_KEY
      ).toString();

      const token = localStorage.getItem('adminToken');
      const res = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/add-section`,
        { data: encryptedData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      // Success: show toast, call onAdd, refresh questions, close modal
      if (res.data && res.data.message) {
        toast.success(res.data.message);
        onAdd(`${examName} - ${sectionName.trim()}${description ? ` (${description.trim()})` : ''}`);
        // Call questions API by triggering parent refresh (like question add)
        if (typeof window !== "undefined") {
          // Optionally, you can trigger a refresh via a callback or event
        }
        onClose();
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(
        err?.response?.data?.error ||
        'Failed to add section'
      );
    } finally {
      setAdding(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative max-w-md w-full rounded-2xl shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(10px)"
          }}
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          {/* Add a form wrapper ONLY if you need it, and always prevent default submit */}
          <form onSubmit={e => e.preventDefault()}>
            <button
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold cursor-pointer"
              onClick={onClose}
              aria-label="Close"
              style={{ background: "none", border: "none" }}
              disabled={adding}
              type="button"
            >
              &times;
            </button>
            <div className="p-8">
              <div className="text-center font-bold text-blue-700 text-lg uppercase tracking-wider mb-6">
                Add New Section
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Exam Name</label>
                {loadingExams ? (
                  <div className="text-gray-500 text-sm py-2">Loading exams...</div>
                ) : (
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                    value={exam}
                    onChange={e => setExam(e.target.value)}
                    disabled={adding}
                  >
                    <option value="">Select Exam</option>
                    {examNames.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
                {examApiError && (
                  <div className="text-red-500 text-xs mt-2">{examApiError}</div>
                )}
              </div>
              {isOther && (
                <div className="mb-4">
                  <input
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                    placeholder="Enter Exam Name"
                    value={customExam}
                    onChange={e => setCustomExam(e.target.value)}
                    autoFocus
                    disabled={adding}
                  />
                </div>
              )}
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Section Name</label>
                <input
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition"
                  placeholder="Section Name"
                  value={sectionName}
                  onChange={e => setSectionName(e.target.value)}
                  disabled={adding}
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700 font-semibold mb-2">Description</label>
                <textarea
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition resize-none"
                  placeholder="Section Description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={2}
                  disabled={adding}
                />
              </div>
              {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
              <div className="flex justify-end mt-8 gap-3">
                <button
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition cursor-pointer"
                  onClick={onClose}
                  disabled={adding}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition ${isAddDisabled || adding ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={handleAdd}
                  disabled={isAddDisabled || adding}
                  type="button"
                >
                  {adding ? 'Adding...' : 'Add'}
                </button>
              </div>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// --- Add Question Modal ---
function AddQuestionModal({ open, onClose, onAdd }) {
  const [sections, setSections] = useState([]);
  const [sectionId, setSectionId] = useState('');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState([{ option_text: '', rating: 0 }]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [loadingSections, setLoadingSections] = useState(false);

  useEffect(() => {
    if (open) {
      setSectionId('');
      setQuestionText('');
      setOptions([{ option_text: '', rating: 0 }]);
      setError('');
      setModalVisible(true);
      setLoadingSections(true);
      // Fetch sections from API
      const token = localStorage.getItem('adminToken');
      axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/get-sections`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => {
          if (res.data && Array.isArray(res.data.sections)) {
            setSections(res.data.sections);
            if (res.data.sections.length > 0) {
              setSectionId(res.data.sections[0].id.toString());
            }
          } else {
            setSections([]);
          }
        })
        .catch(() => setSections([]))
        .finally(() => setLoadingSections(false));
    } else {
      setModalVisible(false);
    }
  }, [open]);

  const handleOptionChange = (idx, field, value) => {
    setOptions(opts =>
      opts.map((opt, i) =>
        i === idx ? { ...opt, [field]: value } : opt
      )
    );
  };

  const handleAddOption = () => {
    if (options.length < 5) {
      setOptions([...options, { option_text: '', rating: 0 }]);
    }
  };

  const handleRemoveOption = idx => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== idx));
    }
  };

  // API call to add question
  const addQuestionApi = async (questionData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/add-question`,
        { question: questionData },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (err) {
      throw err;
    }
  };

  // Animate close
  const handleClose = () => {
    setModalVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAdd = async () => {
    if (!sectionId) {
      setError('Please select a section');
      return;
    }
    if (!questionText.trim()) {
      setError('Question text is required');
      return;
    }
    if (options.some(opt => !opt.option_text.trim())) {
      setError('All options must have text');
      return;
    }
    setError('');
    setLoading(true);
    const questionPayload = {
      section_id: sectionId,
      question_text: questionText.trim(),
      options: options.map(opt => ({
        ...opt,
        option_text: opt.option_text.trim(),
        rating: Number(opt.rating) || 0
      }))
    };
    try {
      const apiRes = await addQuestionApi(questionPayload);
      toast.success(apiRes?.message || 'Question added successfully!');
      onAdd(questionPayload);
      handleClose();
    } catch (err) {
      toast.error(
        err?.response?.data?.message ||
        'Failed to add question'
      );
      setError('Failed to add question');
    } finally {
      setLoading(false);
    }
  };

  if (!open && !modalVisible) return null;

  return (
    <AnimatePresence>
      {modalVisible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="relative max-w-xl w-full rounded-3xl shadow-2xl border border-blue-100"
            style={{
              background: "linear-gradient(135deg, #f8fafc 80%, #e0e7ff 100%)",
              backdropFilter: "blur(12px)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.18)"
            }}
            initial={{ scale: 0.85, opacity: 0, y: 60 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 60 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
          >
            <button
              className="absolute top-3 right-4 text-gray-500 hover:text-blue-700 text-2xl font-bold cursor-pointer"
              onClick={handleClose}
              aria-label="Close"
              style={{ background: "none", border: "none" }}
              disabled={loading}
            >
              &times;
            </button>
            <div className="p-10">
              <div className="text-center font-extrabold text-blue-700 text-xl uppercase tracking-wider mb-8 drop-shadow">
                Add New Question
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Section</label>
                {loadingSections ? (
                  <div className="text-gray-500 text-sm py-2">Loading sections...</div>
                ) : (
                  <select
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition bg-white"
                    value={sectionId}
                    onChange={e => setSectionId(e.target.value)}
                    disabled={loading || sections.length === 0}
                  >
                    {sections.length === 0 ? (
                      <option value="">No sections available</option>
                    ) : (
                      sections.map(section => (
                        <option key={section.id} value={section.id}>{section.name}</option>
                      )))
                    }
                  </select>
                )}
              </div>
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">Question Text</label>
                <input
                  className="w-full px-4 py-2 rounded-lg border border-blue-200 focus:ring-2 focus:ring-blue-400 outline-none transition bg-white shadow"
                  value={questionText}
                  onChange={e => setQuestionText(e.target.value)}
                  placeholder="Enter question"
                  disabled={loading}
                  maxLength={300}
                />
              </div>
              <div>
                <div className="text-gray-700 font-semibold mb-3 flex items-center justify-between">
                  <span>Options</span>
                  <button
                    className={`ml-2 px-3 py-1 rounded bg-blue-100 text-blue-700 font-bold shadow hover:bg-blue-200 transition text-lg ${options.length >= 5 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    onClick={handleAddOption}
                    disabled={options.length >= 5 || loading}
                    title="Add Option"
                    type="button"
                  >
                    +
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {options.map((opt, idx) => (
                    <motion.div
                      key={idx}
                      className="bg-white rounded-xl p-4 shadow flex flex-col gap-2 relative border border-blue-100"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      transition={{ duration: 0.2 }}
                    >
                      <input
                        className="w-full px-2 py-1 rounded border border-gray-200 focus:ring-1 focus:ring-blue-300 outline-none bg-blue-50"
                        value={opt.option_text}
                        onChange={e => handleOptionChange(idx, 'option_text', e.target.value)}
                        placeholder={`Option ${idx + 1}`}
                        disabled={loading}
                        maxLength={120}
                      />
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Rating:</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          className="w-16 px-2 py-1 rounded border border-gray-200 focus:ring-1 focus:ring-blue-300 outline-none bg-blue-50"
                          value={opt.rating}
                          onChange={e => handleOptionChange(idx, 'rating', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      {options.length > 1 && (
                        <button
                          className="absolute top-2 right-2 text-red-400 hover:text-red-600 text-lg font-bold cursor-pointer"
                          onClick={() => handleRemoveOption(idx)}
                          title="Remove Option"
                          type="button"
                          disabled={loading}
                        >
                          &times;
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
              {error && <div className="text-red-500 text-xs mt-4">{error}</div>}
              <div className="flex justify-end mt-10 gap-3">
                <button
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition cursor-pointer"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-lg font-semibold shadow hover:from-blue-700 hover:to-blue-500 transition cursor-pointer"
                  onClick={handleAdd}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Adding...
                    </span>
                  ) : 'Add'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ConfirmDeleteModal component
function ConfirmDeleteModal({ open, onClose, onConfirm, question }) {
  if (!open) return null;
  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative max-w-sm w-full rounded-xl shadow-2xl"
          style={{
            background: "rgba(255,255,255,0.97)",
            backdropFilter: "blur(8px)"
          }}
          initial={{ scale: 0.9, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 30 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button
            className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold cursor-pointer"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none" }}
          >
            &times;
          </button>
          <div className="p-8 text-center">
            <div className="mb-4">
              <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </span>
            </div>
            <div className="font-bold text-lg text-gray-800 mb-2">Delete Question?</div>
            <div className="text-gray-600 mb-6">
              Are you sure you want to delete this question?<br />
              <span className="block mt-2 text-blue-700 font-medium">{question?.question_text}</span>
            </div>
            <div className="flex justify-center gap-4">
              <button
                className="px-5 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition cursor-pointer"
                onClick={onConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function QuestionsPage() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSection, setSelectedSection] = useState('all');
  const [sections, setSections] = useState([]);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [modalQuestion, setModalQuestion] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [addSectionOpen, setAddSectionOpen] = useState(false);
  const [addQuestionOpen, setAddQuestionOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteQuestion, setDeleteQuestion] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const QUESTIONS_PER_PAGE = 10;
  const [refreshQuestions, setRefreshQuestions] = useState(0);

  // Add this function to update the question in local state
  const handleSaveEditedQuestion = (updatedQuestion) => {
    setQuestions(questions =>
      questions.map(q =>
        q.question_id === updatedQuestion.question_id ? updatedQuestion : q
      )
    );
  };

  // Add Section handler
  const handleAddSection = (sectionName) => {
    const newId = (sections.length > 0
      ? Math.max(...sections.map(s => Number(s.id))) + 1
      : 1
    ).toString();
    setSections(secs => [...secs, { id: newId, name: sectionName }]);

    console.log(section)
    setRefreshQuestions(r => r + 1); // <-- refresh questions after section add
  };

  // Add Question handler
  const handleAddQuestion = async (newQuestion) => {
    setRefreshQuestions(r => r + 1); // trigger useEffect to reload questions
  };

  // Delete Question handler
  const handleDeleteQuestion = async () => {
    if (!deleteQuestion) return;
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/delete-question`,
        { questionId: deleteQuestion.question_id },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success('Question deleted successfully!');
      setQuestions(questions => questions.filter(q => q.question_id !== deleteQuestion.question_id));
      setDeleteModalOpen(false);
      setDeleteQuestion(null);
    } catch (err) {
      toast.error('Failed to delete question');
    }
  };

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        // Fetch questions from API
        let allQuestions = [];
        let allSections = [];
        try {
          const token = localStorage.getItem('adminToken');
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/candidate/questions`,
            {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            }
          );
          if (response.data && response.data.data) {
            const decryptedData = decryptData(response.data.data, import.meta.env.VITE_SECRET_KEY);
            if (decryptedData) {
              allSections = decryptedData.map(section => ({
                id: section.section_id,
                name: section.section_name
              }));
              decryptedData.forEach(section => {
                const questionsWithSection = section.questions.map(question => ({
                  ...question,
                  section_id: section.section_id,
                  section_name: section.section_name
                }));
                allQuestions = [...allQuestions, ...questionsWithSection];
              });
            }
          }
        } catch (apiError) {
          console.error('API request failed:', apiError);
          
          // If API fails, get questions from imported questionData
          const importedData = await import('../data.js').then(module => module.default || []);
          
          allSections = importedData.map(section => ({
            id: section.section_id,
            name: section.section_name
          }));
          
          importedData.forEach(section => {
            const questionsWithSection = section.questions.map(question => ({
              ...question,
              section_id: section.section_id,
              section_name: section.section_name
            }));
            allQuestions = [...allQuestions, ...questionsWithSection];
          });
        }
        
        setQuestions(allQuestions);
        setSections(allSections);
      } catch (err) {
        console.error('Error processing questions:', err);
        setError('Failed to load questions data');
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [refreshQuestions]);

  const filteredQuestions = selectedSection === 'all'
    ? questions
    : questions.filter(q => q.section_id.toString() === selectedSection);

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / QUESTIONS_PER_PAGE);
  const paginatedQuestions = filteredQuestions.slice(
    (currentPage - 1) * QUESTIONS_PER_PAGE,
    currentPage * QUESTIONS_PER_PAGE
  );

  // Reset to first page if filter changes and current page is out of range
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSection, questions.length]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Top Bar: Add Section & Add Question */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">
          Assessment Questions
        </h1>
       
      </div>
       <div className="flex mb-4 justify-end items-center gap-3">
          <button
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded-lg font-medium shadow-sm hover:bg-gray-100 hover:border-blue-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
            onClick={() => setAddSectionOpen(true)}
          >
            {/* Plus Icon (Heroicons) */}
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Add Section</span>
          </button>
          <button
            className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium shadow-sm hover:bg-blue-700 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 ${sections.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            onClick={() => setAddQuestionOpen(true)}
            disabled={sections.length === 0}
            title={sections.length === 0 ? "Add a section first" : ""}
          >
            {/* Plus Circle Icon (Heroicons) */}
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m4-4H8" />
            </svg>
            <span>Add Question</span>
          </button>
          <div className="flex items-center ml-4">
            <label className="mr-2 text-gray-700 text-sm">Filter by section:</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-800"
            >
              <option value="all">All Sections</option>
              {sections.map(section => (
                <option key={section.id} value={section.id.toString()}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>
        </div>

      {/* Add Section Modal */}
      <AddSectionModal
        open={addSectionOpen}
        onClose={() => setAddSectionOpen(false)}
        onAdd={handleAddSection}
      />

      {/* Add Question Modal */}
      <AddQuestionModal
        open={addQuestionOpen}
        onClose={() => setAddQuestionOpen(false)}
        onAdd={handleAddQuestion}
      />

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sr No.</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Question</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Options</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedQuestions.map((question, idx) => (
                <tr key={question.question_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(currentPage - 1) * QUESTIONS_PER_PAGE + idx + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{question.section_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{question.question_text}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {question.options.length} options
                      <button
                        className="ml-2 text-blue-600 hover:text-blue-800 text-xs cursor-pointer"
                        onClick={() => {
                          setModalQuestion(question);
                          setViewModalOpen(true);
                        }}
                      >
                        View
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      className="text-blue-600 hover:text-blue-900 mr-4 cursor-pointer"
                      onClick={() => {
                        setEditQuestion(question);
                        setEditModalOpen(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:text-red-900 cursor-pointer"
                      onClick={() => {
                        console.log("Delete question:", question);
                        setDeleteQuestion(question);
                        setDeleteModalOpen(true);
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredQuestions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No questions found for the selected section
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 py-4 bg-gray-50 border-t border-gray-200">
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                className={`px-3 py-1 rounded font-semibold ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}

        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="text-sm text-gray-500">
            Showing {paginatedQuestions.length} of {filteredQuestions.length} questions (Total: {questions.length})
          </div>
        </div>
      </motion.div>

      {/* Modal for viewing question details */}
      {viewModalOpen && modalQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-200 bg-opacity-80">
          <div
            className="relative max-w-lg w-full rounded-2xl shadow-2xl"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.37)"
            }}
          >
            <button
              className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold cursor-pointer"
              onClick={() => setViewModalOpen(false)}
              aria-label="Close"
              style={{ background: "none", border: "none" }}
            >
              &times;
            </button>
            <div className="p-12">
              <div className="mb-14">
                <div className="text-center font-bold text-blue-600 text-base md:text-lg uppercase tracking-wider mb-4 py-2 px-4 rounded-lg bg-blue-100 bg-opacity-60 shadow"
                  style={{ letterSpacing: "0.08em" }}
                >
                  {modalQuestion.section_name}
                </div>
                <div className="text-lg md:text-xl font-semibold text-gray-900 mb-6 text-center px-2">
                  {modalQuestion.question_text}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-700 font-medium mb-5 ml-1">Options:</div>
                <div className="grid grid-cols-2 gap-4">
                  {modalQuestion.options.map((opt, idx) => (
                    <div
                      key={idx}
                      className="bg-white bg-opacity-90 rounded-lg px-4 py-3 shadow text-gray-900 flex items-center font-medium"
                      style={{ minHeight: "2.5rem" }}
                    >
                      {typeof opt === 'object' && opt.option_text ? opt.option_text : String(opt)}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end mt-10">
                <button
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition cursor-pointer"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      <EditQuestionModal
        open={editModalOpen}
        question={editQuestion}
        onClose={() => setEditModalOpen(false)}
        onSave={handleSaveEditedQuestion}
      />

      {/* Toast container */}
      <Toaster position="top-right" />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteQuestion}
        question={deleteQuestion}
      />
    </div>
  );
}

export default QuestionsPage;
