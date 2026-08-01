import test from 'node:test';
import assert from 'node:assert/strict';

import ownerRoutes from './owner.routes.js';
import adminRoutes from './admin.routes.js';
import bookingRoutes from './booking.routes.js';
import publicRoutes from './public.routes.js';

/**
 * ⭐ Marshrutlar himoyasining AVTOMATIK tekshiruvi.
 *
 * Regex bilan emas, express router'ning o'zidan o'qiydi: yangi endpoint
 * qo'shilganda va middleware unutilganda test yiqiladi.
 *
 * Bu topshirish shartining xavfsizlik bandi: "owner boshqa salonga tegishli
 * ma'lumotni ola olmasligi".
 */

/** Router ichidagi barcha marshrutlarni middleware nomlari bilan qaytaradi */
function routesOf(router) {
  const routes = [];

  for (const layer of router.stack) {
    if (!layer.route) continue;

    const methods = Object.keys(layer.route.methods).map((m) => m.toUpperCase());
    const handlers = layer.route.stack.map((s) => s.name);

    for (const method of methods) {
      routes.push({ method, path: layer.route.path, handlers });
    }
  }

  return routes;
}

/** Router darajasidagi (router.use(...)) middleware nomlari */
function routerLevelMiddleware(router) {
  return router.stack.filter((layer) => !layer.route).map((layer) => layer.name);
}

// ── Owner ───────────────────────────────────────────────────────

test('owner router darajasida auth va requireRole bor', () => {
  const names = routerLevelMiddleware(ownerRoutes);
  assert.ok(names.includes('auth'), 'auth yo\u2019q');
  // requireRole('owner','admin') yopilma qaytaradi
  assert.ok(names.length >= 2, 'requireRole yo\u2019q');
});

test('har bir owner marshrutida ownerOfSalon bor', () => {
  const routes = routesOf(ownerRoutes);
  assert.ok(routes.length > 10, 'marshrutlar topilmadi — test eskirgan');

  for (const route of routes) {
    // Yagona istisno: salon yaratish. O'sha paytda hali salon yo'q,
    // shuning uchun ownerOfSalon ishlay olmaydi
    if (route.method === 'POST' && route.path === '/salon') {
      assert.equal(
        route.handlers.includes('ownerOfSalon'),
        false,
        'salon yaratishda ownerOfSalon bo\u2019lmasligi kerak',
      );
      continue;
    }

    assert.ok(
      route.handlers.includes('ownerOfSalon'),
      `${route.method} ${route.path} — ownerOfSalon unutilgan`,
    );
  }
});

test('id qabul qiladigan owner marshrutlari validatsiya qilinadi', () => {
  for (const route of routesOf(ownerRoutes)) {
    if (!route.path.includes(':')) continue;

    assert.ok(
      route.handlers.some((name) => name.startsWith('validate')),
      `${route.method} ${route.path} — parametr tekshirilmayapti`,
    );
  }
});

// ── Admin ───────────────────────────────────────────────────────

test('admin router auth va requireRole bilan yopilgan', () => {
  const names = routerLevelMiddleware(adminRoutes);
  assert.ok(names.includes('auth'), 'auth yo\u2019q');
  assert.ok(names.length >= 2, 'requireRole yo\u2019q');
});

test('barcha admin marshrutlari router darajasida himoyalangan', () => {
  const routes = routesOf(adminRoutes);
  assert.ok(routes.length > 10);

  // Admin himoyasi router.use da — marshrut darajasida takrorlanmaydi,
  // shuning uchun bu yerda faqat marshrutlar borligini tekshiramiz
  for (const route of routes) {
    assert.ok(route.handlers.length > 0, `${route.method} ${route.path} bo'sh`);
  }
});

// ── Booking ─────────────────────────────────────────────────────

test('booking marshrutlari auth talab qiladi', () => {
  assert.ok(routerLevelMiddleware(bookingRoutes).includes('auth'));
});

// ── Ochiq marshrutlar ───────────────────────────────────────────

test('ochiq katalogda auth middleware yo\u2019q', () => {
  const names = routerLevelMiddleware(publicRoutes);
  assert.equal(names.includes('auth'), false, 'katalog mehmonga ochiq bo\u2019lishi kerak');

  for (const route of routesOf(publicRoutes)) {
    assert.equal(
      route.handlers.includes('auth'),
      false,
      `${route.method} ${route.path} mehmonga yopiq bo'lib qolgan`,
    );
  }
});

test('bo\u2019sh vaqtlar mehmonga ham ko\u2019rinadi', () => {
  const paths = routesOf(publicRoutes).map((r) => r.path);
  assert.ok(paths.includes('/availability'));
  assert.ok(paths.includes('/availability/days'));
});

// ── Umumiy ──────────────────────────────────────────────────────

test('barcha yozuvchi marshrutlar body validatsiyasidan o\u2019tadi', () => {
  const writers = ['POST', 'PUT', 'PATCH'];

  for (const [name, router] of [
    ['owner', ownerRoutes],
    ['admin', adminRoutes],
    ['booking', bookingRoutes],
  ]) {
    for (const route of routesOf(router)) {
      if (!writers.includes(route.method)) continue;

      // Rasm yuklash va tanasiz amallar istisno
      const isUpload = route.handlers.some((h) => h === 'multerMiddleware' || h.includes('upload'));
      const bodyless = ['/salon/submit', '/salon/cover/:filename', '/masters/:id/photo'];
      if (isUpload || bodyless.includes(route.path)) continue;

      assert.ok(
        route.handlers.some((h) => h.startsWith('validate')),
        `${name}: ${route.method} ${route.path} — validate yo'q`,
      );
    }
  }
});
