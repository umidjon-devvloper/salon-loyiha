/**
 * Demo ma'lumot GENERATORI — bazaga tegmaydi, faqat oddiy obyektlar qaytaradi.
 *
 * Ajratilganining sababi: yasalgan yozuvlar ish vaqtiga tushishini va
 * ustma-ust bo'lmasligini bazasiz testlash mumkin bo'lsin
 * (aks holda seed jimgina buzuq ma'lumot yaratadi va uni faqat qo'lda ko'rib topasan).
 */
import { addDays, toHHMM, ceilToStep, weekdayOf } from '@gozal/shared/utils/time';
import { slugify } from '@gozal/shared/utils/format';

const SLOT_STEP = 15;

// ── Salonlar ────────────────────────────────────────────────────

export const DEMO_SALONS = [
  {
    name: 'Lotus Beauty',
    district: 'Chilonzor',
    phone: '+998901110001',
    description: 'Zamonaviy jihozlar va tajribali mutaxassislar. 2018-yildan beri xizmatdamiz.',
    categorySlugs: ['gozallik-salonlari', 'manikyur', 'pedikyur'],
    rating: 4.8,
    reviewCount: 128,
    isTop: true,
    masters: [
      { fullName: 'Dildora Karimova', experienceYears: 7 },
      { fullName: 'Nargiza Sobirova', experienceYears: 4 },
      { fullName: 'Zilola Tosheva', experienceYears: 2 },
    ],
    services: [
      { name: 'Klassik manikyur', category: 'manikyur', price: 100000, durationMin: 60 },
      { name: 'Gel qoplama', category: 'manikyur', price: 150000, durationMin: 90, bufferMin: 10 },
      {
        name: 'Naxun uzaytirish',
        category: 'manikyur',
        price: 250000,
        durationMin: 120,
        bufferMin: 15,
      },
      { name: 'Klassik pedikyur', category: 'pedikyur', price: 120000, durationMin: 75 },
      {
        name: 'Apparat pedikyuri',
        category: 'pedikyur',
        price: 180000,
        priceTo: 250000,
        durationMin: 90,
      },
      {
        name: 'Naxun dizayni',
        category: 'manikyur',
        price: 30000,
        isPriceFrom: true,
        durationMin: 30,
      },
      { name: 'Parafin terapiya', category: 'manikyur', price: 80000, durationMin: 45 },
      { name: 'Naxun tiklash', category: 'manikyur', price: 60000, durationMin: 40 },
    ],
  },
  {
    name: 'Nafisa Studio',
    district: 'Yunusobod',
    phone: '+998901110002',
    description: "Soch turmagi va bo'yash bo'yicha ixtisoslashgan studiya.",
    categorySlugs: ['soch-turmagi', 'vizajist'],
    rating: 4.6,
    reviewCount: 74,
    isTop: true,
    masters: [
      { fullName: 'Malika Yusupova', experienceYears: 10 },
      { fullName: 'Sevara Ahmedova', experienceYears: 5 },
    ],
    services: [
      { name: 'Soch kesish', category: 'soch-turmagi', price: 80000, durationMin: 45 },
      {
        name: "Soch bo'yash",
        category: 'soch-turmagi',
        price: 300000,
        priceTo: 600000,
        durationMin: 180,
        bufferMin: 15,
      },
      { name: 'Keratin tiklash', category: 'soch-turmagi', price: 450000, durationMin: 150 },
      { name: "Turmak (soch yig'ish)", category: 'soch-turmagi', price: 150000, durationMin: 60 },
      { name: 'Kunlik makiyaj', category: 'vizajist', price: 200000, durationMin: 60 },
      {
        name: 'Kelin makiyaji',
        category: 'vizajist',
        price: 500000,
        isPriceFrom: true,
        durationMin: 120,
        bufferMin: 20,
      },
      { name: 'Qosh korreksiyasi', category: 'vizajist', price: 50000, durationMin: 30 },
      { name: 'Kiprik uzaytirish', category: 'vizajist', price: 250000, durationMin: 120 },
    ],
  },
  {
    name: 'Zebo Kosmetologiya',
    district: 'Mirobod',
    phone: '+998901110003',
    description: 'Sertifikatlangan kosmetolog. Yuz terisi parvarishi va apparat muolajalari.',
    categorySlugs: ['kosmetolog', 'depilatsiya'],
    rating: 4.9,
    reviewCount: 56,
    isTop: false,
    masters: [
      { fullName: 'Zebo Rahimova', experienceYears: 12 },
      { fullName: 'Gulnora Ismoilova', experienceYears: 6 },
    ],
    services: [
      {
        name: 'Yuz tozalash',
        category: 'kosmetolog',
        price: 250000,
        durationMin: 90,
        bufferMin: 15,
      },
      { name: 'Pilling', category: 'kosmetolog', price: 300000, durationMin: 60 },
      { name: 'Mezoterapiya', category: 'kosmetolog', price: 450000, durationMin: 75 },
      { name: 'Ultratovushli tozalash', category: 'kosmetolog', price: 200000, durationMin: 60 },
      {
        name: 'Lazer depilatsiya (oyoq)',
        category: 'depilatsiya',
        price: 350000,
        durationMin: 60,
        bufferMin: 10,
      },
      {
        name: 'Shakar depilatsiya',
        category: 'depilatsiya',
        price: 120000,
        priceTo: 300000,
        durationMin: 45,
      },
      { name: 'Yuz massaji', category: 'kosmetolog', price: 150000, durationMin: 45 },
      { name: 'Maska va parvarish', category: 'kosmetolog', price: 180000, durationMin: 50 },
    ],
  },
  {
    name: 'Relax Massaj',
    district: 'Yakkasaroy',
    phone: '+998901110004',
    description: 'Klassik, sport va relaks massaj. Erkak va ayol mutaxassislar.',
    categorySlugs: ['massaj'],
    rating: 4.5,
    reviewCount: 91,
    isTop: false,
    masters: [
      { fullName: 'Shahnoza Qodirova', experienceYears: 8 },
      { fullName: 'Feruza Nazarova', experienceYears: 3 },
    ],
    services: [
      { name: 'Klassik massaj', category: 'massaj', price: 200000, durationMin: 60 },
      { name: 'Relaks massaj', category: 'massaj', price: 250000, durationMin: 90 },
      {
        name: 'Anticellulit massaj',
        category: 'massaj',
        price: 300000,
        durationMin: 60,
        bufferMin: 10,
      },
      { name: 'Orqa massaji', category: 'massaj', price: 150000, durationMin: 40 },
      { name: "Bosh va bo'yin massaji", category: 'massaj', price: 120000, durationMin: 30 },
      { name: 'Oyoq massaji', category: 'massaj', price: 130000, durationMin: 40 },
      { name: 'Tosh massaji', category: 'massaj', price: 350000, durationMin: 90, bufferMin: 15 },
      { name: 'Sport massaji', category: 'massaj', price: 280000, durationMin: 60 },
    ],
  },
  {
    name: 'Glamour Studio',
    district: 'Sergeli',
    phone: '+998901110005',
    description: 'Hamma xizmat bir joyda: manikyur, soch, makiyaj.',
    categorySlugs: ['gozallik-salonlari', 'manikyur', 'soch-turmagi'],
    rating: 4.3,
    reviewCount: 38,
    isTop: false,
    masters: [
      { fullName: 'Kamola Rashidova', experienceYears: 5 },
      { fullName: 'Sitora Bekmurodova', experienceYears: 2 },
      { fullName: 'Umida Xolmatova', experienceYears: 9 },
    ],
    services: [
      {
        name: 'Manikyur + gel',
        category: 'manikyur',
        price: 180000,
        durationMin: 105,
        bufferMin: 10,
      },
      { name: 'Ekspress manikyur', category: 'manikyur', price: 70000, durationMin: 30 },
      { name: 'Soch kesish', category: 'soch-turmagi', price: 70000, durationMin: 40 },
      { name: 'Feniya (soch quritish)', category: 'soch-turmagi', price: 50000, durationMin: 30 },
      {
        name: 'Kompleks: manikyur + pedikyur',
        category: 'manikyur',
        price: 220000,
        durationMin: 150,
        bufferMin: 15,
      },
      { name: 'Soch maskasi', category: 'soch-turmagi', price: 90000, durationMin: 45 },
      { name: "Qosh bo'yash", category: 'gozallik-salonlari', price: 60000, durationMin: 30 },
      {
        name: 'Kiprik laminatsiyasi',
        category: 'gozallik-salonlari',
        price: 200000,
        durationMin: 75,
      },
    ],
  },
];

const CLIENT_NAMES = [
  'Dildora Karimova',
  'Nigora Sattorova',
  "Madina Yo'ldosheva",
  'Aziza Qosimova',
  'Sabina Tursunova',
  'Nilufar Ergasheva',
];

// ── Yozuv generatori ────────────────────────────────────────────

/**
 * Demo yozuvlarni yasaydi.
 *
 * Kafolatlar:
 *  - har bir yozuv ustaning ish vaqti ICHIDA tugaydi
 *  - tanaffusga tushmaydi
 *  - bir usta uchun kunda vaqtlar kesishmaydi
 *  - `startMin` SLOT_STEP ga tekislangan
 *
 * @param {object} p
 * @param {string} p.today          'YYYY-MM-DD'
 * @param {Array}  p.masters        [{ id, salonId, workingHours }]
 * @param {Map}    p.servicesBySalon salonId → [{ id, name, price, durationMin, bufferMin }]
 * @param {number} p.count
 */
export function buildDemoBookings({ today, masters, servicesBySalon, count = 20 }) {
  const bookings = [];
  const taken = new Set(); // `${masterId}|${date}|${startMin}`
  const busy = new Map(); // `${masterId}|${date}` → [{ start, end }]

  const statuses = ['pending', 'confirmed', 'confirmed', 'completed', 'cancelled'];
  let i = 0;

  // Kelasi 7 kunni aylanib chiqamiz
  for (let dayOffset = 1; dayOffset <= 7 && bookings.length < count; dayOffset++) {
    const date = addDays(today, dayOffset);
    const weekday = weekdayOf(date);

    for (const master of masters) {
      if (bookings.length >= count) break;

      const day = master.workingHours.find((d) => d.weekday === weekday);
      if (!day || !day.isOpen) continue;

      const services = servicesBySalon.get(String(master.salonId)) || [];
      if (!services.length) continue;

      const service = services[i % services.length];
      const duration = service.durationMin + (service.bufferMin || 0);

      const key = `${master.id}|${date}`;
      const ranges = busy.get(key) || [];

      const fits = (s) => {
        const e = s + duration;
        if (e > day.endMin) return false;
        if ((day.breaks || []).some((b) => s < b.endMin && b.startMin < e)) return false;
        if (ranges.some((r) => s < r.end && r.start < e)) return false;
        return !taken.has(`${master.id}|${date}|${s}`);
      };

      /*
       * Har safar ish vaqti boshidan qidirsak, hamma yozuv 09:00 ga yig'iladi
       * va demo kalendar bo'm-bo'sh ko'rinadi. Shuning uchun har bir yozuv uchun
       * kun ichida siljigan nuqtadan boshlaymiz, joy topilmasa — boshiga qaytamiz.
       */
      const offset =
        (i * 75) % Math.max(SLOT_STEP, day.endMin - day.startMin - duration || SLOT_STEP);
      let start = null;

      for (const from of [
        ceilToStep(day.startMin + offset, SLOT_STEP),
        ceilToStep(day.startMin, SLOT_STEP),
      ]) {
        for (let s = from; s + duration <= day.endMin; s += SLOT_STEP) {
          if (fits(s)) {
            start = s;
            break;
          }
        }
        if (start !== null) break;
      }

      if (start === null) continue;

      const end = start + duration;
      ranges.push({ start, end });
      busy.set(key, ranges);
      taken.add(`${master.id}|${date}|${start}`);

      bookings.push({
        salonId: master.salonId,
        masterId: master.id,
        date,
        startMin: start,
        endMin: end,
        startTime: toHHMM(start),
        items: [
          {
            service: service.id,
            name: service.name,
            price: service.price,
            durationMin: service.durationMin,
          },
        ],
        totalPrice: service.price,
        totalDuration: duration,
        clientName: CLIENT_NAMES[i % CLIENT_NAMES.length],
        clientPhone: `+99890123${String(4560 + (i % 40)).padStart(4, '0')}`,
        status: statuses[i % statuses.length],
        source: i % 5 === 0 ? 'manual' : 'online',
        note: i % 3 === 0 ? 'Iltimos, biroz kechiksam kutib turing' : '',
      });

      i++;
    }
  }

  return bookings;
}

/** Nomdan takrorlanmas slug yasaydi */
export function uniqueSlug(name, existing = new Set()) {
  const base = slugify(name) || 'salon';
  let slug = base;
  let n = 2;
  while (existing.has(slug)) slug = `${base}-${n++}`;
  existing.add(slug);
  return slug;
}
