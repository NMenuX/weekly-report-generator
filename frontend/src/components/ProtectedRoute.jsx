import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children, role }) {
  var token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    try {
      var user = JSON.parse(localStorage.getItem('user'));
      if (!user || user.role !== role) {
        return <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/dashboard'} replace />;
      }
    } catch (e) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;
