// Navbar component
// shows different links depending on user role

import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';

function Navbar() {
  const navigate = useNavigate();
  var user = null;
  try {
    user = JSON.parse(localStorage.getItem('user'));
  } catch(e) {
    console.log('couldnt parse user from localstorage');
  }

  const [mobileOpen, setMobileOpen] = useState(false)

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }

  if (!user) return null;

  var isAdmin = user.role == 'admin';

  return (
    <nav className="bg-indigo-600 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <span className="text-xl font-bold">Weekly Reports</span>
          </div>

          {/* desktop links */}
          <div className="hidden md:flex items-center space-x-4">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">Dashboard</Link>
                <Link to="/admin/reports" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">All Reports</Link>
                <Link to="/admin/projects" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">Projects</Link>
                <Link to="/admin/employees" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">Employees</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">Dashboard</Link>
                <Link to="/create-report" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">New Report</Link>
                <Link to="/my-reports" className="hover:bg-indigo-700 px-3 py-2 rounded-md text-sm">My Reports</Link>
              </>
            )}
            <span className="text-indigo-200 text-sm">Hi, {user.name}</span>
            <button
              onClick={handleLogout}
              className="bg-indigo-800 hover:bg-indigo-900 px-3 py-2 rounded-md text-sm"
            >
              Logout
            </button>
          </div>

          {/* mobile hamburger */}
          <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* mobile menu */}
        {mobileOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {isAdmin ? (
              <>
                <Link to="/admin/dashboard" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link to="/admin/reports" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>All Reports</Link>
                <Link to="/admin/projects" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>Projects</Link>
                <Link to="/admin/employees" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>Employees</Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                <Link to="/create-report" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>New Report</Link>
                <Link to="/my-reports" className="block hover:bg-indigo-700 px-3 py-2 rounded" onClick={() => setMobileOpen(false)}>My Reports</Link>
              </>
            )}
            <button onClick={handleLogout} className="block w-full text-left hover:bg-indigo-700 px-3 py-2 rounded">Logout</button>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
