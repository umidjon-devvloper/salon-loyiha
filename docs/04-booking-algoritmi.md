# 04 — Booking algoritmi ⭐

Bu loyihaning yuragi. Butun qiymat shu faylda: **salon egasi ish vaqtini kiritadi → tizim bo'sh vaqtlarni o'zi hisoblaydi → mijoz band qiladi → o'sha vaqt yo'qoladi.**

---

## Asosiy tamoyil

**Slotlar bazada saqlanmaydi.** Ular har so'rovda hisoblanadi:

```
BO'SH SLOTLAR  =  ISH VAQTI
                − tanaffuslar (tushlik)
                − bloklangan kunlar (ta'til, bayram)
                − band qilingan yozuvlar
                − o'tib ketgan vaqt (bugun bo'lsa)
```

Nima uchun saqlanmaydi: 60 kun × 12 usta × 40 slot = 28 800 yozuv, va ish vaqti o'zgarsa hammasini qayta yozish kerak bo'ladi. Hisoblash esa 5–10 ms.

---

## Vaqt bilan ishlash qoidasi

| Nima | Qanday saqlanadi | Misol |
|---|---|---|
| Sana | `String` — `'YYYY-MM-DD'` | `'2026-08-05'` |
| Vaqt | `Number` — yarim kechadan boshlab daqiqa | `570` = `09:30` |

**Sabab:** `Date` obyekti timezone bilan doim muammo beradi (server UTC, mijoz UTC+5). String sana + integer daqiqa esa hech qachon "kun surilib qolish" xatosini bermaydi.

```js
// utils/time.js
export const toMin = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

export const toHHMM = (min) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

// Toshkent vaqtida bugungi sana
export const todayStr = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tashkent' }).format(new Date());

// Toshkent vaqtida hozirgi daqiqa
export const nowMin = () => {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Tashkent', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date());
  return toMin(s);
};

// 'YYYY-MM-DD' → hafta kuni (0 = Yakshanba)
export const weekdayOf = (dateStr) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

export const addDays = (dateStr, n) => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return dt.toISOString().slice(0, 10);
};
```

---

## Interval arifmetikasi

Ish vaqti — bu intervallar massivi: `[{ start, end }, ...]`. Tanaffus va band vaqtlarni **ayirib** boramiz.

```js
// services/schedule.service.js

/** Bir intervaldan boshqasini ayirish → 0, 1 yoki 2 ta interval qoladi */
function subtract(interval, cut) {
  const out = [];
  if (cut.end <= interval.start || cut.start >= interval.end) return [interval]; // kesishmaydi
  if (cut.start > interval.start) out.push({ start: interval.start, end: cut.start });
  if (cut.end < interval.end)     out.push({ start: cut.end,        end: interval.end });
  return out;
}

/** Intervallar massividan bir nechta kesikni ayirish */
export function subtractMany(intervals, cuts) {
  let result = intervals;
  for (const cut of cuts) {
    result = result.flatMap((iv) => subtract(iv, cut));
  }
  return result.filter((iv) => iv.end > iv.start);
}
```

Misol:

```
Ish vaqti:   09:00 ─────────────────────────────── 19:00
Tanaffus:              13:00 ── 14:00
Band:            10:30 ─ 12:00        15:00 ─ 16:30

Natija:      [09:00–10:30]  [12:00–13:00]  [14:00–15:00]  [16:30–19:00]
```

---

## Kunlik ish vaqtini olish

```js
/**
 * Ustaning aynan shu kundagi ochiq intervallarini qaytaradi.
 * Ustaning o'z jadvali bo'lmasa — salonning jadvali ishlatiladi.
 */
export function getWorkingIntervals({ salon, master, dateStr }) {
  const weekday = weekdayOf(dateStr);

  const source = (master.workingHours?.length ? master.workingHours : salon.workingHours) || [];
  const day = source.find((d) => d.weekday === weekday);

  if (!day || !day.isOpen) {
    return { intervals: [], reason: 'closed' };  // dam olish kuni
  }

  let intervals = [{ start: day.startMin, end: day.endMin }];

  // tanaffuslarni ayiramiz
  const breaks = (day.breaks || []).map((b) => ({ start: b.startMin, end: b.endMin }));
  intervals = subtractMany(intervals, breaks);

  return { intervals, reason: null };
}
```

---

## Bloklangan kunlarni (timeOff) qo'llash

```js
export function applyTimeOffs(intervals, timeOffs, dateStr) {
  const cuts = [];

  for (const t of timeOffs) {
    if (dateStr < t.dateFrom || dateStr > t.dateTo) continue;   // string solishtirish ishlaydi
    if (t.allDay) return { intervals: [], reason: t.reason || 'timeoff' };
    cuts.push({ start: t.startMin, end: t.endMin });
  }

  return { intervals: subtractMany(intervals, cuts), reason: null };
}
```

> `dateStr < t.dateFrom` — `'YYYY-MM-DD'` formatida oddiy string solishtirish to'g'ri ishlaydi, chunki format leksikografik tartibda ham xronologik.

---

## Asosiy funksiya: slot generatsiyasi

```js
// services/booking.service.js
import { Salon, Master, Service, Booking, TimeOff } from '../models/index.js';
import { getWorkingIntervals, applyTimeOffs } from './schedule.service.js';
import { toHHMM, todayStr, nowMin } from '../utils/time.js';
import { SLOT_STEP_MIN, MIN_LEAD_TIME_MIN } from '../config/constants.js';

export async function getAvailableSlots({ masterId, dateStr, serviceIds }) {
  // ── 1. Ma'lumotlarni olish
  const master = await Master.findById(masterId).lean();
  if (!master || !master.isActive) throw new ApiError(404, 'Mutaxassis topilmadi', 'NOT_FOUND');

  const salon = await Salon.findById(master.salon).lean();
  if (!salon || salon.status !== 'active') throw new ApiError(404, 'Salon topilmadi', 'NOT_FOUND');

  const services = await Service.find({
    _id: { $in: serviceIds }, salon: salon._id, isActive: true,
  }).lean();

  if (services.length !== serviceIds.length) {
    throw new ApiError(400, 'Xizmat topilmadi', 'INVALID_SERVICE');
  }

  // ── 2. Jami davomiylik (buffer bilan)
  const totalDuration = services.reduce((s, x) => s + x.durationMin + (x.bufferMin || 0), 0);

  // ── 3. Ish vaqti intervallari
  let { intervals, reason } = getWorkingIntervals({ salon, master, dateStr });
  if (!intervals.length) return { isWorkingDay: false, reason, slots: [], totalDuration };

  // ── 4. Bloklangan vaqtlar
  const timeOffs = await TimeOff.find({
    salon: salon._id,
    $or: [{ master: master._id }, { master: null }],
    dateFrom: { $lte: dateStr },
    dateTo:   { $gte: dateStr },
  }).lean();

  ({ intervals, reason } = applyTimeOffs(intervals, timeOffs, dateStr));
  if (!intervals.length) return { isWorkingDay: false, reason, slots: [], totalDuration };

  // ── 5. Band qilingan yozuvlar
  const booked = await Booking.find({
    master: master._id,
    date: dateStr,
    status: { $in: ['pending', 'confirmed'] },
  }).select('startMin endMin').lean();

  intervals = subtractMany(
    intervals,
    booked.map((b) => ({ start: b.startMin, end: b.endMin })),
  );

  // ── 6. Eng erta mumkin bo'lgan vaqt (bugun bo'lsa)
  let earliest = 0;
  if (dateStr === todayStr()) {
    earliest = nowMin() + MIN_LEAD_TIME_MIN;   // hozirdan 1 soat keyin
  }

  // ── 7. Slotlarni yasash
  const slots = [];
  for (const iv of intervals) {
    // qadamga tekislangan boshlanish
    let t = Math.ceil(iv.start / SLOT_STEP_MIN) * SLOT_STEP_MIN;

    while (t + totalDuration <= iv.end) {
      if (t >= earliest) {
        slots.push({ startMin: t, start: toHHMM(t), end: toHHMM(t + totalDuration) });
      }
      t += SLOT_STEP_MIN;
    }
  }

  return {
    date: dateStr,
    isWorkingDay: true,
    totalDuration,
    slots,
  };
}
```

### Diqqat qilinadigan nuqtalar

| Nuqta | Nima uchun muhim |
|---|---|
| `t + totalDuration <= iv.end` | Xizmat ish vaqti **ichida tugashi** kerak. 90 daqiqali xizmatni 18:30 ga yozib bo'lmaydi, agar 19:00 da yopilsa |
| `Math.ceil(iv.start / STEP) * STEP` | Slotlar 09:00, 09:15, 09:30 ko'rinishida chiqadi, 09:07 emas |
| `status: { $in: ['pending','confirmed'] }` | Bekor qilingan yozuv slotni bo'shatadi |
| `$or: [{ master }, { master: null }]` | `null` = butun salon yopiq (bayram) |
| `bufferMin` | Ba'zi xizmatlardan keyin tozalash vaqti kerak |

---

## Bir oylik kunlarni hisoblash (kalendar uchun)

Har kun uchun alohida so'rov qilish = 30 ta DB so'rovi. Buning o'rniga **bir marta olib, xotirada guruhlash:**

```js
export async function getMonthAvailability({ masterId, month, serviceIds }) {
  const master = await Master.findById(masterId).lean();
  const salon  = await Salon.findById(master.salon).lean();
  const services = await Service.find({ _id: { $in: serviceIds } }).lean();
  const totalDuration = services.reduce((s, x) => s + x.durationMin + (x.bufferMin || 0), 0);

  const first = `${month}-01`;
  const daysInMonth = new Date(+month.slice(0, 4), +month.slice(5, 7), 0).getDate();
  const last = `${month}-${String(daysInMonth).padStart(2, '0')}`;

  // BIR MARTA hamma yozuvni olamiz
  const bookings = await Booking.find({
    master: master._id,
    date: { $gte: first, $lte: last },
    status: { $in: ['pending', 'confirmed'] },
  }).select('date startMin endMin').lean();

  const byDate = {};
  for (const b of bookings) (byDate[b.date] ||= []).push({ start: b.startMin, end: b.endMin });

  // BIR MARTA timeOff larni olamiz
  const timeOffs = await TimeOff.find({
    salon: salon._id,
    $or: [{ master: master._id }, { master: null }],
    dateFrom: { $lte: last },
    dateTo:   { $gte: first },
  }).lean();

  const today = todayStr();
  const result = {};

  for (let i = 0; i < daysInMonth; i++) {
    const dateStr = addDays(first, i);

    if (dateStr < today) { result[dateStr] = { available: false, reason: 'past' }; continue; }

    let { intervals, reason } = getWorkingIntervals({ salon, master, dateStr });
    if (intervals.length) ({ intervals, reason } = applyTimeOffs(intervals, timeOffs, dateStr));
    if (!intervals.length) { result[dateStr] = { available: false, reason: reason || 'closed' }; continue; }

    intervals = subtractMany(intervals, byDate[dateStr] || []);

    const earliest = dateStr === today ? nowMin() + MIN_LEAD_TIME_MIN : 0;
    let count = 0;
    for (const iv of intervals) {
      let t = Math.ceil(iv.start / SLOT_STEP_MIN) * SLOT_STEP_MIN;
      while (t + totalDuration <= iv.end) { if (t >= earliest) count++; t += SLOT_STEP_MIN; }
    }

    result[dateStr] = count > 0
      ? { available: true, slotCount: count }
      : { available: false, reason: 'full' };
  }

  return result;
}
```

Jami: **4 ta DB so'rovi** (master, salon, services, bookings + timeOffs), 30 kun uchun.

---

## Yozuv yaratish — ustma-ust tushishdan himoya

Bu eng nozik joy. Ikki mijoz bir vaqtda bir slotni bosishi mumkin.

**Ikki qatlamli himoya:**

```js
export async function createBooking({ userId, masterId, serviceIds, dateStr, startTime, clientName, clientPhone, note }) {
  const startMin = toMin(startTime);

  // ── QATLAM 1: slotni qaytadan hisoblab tekshirish
  const avail = await getAvailableSlots({ masterId, dateStr, serviceIds });
  if (!avail.isWorkingDay) throw new ApiError(409, 'Bu kun ish kuni emas', 'SLOT_TAKEN');

  const slot = avail.slots.find((s) => s.startMin === startMin);
  if (!slot) throw new ApiError(409, 'Kechirasiz, bu vaqt allaqachon band qilingan', 'SLOT_TAKEN');

  const services = await Service.find({ _id: { $in: serviceIds } }).lean();
  const master   = await Master.findById(masterId).lean();

  const doc = {
    code: await generateCode(),                   // 'GA-4821'
    client: userId,
    salon: master.salon,
    master: masterId,
    items: services.map((s) => ({
      service: s._id, name: s.name, price: s.price, durationMin: s.durationMin,
    })),
    date: dateStr,
    startMin,
    endMin: startMin + avail.totalDuration,
    totalPrice: services.reduce((a, s) => a + s.price, 0),
    totalDuration: avail.totalDuration,
    clientName, clientPhone, note,
    status: 'pending',
  };

  // ── QATLAM 2: unique index (master + date + startMin, faqat faol statuslar)
  try {
    return await Booking.create(doc);
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'Kechirasiz, bu vaqtni sizdan oldin band qilishdi', 'SLOT_TAKEN');
    }
    throw err;
  }
}
```

### Nima uchun ikkita qatlam kerak

- **1-qatlam** slot ish vaqti ichida ekanini, kesishmayotganini, o'tib ketmaganini tekshiradi
- **2-qatlam** (unique index) aynan bir xil sekundda kelgan ikki so'rovni bloklaydi — bazadan o'tolmaydi

⚠️ **Unique index qamrab olmaydigan holat:** turli `startMin` lekin **kesishuvchi** intervallar. Masalan 14:00–15:30 va 14:15–15:00. Index buni to'xtatmaydi, faqat 1-qatlam to'xtatadi. Yuqori yuklamada (bir slotga sekundda 10+ urinish) MongoDB tranzaksiyasi kerak bo'ladi — lekin v1 hajmida 1-qatlam yetarli. **v2 uchun eslatma qilib qo'yildi.**

---

## Bekor qilish

```js
export async function cancelByClient({ bookingId, userId }) {
  const booking = await Booking.findOne({ _id: bookingId, client: userId });
  if (!booking) throw new ApiError(404, 'Yozuv topilmadi', 'NOT_FOUND');

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw new ApiError(400, 'Bu yozuvni bekor qilib bo\'lmaydi', 'INVALID_STATUS');
  }

  // Boshlanishiga kamida 2 soat qolgan bo'lishi kerak
  const CANCEL_LIMIT = 120;
  if (booking.date === todayStr() && booking.startMin - nowMin() < CANCEL_LIMIT) {
    throw new ApiError(400, 'Boshlanishiga 2 soatdan kam qolganda bekor qilib bo\'lmaydi. Salonga qo\'ng\'iroq qiling', 'TOO_LATE');
  }
  if (booking.date < todayStr()) {
    throw new ApiError(400, 'O\'tgan yozuvni bekor qilib bo\'lmaydi', 'TOO_LATE');
  }

  booking.status = 'cancelled';
  booking.cancelledBy = 'client';
  await booking.save();
  return booking;   // slot avtomatik bo'shaydi (partial index)
}
```

---

## Cron ishlari

```js
// jobs/autoComplete.js — har kuni 01:00
// Vaqti o'tgan tasdiqlangan yozuvlarni yopish
await Booking.updateMany(
  { status: 'confirmed', date: { $lt: todayStr() } },
  { $set: { status: 'completed' } },
);

// Tasdiqlanmagan va o'tib ketgan yozuvlarni bekor qilish
await Booking.updateMany(
  { status: 'pending', date: { $lt: todayStr() } },
  { $set: { status: 'cancelled', cancelledBy: 'admin', cancelReason: 'Tasdiqlanmadi' } },
);

// jobs/expireTop.js — har kuni 00:05
await Salon.updateMany(
  { isTop: true, topUntil: { $lt: new Date() } },
  { $set: { isTop: false } },
);
```

---

## Test qilinishi shart bo'lgan holatlar

Bu ro'yxat topshirish shartiga kiradi:

| # | Holat | Kutilgan natija |
|---|---|---|
| 1 | Dam olish kuni | `isWorkingDay: false`, slot yo'q |
| 2 | Tushlik tanaffusi | 13:00–14:00 oralig'ida slot yo'q |
| 3 | 90 daq xizmat, 19:00 da yopiladi | Oxirgi slot 17:30 |
| 4 | 14:00–15:30 band | 13:00, 13:15... 14:00–15:30 ichidagi hech biri chiqmaydi |
| 5 | Bugun, hozir 10:00 | 11:00 dan oldin slot yo'q (lead time) |
| 6 | 2 xizmat tanlandi (60 + 90) | Slot 150 daqiqaga hisoblanadi |
| 7 | Usta ta'tilda (allDay timeOff) | Butun kun bo'sh emas |
| 8 | Butun salon yopiq (master: null) | Hamma usta uchun bo'sh emas |
| 9 | Bir slotga 2 parallel so'rov | Biri 201, ikkinchisi 409 `SLOT_TAKEN` |
| 10 | Yozuv bekor qilindi | Slot qaytadan bo'sh ko'rinadi |
| 11 | Ustaning o'z jadvali bor | Salon jadvali emas, ustaning jadvali ishlatiladi |
| 12 | O'tgan sana so'raldi | `reason: 'past'` |
| 13 | 60 kundan keyingi sana | `400 INVALID_DATE` |
| 14 | Egasi qo'lda yozuv qo'shdi | Onlayn slotlardan yo'qoladi |
