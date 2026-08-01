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
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const OfferPage = lazy(() => import('../pages/public/LegalPage'));
const PrivacyPage = lazy(() =>
  import('../pages/public/LegalPage').then((m) => ({ default: m.PrivacyPage })),
);
const BookingPage = lazy(() => import('../pages/client/BookingPage'));
const BookingSuccessPage = lazy(() => import('../pages/client/BookingSuccessPage'));
const MyBookingsPage = lazy(() => import('../pages/client/MyBookingsPage'));
const ProfilePage = lazy(() => import('../pages/client/ProfilePage'));
const FavoritesPage = lazy(() => import('../pages/client/FavoritesPage'));
const PaymentPage = lazy(() => import('../pages/client/PaymentPage'));

const CabinetLayout = lazy(() => import('../components/layout/CabinetLayout'));
const OwnerDashboard = lazy(() => import('../pages/owner/OwnerDashboard'));
const SalonEditPage = lazy(() => import('../pages/owner/SalonEditPage'));
const ServicesPage = lazy(() => import('../pages/owner/ServicesPage'));
const MastersPage = lazy(() => import('../pages/owner/MastersPage'));
const SchedulePage = lazy(() => import('../pages/owner/SchedulePage'));
const TimeOffPage = lazy(() => import('../pages/owner/TimeOffPage'));
const OwnerBookingsPage = lazy(() => import('../pages/owner/OwnerBookingsPage'));
const OwnerStatsPage = lazy(() => import('../pages/owner/OwnerStatsPage'));

const AdminLayout = lazy(() => import('../components/layout/AdminLayout'));
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const AdminSalonsPage = lazy(() => import('../pages/admin/AdminSalonsPage'));
const AdminSalonDetailPage = lazy(() => import('../pages/admin/AdminSalonDetailPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'));
const AdminUsersPage = lazy(() => import('../pages/admin/AdminUsersPage'));
const AdminBookingsPage = lazy(() => import('../pages/admin/AdminBookingsPage'));
const AdminSettingsPage = lazy(() => import('../pages/admin/AdminSettingsPage'));
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

          {/* Payme shartnomasi uchun majburiy */}
          <Route path="/biz-haqimizda" element={<AboutPage />} />
          <Route path="/oferta" element={<OfferPage />} />
          <Route path="/maxfiylik" element={<PrivacyPage />} />

          <Route path="/kirish" element={<LoginPage />} />
          <Route path="/royxatdan-otish" element={<RegisterPage />} />

          {/* ── Auth kerak ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/band-qilish/:masterId" element={<BookingPage />} />
            <Route path="/band-qilish/tasdiq/:code" element={<BookingSuccessPage />} />
            <Route path="/tolov/:id" element={<PaymentPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/profil/yozuvlarim" element={<MyBookingsPage />} />
            <Route path="/profil/sevimlilar" element={<FavoritesPage />} />
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
              <Route path="statistika" element={<OwnerStatsPage />} />
            </Route>
          </Route>

          {/* ── Admin ─────────────────────────── */}
          <Route element={<RoleRoute roles={['admin']} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="salonlar" element={<AdminSalonsPage />} />
              <Route path="salonlar/:id" element={<AdminSalonDetailPage />} />
              <Route path="kategoriyalar" element={<AdminCategoriesPage />} />
              <Route path="foydalanuvchilar" element={<AdminUsersPage />} />
              <Route path="yozuvlar" element={<AdminBookingsPage />} />
              <Route path="sozlamalar" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
