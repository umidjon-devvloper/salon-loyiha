import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';

import { AppLayout } from '../components/layout/AppLayout';
import { Spinner } from '../components/ui';
import { ProtectedRoute } from './ProtectedRoute';

const HomePage = lazy(() => import('../pages/public/HomePage'));
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
 *   2-hafta — katalog, 3-hafta — band qilish, 4-hafta — kabinetlar va admin.
 * `ProtectedRoute` va `RoleRoute` allaqachon tayyor.
 */
export function AppRoutes() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<AppLayout />}>
          {/* ── Ochiq ─────────────────────────── */}
          <Route path="/" element={<HomePage />} />
          <Route path="/kirish" element={<LoginPage />} />
          <Route path="/royxatdan-otish" element={<RegisterPage />} />

          {/* ── Auth kerak ────────────────────── */}
          <Route element={<ProtectedRoute />}>
            {/* 3–4 haftada: /profil, /band-qilish/:masterId */}
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default AppRoutes;
