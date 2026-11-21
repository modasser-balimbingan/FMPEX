import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';

export default function ProtectedRoute({ role }) {
  const user = useSelector((state) => state.auth.user);

  if (!user) {
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />;
  }

  if (role && user.role !== role) {
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    if (user.role === 'buyer') return <Navigate to="/buyer" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}
