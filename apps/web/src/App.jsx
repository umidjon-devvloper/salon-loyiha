import { Routes, Route } from 'react-router-dom';

// Vaqtinchalik — 1-haftada haqiqiy sahifalar bilan almashtiriladi
function Placeholder() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-brand-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-brand-700">Go&apos;zal Ayol</h1>
      <p className="text-sm text-gray-600">Loyiha skeleti tayyor. Ishlab chiqish davom etmoqda.</p>
      <span className="rounded-xl border border-brand-200 bg-white px-4 py-2 text-sm text-brand-600">
        v1 — booking platformasi
      </span>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<Placeholder />} />
    </Routes>
  );
}
