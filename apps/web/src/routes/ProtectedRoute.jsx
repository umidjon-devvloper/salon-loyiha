import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Kirmagan foydalanuvchini /kirish ga yuboradi va qaysi sahifaga
 * kirmoqchi bo'lganini eslab qoladi — kirgandan keyin o'sha yerga qaytadi.
 */
export function ProtectedRoute() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/kirish" state={{ from: location }} replace />;
  }
  return <Outlet />;
}

export default ProtectedRoute;
