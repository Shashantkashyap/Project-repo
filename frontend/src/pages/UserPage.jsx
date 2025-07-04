import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

// Enhanced UserModal for Create/Edit with modern UX and animation
function UserModal({ open, onClose, onSave, initialUser }) {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setPhone(initialUser ? initialUser.phone_number : '');
    setPassword('');
    setSuccess(false);
  }, [initialUser, open]);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-black-100/40 to-gray-800/80 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white/80 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-blue-100"
          initial={{ scale: 0.85, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <button
            className="absolute top-3 right-4 text-gray-500 hover:text-blue-700 text-2xl font-bold transition"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none" }}
          >
            &times;
          </button>
          <div className="flex flex-col items-center">
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="mb-4"
            >
              <svg width="48" height="48" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#3b82f6" opacity="0.15"/>
                <path d="M12 12c1.657 0 3-1.343 3-3S13.657 6 12 6s-3 1.343-3 3 1.343 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V20h14v-2.5c0-2.33-4.67-3.5-7-3.5z" fill="#3b82f6"/>
              </svg>
            </motion.div>
            <div className="text-xl font-extrabold text-blue-700 mb-2 tracking-tight drop-shadow">Add New User</div>
            <div className="text-sm text-gray-500 mb-6 text-center">Fill in the details to create a new admin user.</div>
          </div>
          {success ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <svg className="mb-2" width="48" height="48" fill="none" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" fill="#22c55e" opacity="0.15"/>
                <path d="M9.5 12.5l2 2 3-3" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className="text-green-600 font-bold text-lg mb-2">User Created!</div>
              <button
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
                onClick={onClose}
              >
                Close
              </button>
            </motion.div>
          ) : (
            <>
              <div className="mb-5">
                <label className="block text-gray-700 font-semibold mb-2">Phone Number</label>
                <input
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition bg-white/70"
                  value={phone}
                  onChange={e => {
                    // Only allow digits, max 10
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                  placeholder="Enter phone number"
                  maxLength={10}
                  autoFocus
                />
              </div>
              {!initialUser && (
                <div className="mb-7">
                  <label className="block text-gray-700 font-semibold mb-2">Password</label>
                  <input
                    type="password"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition bg-white/70"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter password"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-200 transition"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition ${(!phone || (!initialUser && !password)) ? 'opacity-60 cursor-not-allowed' : ''}`}
                  onClick={async () => {
                    const result = await onSave({ ...initialUser, phone_number: phone, password });
                    if (result === true) setSuccess(true);
                  }}
                  disabled={!phone || (!initialUser && !password)}
                >
                  {initialUser ? "Update" : "Create"}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Delete confirmation modal
function DeleteModal({ open, onClose, onConfirm, user }) {
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
          className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-sm relative"
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <button
            className="absolute top-3 right-4 text-gray-600 hover:text-gray-900 text-2xl font-bold"
            onClick={onClose}
            aria-label="Close"
            style={{ background: "none", border: "none" }}
          >
            &times;
          </button>
          <div className="text-lg font-bold text-red-700 mb-4 text-center">
            Delete User
          </div>
          <div className="mb-6 text-center text-gray-700">
            Are you sure you want to delete user <span className="font-semibold">{user?.phone_number}</span>?
          </div>
          <div className="flex justify-end gap-3">
            <button
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold shadow hover:bg-gray-300 transition"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold shadow hover:bg-red-700 transition"
              onClick={onConfirm}
            >
              Delete
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function UserPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUser, setDeleteUser] = useState(null);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-admins`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      let admins = response.data.admins;
      if (!Array.isArray(admins)) admins = [admins];
      setUsers(admins);
    } catch (err) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create or update user
  const handleSaveUser = async (user) => {
    try {
      const token = localStorage.getItem('adminToken');
      if (user.id) {
        // Update
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/update-admin/${user.id}`,
          { phone_number: user.phone_number },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        setModalOpen(false);
        setModalUser(null);
        fetchUsers();
        return true;
      } else {
        // Create (integrated with /admin/create-admin)
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/create-admin`,
          { phone: user.phone_number, password: user.password },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (res.data && res.data.error) {
          toast.error(res.data.error);
          return false;
        }
        if (res.data && res.data.message === "Admin created successfully") {
          toast.success("User created Successfully");
        }
        fetchUsers();
        return true;
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.error) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Failed to save user');
      }
      return false;
    }
  };

  // Delete user
  const handleDeleteUser = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/admin/delete-admin`,
        { adminId: deleteUser.id },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setDeleteOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center">All Users</h1>
        <button
          className="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition"
          onClick={() => { setModalUser(null); setModalOpen(true); }}
        >
          + Add User
        </button>
      </div>
      {loading && (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
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
      )}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-6"
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone Number</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={3} className="text-center py-6 text-gray-400">No users found</td>
                </tr>
              ) : (
                users.map((user, idx) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">{idx + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.phone_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        className="text-blue-600 hover:text-blue-900 mr-4 font-semibold"
                        onClick={() => { setModalUser(user); setModalOpen(true); }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900 font-semibold"
                        onClick={() => { setDeleteUser(user); setDeleteOpen(true); }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </motion.div>
      )}
      <UserModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setModalUser(null); }}
        onSave={handleSaveUser}
        initialUser={modalUser}
      />
      <DeleteModal
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeleteUser(null); }}
        onConfirm={handleDeleteUser}
        user={deleteUser}
      />
      <Toaster position="bottom-right" />
    </div>
  );
}


export default UserPage;


