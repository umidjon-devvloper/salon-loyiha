import test from 'node:test';
import assert from 'node:assert/strict';

import { buildMonthGrid, formatMonthUz, WEEK_LABELS_UZ } from './calendar.js';

test('grid uzunligi har doim 7 ga karrali', () => {
  for (const month of ['2026-01', '2026-02', '2026-08', '2027-02']) {
    assert.equal(buildMonthGrid(month).length % 7, 0, `${month} buzildi`);
  }
});

test('oyning hamma kuni gridda bor', () => {
  const cells = buildMonthGrid('2026-08').filter(Boolean);
  assert.equal(cells.length, 31);
  assert.equal(cells[0], '2026-08-01');
  assert.equal(cells[30], '2026-08-31');
});

test('hafta dushanbadan boshlanadi', () => {
  // 2026-08-01 — shanba, ya'ni oldida 5 ta bo'sh katak bo'lishi kerak
  const cells = buildMonthGrid('2026-08');
  assert.deepEqual(cells.slice(0, 5), [null, null, null, null, null]);
  assert.equal(cells[5], '2026-08-01');
  assert.equal(WEEK_LABELS_UZ[5], 'Sh');
});

test("dushanbadan boshlanadigan oyda bo'sh katak yo'q", () => {
  // 2026-06-01 — dushanba
  assert.equal(buildMonthGrid('2026-06')[0], '2026-06-01');
});

test('kabisa yili fevrali 29 kun', () => {
  assert.equal(buildMonthGrid('2028-02').filter(Boolean).length, 29);
  assert.equal(buildMonthGrid('2026-02').filter(Boolean).length, 28);
});

test("oy nomi o'zbekcha chiqadi", () => {
  assert.equal(formatMonthUz('2026-08'), 'Avgust 2026');
  assert.equal(formatMonthUz('2026-01'), 'Yanvar 2026');
});
