import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
// Import react-icons
import { FiMenu, FiLogOut, FiUsers, FiFileText, FiFolder } from 'react-icons/fi';
import { MdQuiz } from 'react-icons/md';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { logout, adminUser } = useAuth();
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleLogout = () => {
    logout();
    navigate('/admin-login');
  };

  return (
    <div className="flex h-auto bg-gradient-to-tr from-blue-50 via-white to-blue-100 min-h-screen">
      {/* Sidebar */}
      <div
        className={`
          ${isSidebarOpen ? 'w-72' : 'w-20'}
          bg-white/80 backdrop-blur-lg shadow-2xl border-r border-blue-100
          transition-all duration-300 ease-in-out
          fixed h-full z-20 flex flex-col
          rounded-r-3xl m-3 ml-2
        `}
        style={{
          boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.18)',
        }}
      >
        <div className="flex items-center justify-between p-5 border-b border-blue-100">
          <h1 className={`font-extrabold text-2xl text-blue-700 tracking-wide transition-all duration-300 ${!isSidebarOpen && 'hidden'}`}>Admin Portal</h1>
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-blue-100 transition-colors"
            aria-label="Toggle Sidebar"
          >
            <FiMenu className="w-7 h-7 text-blue-500" />
          </button>
        </div>

        {/* Admin user info */}
        {isSidebarOpen && adminUser && (
          <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-400 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {adminUser.name ? adminUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p className="text-base font-semibold text-blue-800">{adminUser.name || 'Admin User'}</p>
              <p className="text-xs text-blue-400">{adminUser.email || ''}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 flex flex-col gap-2 mt-8">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              `group flex items-center gap-4 py-3 px-6 mx-2 rounded-xl transition-all font-medium
              ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                : 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'}
              ${!isSidebarOpen && 'justify-center px-2'}`
            }
            end
          >
            <FiFileText className="w-6 h-6" />
            <span className={`transition-all ${!isSidebarOpen && 'hidden'}`}>Submissions</span>
          </NavLink>

          <NavLink
            to="/dashboard/questions"
            className={({ isActive }) =>
              `group flex items-center gap-4 py-3 px-6 mx-2 rounded-xl transition-all font-medium
              ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                : 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'}
              ${!isSidebarOpen && 'justify-center px-2'}`
            }
          >
            <MdQuiz className="w-6 h-6" />
            <span className={`transition-all ${!isSidebarOpen && 'hidden'}`}>Questions</span>
          </NavLink>
          <NavLink
            to="/dashboard/sections"
            className={({ isActive }) =>
              `group flex items-center gap-4 py-3 px-6 mx-2 rounded-xl transition-all font-medium
              ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                : 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'}
              ${!isSidebarOpen && 'justify-center px-2'}`
            }
          >
            <FiFolder className="w-6 h-6" />
            <span className={`transition-all ${!isSidebarOpen && 'hidden'}`}>Sections</span>
          </NavLink>

          <NavLink
            to="/dashboard/users"
            className={({ isActive }) =>
              `group flex items-center gap-4 py-3 px-6 mx-2 rounded-xl transition-all font-medium
              ${isActive
                ? 'bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg'
                : 'text-blue-700 hover:bg-blue-100 hover:text-blue-900'}
              ${!isSidebarOpen && 'justify-center px-2'}`
            }
          >
            <FiUsers className="w-6 h-6" />
            <span className={`transition-all ${!isSidebarOpen && 'hidden'}`}>Users</span>
          </NavLink>

          

          <div className="flex-1" />
          <div className="mb-6 px-2">
            <button
              onClick={handleLogout}
              className={`group flex items-center gap-4 w-full py-3 px-4 rounded-xl font-medium transition-all
                text-red-500 hover:bg-red-50 hover:text-red-700
                ${!isSidebarOpen && 'justify-center px-2'}`}
            >
              <FiLogOut className="w-6 h-6" />
              <span className={`transition-all ${!isSidebarOpen && 'hidden'}`}>Logout</span>
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className={`flex-1 ${isSidebarOpen ? 'ml-72' : 'ml-20'} transition-all duration-300 ease-in-out`}>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};



export default AdminLayout;
