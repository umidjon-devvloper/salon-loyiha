import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function RoleRoute({ roles = [] }) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/kirish" state={{ from: location }} replace />;
  }
  if (roles.length && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

export default RoleRoute;
