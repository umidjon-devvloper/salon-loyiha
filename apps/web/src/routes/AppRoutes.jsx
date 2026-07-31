import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui';
import { ProtectedRoute } from './ProtectedRoute';
import { RoleRoute } from './RoleRoute';

const HomePage = lazy(() => import('../pages/public/HomePage'));
const SalonListPage = lazy(() => import('../pages/public/SalonListPage'));
const SalonDetailPage = lazy(() => import('../pages/public/SalonDetailPage'));
const MasterListPage = lazy(() => import('../pages/public/MasterListPage'));
const MasterDetailPage = lazy(() => import('../pages/public/MasterDetailPage'));
const SearchPage = lazy(() => import('../pages/public/SearchPage'));
const BookingPage = lazy(() => import('../pages/client/BookingPage'));
const BookingSuccessPage = lazy(() => import('../pages/client/BookingSuccessPage'));
const MyBookingsPage = lazy(() => import('../pages/client/MyBookingsPage'));

const CabinetLayout = lazy(() => import('../components/layout/CabinetLayout'));
const OwnerDashboard = lazy(() => import('../pages/owner/OwnerDashboard'));
const SalonEditPage = lazy(() => import('../pages/owner/SalonEditPage'));
const ServicesPage = lazy(() => import('../pages/owner/ServicesPage'));
const MastersPage = lazy(() => import('../pages/owner/MastersPage'));
const SchedulePage = lazy(() => import('../pages/owner/SchedulePage'));
const TimeOffPage = lazy(() => import('../pages/owner/TimeOffPage'));
const OwnerBookingsPage = lazy(() => import('../pages/owner/OwnerBookingsPage'));
const NotFoundPage = lazy(() => import('../pages/public/NotFoundPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));

function PageFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Spinner className="h-6 w-6 text-brand-500" />
    </div>
  );
}

/**
 * Route'lar bosqichma-bosqich to'ldiriladi:
 *   4-hafta — mijoz profili, salon egasi kabineti va admin panel.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* ── Katalog (ochiq) ────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/salonlar" element={<SalonListPage />} />
          <Route path="/kategoriya/:slug" element={<SalonListPage />} />
          <Route path="/salon/:slug" element={<SalonDetailPage />} />
          <Route path="/mutaxassislar" element={<MasterListPage />} />
          <Route path="/mutaxassis/:id" element={<MasterDetailPage />} />
          <Route path="/qidiruv" element={<SearchPage />} />

          <Route path="/kirish" element={<LoginPage />} />
          <Route path="/royxatdan-otish" element={<RegisterPage />} />

          {/* ── Auth kerak ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/band-qilish/:masterId" element={<BookingPage />} />
            <Route path="/band-qilish/tasdiq/:code" element={<BookingSuccessPage />} />
            <Route path="/profil/yozuvlarim" element={<MyBookingsPage />} />
            {/* 4-haftada: /profil, /profil/sevimlilar */}
          </Route>

          {/* ── Salon egasi kabineti ──────────── */}
          <Route element={<RoleRoute roles={['owner', 'admin']} />}>
            <Route path="/kabinet" element={<CabinetLayout />}>
              <Route index element={<OwnerDashboard />} />
              <Route path="salon" element={<SalonEditPage />} />
              <Route path="xizmatlar" element={<ServicesPage />} />
              <Route path="mutaxassislar" element={<MastersPage />} />
              <Route path="jadval" element={<SchedulePage />} />
              <Route path="dam-olish" element={<TimeOffPage />} />
              <Route path="yozuvlar" element={<OwnerBookingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
