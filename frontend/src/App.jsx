// App.jsx - main app component
// sets up all the routes for the weekly report generator

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import MemberDashboard from './pages/MemberDashboard'
import AdminDashboard from './pages/AdminDashboard'
import CreateReport from './pages/CreateReport'
import EditReport from './pages/EditReport'
import MyReports from './pages/MyReports'
import AdminReports from './pages/AdminReports'
import AdminProjects from './pages/AdminProjects'
import AdminEmployees from './pages/AdminEmployees'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  // figure out where to send the user from the root path
  function getDefaultRedirect() {
    var token = localStorage.getItem('token')
    if (!token) return '/login'
    
    try {
      var user = JSON.parse(localStorage.getItem('user'))
      if (user && user.role == 'admin') return '/admin/dashboard'
      return '/dashboard'
    } catch(e) {
      return '/login'
    }
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-100">
        <Routes>
          {/* public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* member routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <MemberDashboard />
            </ProtectedRoute>
          } />
          <Route path="/create-report" element={
            <ProtectedRoute>
              <CreateReport />
            </ProtectedRoute>
          } />
          <Route path="/edit-report/:id" element={
            <ProtectedRoute>
              <EditReport />
            </ProtectedRoute>
          } />
          <Route path="/my-reports" element={
            <ProtectedRoute>
              <MyReports />
            </ProtectedRoute>
          } />

          {/* admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/reports" element={
            <ProtectedRoute role="admin">
              <AdminReports />
            </ProtectedRoute>
          } />
          <Route path="/admin/projects" element={
            <ProtectedRoute role="admin">
              <AdminProjects />
            </ProtectedRoute>
          } />
          <Route path="/admin/employees" element={
            <ProtectedRoute role="admin">
              <AdminEmployees />
            </ProtectedRoute>
          } />

          {/* default redirect */}
          <Route path="/" element={<Navigate to={getDefaultRedirect()} replace />} />
          <Route path="*" element={<Navigate to={getDefaultRedirect()} replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
