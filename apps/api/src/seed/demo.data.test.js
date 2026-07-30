import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import { buildDemoBookings, uniqueSlug, DEMO_SALONS } from './demo.data.js';
import { weekdayOf } from '@gozal/shared/utils/time';

const workingHours = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  isOpen: weekday !== 0,
  startMin: 540, // 09:00
  endMin: 1140, // 19:00
  breaks: weekday === 0 ? [] : [{ startMin: 780, endMin: 840 }], // 13:00–14:00
}));

const masters = [
  { id: 'm1', salonId: 's1', workingHours },
  { id: 'm2', salonId: 's1', workingHours },
  { id: 'm3', salonId: 's2', workingHours },
];

const servicesBySalon = new Map([
  [
    's1',
    [
      { id: 'sv1', name: 'Manikyur', price: 100000, durationMin: 60, bufferMin: 0 },
      { id: 'sv2', name: 'Gel qoplama', price: 150000, durationMin: 90, bufferMin: 10 },
    ],
  ],
  ['s2', [{ id: 'sv3', name: 'Massaj', price: 200000, durationMin: 60, bufferMin: 0 }]],
]);

const build = (count = 20) =>
  buildDemoBookings({ today: '2026-08-05', masters, servicesBySalon, count });

describe('buildDemoBookings', () => {
  test("so'ralgan sondan oshmaydi va bo'sh qolmaydi", () => {
    const b = build(20);
    assert.ok(b.length > 0, 'kamida bitta yozuv yasalishi kerak');
    assert.ok(b.length <= 20);
  });

  test('⭐ bir usta uchun vaqtlar KESISHMAYDI', () => {
    const byMasterDay = new Map();
    for (const b of build(20)) {
      const key = `${b.masterId}|${b.date}`;
      const list = byMasterDay.get(key) || [];
      for (const other of list) {
        const overlap = b.startMin < other.end && other.start < b.endMin;
        assert.equal(
          overlap,
          false,
          `kesishish: ${key} ${b.startMin}-${b.endMin} vs ${other.start}-${other.end}`,
        );
      }
      list.push({ start: b.startMin, end: b.endMin });
      byMasterDay.set(key, list);
    }
  });

  test('⭐ (master, date, startMin) uchligi takrorlanmaydi — unique index buzilmaydi', () => {
    const keys = build(20).map((b) => `${b.masterId}|${b.date}|${b.startMin}`);
    assert.equal(new Set(keys).size, keys.length);
  });

  test('yozuv ish vaqti ICHIDA tugaydi', () => {
    for (const b of build(20)) {
      const day = workingHours.find((d) => d.weekday === weekdayOf(b.date));
      assert.ok(day.isOpen, `${b.date} yopiq kunga tushib qolgan`);
      assert.ok(b.startMin >= day.startMin, `${b.startMin} ish vaqtidan oldin`);
      assert.ok(b.endMin <= day.endMin, `${b.endMin} ish vaqtidan keyin tugayapti`);
    }
  });

  test('tanaffusga tushmaydi (13:00–14:00)', () => {
    for (const b of build(20)) {
      const overlapsBreak = b.startMin < 840 && 780 < b.endMin;
      assert.equal(overlapsBreak, false, `${b.date} ${b.startMin}-${b.endMin} tanaffusga tushdi`);
    }
  });

  test('yopiq kunga (yakshanba) yozuv tushmaydi', () => {
    for (const b of build(20)) {
      assert.notEqual(weekdayOf(b.date), 0);
    }
  });

  test('startMin 15 daqiqaga tekislangan', () => {
    for (const b of build(20)) assert.equal(b.startMin % 15, 0);
  });

  test('davomiylik buffer bilan hisoblangan', () => {
    for (const b of build(20)) {
      const item = b.items[0];
      assert.ok(b.endMin - b.startMin >= item.durationMin);
      assert.equal(b.totalDuration, b.endMin - b.startMin);
    }
  });

  test("o'tgan sanaga yozuv yasamaydi", () => {
    for (const b of build(20)) assert.ok(b.date > '2026-08-05');
  });

  test('statuslar aralash, manual yozuvlar ham bor', () => {
    const b = build(20);
    assert.ok(new Set(b.map((x) => x.status)).size > 1);
    assert.ok(b.some((x) => x.source === 'manual'));
  });

  test("hamma kun yopiq bo'lsa — bo'sh massiv, xato emas", () => {
    const closed = [
      { id: 'm9', salonId: 's1', workingHours: workingHours.map((d) => ({ ...d, isOpen: false })) },
    ];
    const b = buildDemoBookings({
      today: '2026-08-05',
      masters: closed,
      servicesBySalon,
      count: 5,
    });
    assert.deepEqual(b, []);
  });
});

describe('uniqueSlug', () => {
  test("takrorlanganda raqam qo'shiladi", () => {
    const existing = new Set();
    assert.equal(uniqueSlug('Lotus Beauty', existing), 'lotus-beauty');
    assert.equal(uniqueSlug('Lotus Beauty', existing), 'lotus-beauty-2');
    assert.equal(uniqueSlug('Lotus Beauty', existing), 'lotus-beauty-3');
  });

  test('apostrofli nom', () => {
    assert.equal(uniqueSlug("Go'zal Ayol", new Set()), 'gozal-ayol');
  });
});

describe("DEMO_SALONS ma'lumoti", () => {
  test('5 salon, 12 usta, 40 xizmat', () => {
    assert.equal(DEMO_SALONS.length, 5);
    assert.equal(
      DEMO_SALONS.reduce((s, x) => s + x.masters.length, 0),
      12,
    );
    assert.equal(
      DEMO_SALONS.reduce((s, x) => s + x.services.length, 0),
      40,
    );
  });

  test('har bir xizmatda davomiylik bor va 10 daqiqadan katta', () => {
    for (const salon of DEMO_SALONS) {
      for (const s of salon.services) {
        assert.ok(s.durationMin >= 10, `${salon.name} / ${s.name}`);
        assert.ok(s.price > 0);
        if (s.priceTo) assert.ok(s.priceTo > s.price, `${s.name}: priceTo > price bo'lishi kerak`);
      }
    }
  });

  test('telefon raqamlari takrorlanmaydi', () => {
    const phones = DEMO_SALONS.map((s) => s.phone);
    assert.equal(new Set(phones).size, phones.length);
  });
});
