import React, { useState, useEffect } from "react";
import { FiPlus, FiTrash2, FiX, FiFolder, FiEdit2 } from "react-icons/fi";
import { MdWarning } from "react-icons/md";
import { toast } from "react-hot-toast";
import axios from "axios";
import CryptoJS from "crypto-js";
import { motion, AnimatePresence } from 'motion/react';
import "../axiosInterceptor";

// --- Add Section Modal (Exact replica from QuestionsPage) ---
function AddSectionModal({ open, onClose, onAdd }) {
  const [examNames, setExamNames] = useState([]);
  const [exam, setExam] = useState('');
  const [sectionName, setSectionName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loadingExams, setLoadingExams] = useState(false);
  const [examApiError, setExamApiError] = useState('');
  const [adding, setAdding] = useState(false);

  const isAddDisabled = !sectionName.trim() || !exam;

  useEffect(() => {
    if (open) {
      setSectionName('');
      setExam('');
      setDescription('');
      setError('');
      setExamApiError('');
      setExamNames([]);
      setLoadingExams(true);

      // Fetch exam names from API
      axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/get-exam-names`
        , {
          withCredentials: true // Ensure cookies are sent with the request
        }
      )
        .then(res => {
          const rows = res.data.examNames;
          
          if (!rows || !Array.isArray(rows) || rows.length === 0) {
            setExamApiError("No exam names found");
            setExamNames([]);
          } else {
            const names = rows.map(row => row.exam_name).filter(Boolean);
            setExamNames(names);
          }
        })
        .catch(() => {
          setExamApiError("Failed to load exam names");
          setExamNames([]);
        })
        .finally(() => setLoadingExams(false));
    }
  }, [open]);

  const handleAdd = async () => {
    if (!exam || !sectionName.trim()) {
      setError('Please fill all required fields');
      return;
    }
    setAdding(true);
    setError('');
    try {
      const SECRET_KEY = import.meta.env.VITE_SECRET_KEY;
      const payload = {
        name: sectionName.trim(),
        description: description.trim() || null,
        exam_name: exam
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
          },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );

      if (res.data && res.data.message) {
        toast.success(res.data.message);
        onAdd(`${exam} - ${sectionName.trim()}${description ? ` (${description.trim()})` : ''}`);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
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

function SectionsPage() {
  const [sections, setSections] = useState([]);
  const [examNames, setExamNames] = useState([]);
  const [selectedExam, setSelectedExam] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState(null);
  const [sectionToEdit, setSectionToEdit] = useState(null);
  const [newSection, setNewSection] = useState({
    name: "",
    description: "",
    exam_name: "",
  });
  const [editSection, setEditSection] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    fetchExamNames();
  }, []);

  useEffect(() => {
    if (selectedExam) {
      fetchSections(selectedExam);
    } else {
      setSections([]);
    }
  }, [selectedExam]);

  const fetchExamNames = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-exam-names`,
        {
          withCredentials: true // Ensure cookies are sent with the request
        }
      );
      if (response.data) {
        // API returns: {"examNames":[{"exam_name":"IA-2024"},{"exam_name":"Programmer-2024"}]}
        setExamNames(response.data.examNames || []);
      }
    } catch (error) {
      console.error("Error fetching exam names:", error);
      toast.error("Failed to fetch exam names");
    }
  };

  const fetchSections = async (examName) => {
    setLoading(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-sections`,
        {
          exam_name: examName,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );
      if (response.data) {
        setSections(response.data.sections || []);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      toast.error(error.response?.data?.error || "Failed to fetch sections");
      setSections([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSection = (sectionName) => {
    // Refresh sections after adding
    if (selectedExam) {
      fetchSections(selectedExam);
    }
  };

  const handleEditSection = async () => {
    if (!editSection.name.trim()) {
      toast.error("Section name is required");
      return;
    }

    try {
      const sectionData = {
        section: {
          section_id: sectionToEdit.id,
          name: editSection.name.trim(),
          description: editSection.description.trim() || "",
        }
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/edit-section`,
        sectionData,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );

      if (response.data) {
        toast.success("Section updated successfully");
        setShowEditModal(false);
        setSectionToEdit(null);
        setEditSection({ name: "", description: "" });
        if (selectedExam) {
          fetchSections(selectedExam);
        }
      }
    } catch (error) {
      console.error("Error editing section:", error);
      toast.error(error.response?.data?.error || "Failed to edit section");
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/delete-section`,
        {
          sectionId: sectionToDelete.id,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );

      if (response.data) {
        toast.success("Section deleted successfully");
        setShowDeleteModal(false);
        setSectionToDelete(null);
        if (selectedExam) {
          fetchSections(selectedExam);
        }
      }
    } catch (error) {
      console.error("Error deleting section:", error);
      toast.error(error.response?.data?.error || "Failed to delete section");
    }
  };

  const openEditModal = (section) => {
    setSectionToEdit(section);
    setEditSection({
      name: section.name,
      description: section.description || "",
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (section) => {
    setSectionToDelete(section);
    setShowDeleteModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 rounded-xl text-white">
              <FiFolder className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Sections</h1>
              <p className="text-gray-600 mt-1">Manage exam sections</p>
            </div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FiPlus className="w-4 h-4" />
            Add Section
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">
              Select Exam:
            </label>
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select an exam</option>
              {examNames.map((exam) => (
                <option key={exam.exam_name} value={exam.exam_name}>
                  {exam.exam_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Sections Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading sections...</p>
            </div>
          ) : !selectedExam ? (
            <div className="p-8 text-center text-gray-500">
              <FiFolder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>Please select an exam to view sections</p>
            </div>
          ) : sections.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <FiFolder className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p>No sections found for {selectedExam}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Section Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Exam Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sections.map((section) => (
                    <tr key={section.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        #{section.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium text-gray-900">
                          {section.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 max-w-xs">
                        <div
                          className="text-gray-600 text-sm truncate"
                          title={section.description}
                        >
                          {section.description || "No description"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {section.exam_name || "Not specified"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(section.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex gap-2">
                          <button
                            onClick={() => openEditModal(section)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                            title="Edit section"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(section)}
                            className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                            title="Delete section"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Section Modal */}
      <AddSectionModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddSection}
      />

      {/* Edit Section Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Section</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Section Name *
                </label>
                <input
                  type="text"
                  value={editSection.name}
                  onChange={(e) =>
                    setEditSection({ ...editSection, name: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter section name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={editSection.description}
                  onChange={(e) =>
                    setEditSection({
                      ...editSection,
                      description: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="3"
                  placeholder="Enter section description (optional)"
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Exam Name
                </label>
                <p className="text-sm text-gray-600">
                  {sectionToEdit?.exam_name || "Not specified"}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Exam name cannot be changed
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSection}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <MdWarning className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Confirm Delete
              </h2>
            </div>

            <p className="text-gray-600 mb-6">
              Are you sure you want to delete the section "
              {sectionToDelete?.name}"? This action cannot be undone and will
              also delete all associated questions.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteSection}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SectionsPage;

