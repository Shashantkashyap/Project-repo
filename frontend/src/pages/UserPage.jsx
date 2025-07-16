import { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import toast, { Toaster } from 'react-hot-toast';
import { FiUser, FiUserPlus, FiEdit2, FiTrash2, FiX, FiCheck, FiPhone, FiLock, FiUsers } from 'react-icons/fi';
import { MdWarning } from 'react-icons/md';
import "../axiosInterceptor";


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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-blue-100"
          style={{
            background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
            backdropFilter: "blur(20px)"
          }}
          initial={{ scale: 0.85, opacity: 0, y: 60 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 60 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <button
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX className="w-6 h-6" />
          </button>
          
          <div className="flex flex-col items-center mb-8">
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              className="mb-4 p-4 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl shadow-lg"
            >
              <FiUserPlus className="w-8 h-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {initialUser ? 'Edit User' : 'Add New User'}
            </h2>
            <p className="text-gray-500 text-center">
              {initialUser ? 'Update user information' : 'Fill in the details to create a new admin user'}
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center py-8"
            >
              <div className="mb-4 p-4 bg-green-100 rounded-full">
                <FiCheck className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-green-600 font-bold text-lg mb-2">
                {initialUser ? 'User Updated!' : 'User Created!'}
              </h3>
              <p className="text-gray-600 text-center mb-6">
                The user has been {initialUser ? 'updated' : 'created'} successfully.
              </p>
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all duration-200"
                onClick={onClose}
              >
                Close
              </button>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                  <FiPhone className="w-4 h-4 text-blue-500" />
                  Phone Number
                </label>
                <input
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white"
                  value={phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setPhone(val);
                  }}
                  placeholder="Enter 10-digit phone number"
                  maxLength={10}
                  autoFocus
                />
              </div>
              
              {!initialUser && (
                <div>
                  <label className="flex items-center gap-2 text-gray-700 font-semibold mb-3">
                    <FiLock className="w-4 h-4 text-blue-500" />
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all bg-gray-50 hover:bg-white"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter secure password"
                  />
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <button
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  className={`flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transition-all duration-200 ${(!phone || (!initialUser && !password)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={async () => {
                    const result = await onSave({ ...initialUser, phone_number: phone, password });
                    if (result === true) setSuccess(true);
                  }}
                  disabled={!phone || (!initialUser && !password)}
                >
                  {initialUser ? "Update User" : "Create User"}
                </motion.button>
              </div>
            </div>
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
          initial={{ scale: 0.8, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 40 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-red-100 rounded-full">
              <MdWarning className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">Delete User</h3>
              <p className="text-gray-500">This action cannot be undone</p>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-gray-50 rounded-xl">
            <p className="text-gray-700">
              Are you sure you want to delete user 
              <span className="font-semibold text-red-600 ml-1">{user?.phone_number}</span>?
            </p>
          </div>
          
          <div className="flex gap-3">
            <button
              className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-xl"
              onClick={onConfirm}
            >
              Delete User
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
        `${import.meta.env.VITE_API_BASE_URL}/admin/get-admins`,{},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          },
          withCredentials: true // Ensure cookies are sent with the request
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
          { headers: { 'Authorization': `Bearer ${token}` },
            withCredentials: true // Ensure cookies are sent with the request
         }
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
        { headers: { 'Authorization': `Bearer ${token}` },
          withCredentials: true // Ensure cookies are sent with the request
        }
      );
      setDeleteOpen(false);
      setDeleteUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-6xl mx-auto py-8 px-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg">
              <FiUsers className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
              <p className="text-gray-600 mt-1">Manage admin users and their permissions</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
            onClick={() => { setModalUser(null); setModalOpen(true); }}
          >
            <FiUserPlus className="w-5 h-5" />
            Add New User
          </motion.button>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <FiUser className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Total Users</h3>
              <p className="text-2xl font-bold text-blue-600">{users.length}</p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-64"
          >
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p className="text-gray-600 font-medium">Loading users...</p>
            </div>
          </motion.div>
        )}

        {/* Error State */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"
          >
            <div className="flex items-center gap-3">
              <MdWarning className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-800">Error Loading Users</h3>
                <p className="text-red-600">{error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Users Table */}
        {!loading && !error && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100"
          >
            {users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-gray-100 rounded-full mb-4">
                  <FiUsers className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Users Found</h3>
                <p className="text-gray-500 mb-6">Get started by creating your first admin user</p>
                <button
                  onClick={() => { setModalUser(null); setModalOpen(true); }}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
                >
                  <FiUserPlus className="w-5 h-5" />
                  Add First User
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        User ID
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Phone Number
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user, idx) => (
                      <motion.tr 
                        key={user.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <FiUser className="w-4 h-4 text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-gray-700">#{user.id}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <FiPhone className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-900">{user.phone_number}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              onClick={() => { setModalUser(user); setModalOpen(true); }}
                              title="Edit user"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              onClick={() => { setDeleteUser(user); setDeleteOpen(true); }}
                              title="Delete user"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Modals */}
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
      
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
          },
        }}
      />
    </div>
  );
}

export default UserPage;


