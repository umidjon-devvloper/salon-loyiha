# 02 — MongoDB baza

## Kolleksiyalar va bog'lanishlar

```
users ──1:1──▶ salons ──1:N──▶ masters ──1:N──▶ timeOffs
                  │                │
                  └──1:N──▶ services
                                   │
users(client) ──1:N──▶ bookings ◀──┘
                          ▲
categories ───────────────┘ (salon.categories, service.category)

salons ──1:N──▶ topOrders
```

---

## 1. `users`

```js
const userSchema = new Schema({
  phone:        { type: String, required: true, unique: true, index: true }, // +998901234567
  passwordHash: { type: String, required: true, select: false },
  fullName:     { type: String, required: true, trim: true },
  role:         { type: String, enum: ['client', 'owner', 'admin'], default: 'client', index: true },
  avatar:       { type: String, default: null },
  city:         { type: String, default: 'Toshkent' },
  isActive:     { type: Boolean, default: true },
  lastLoginAt:  { type: Date, default: null },
}, { timestamps: true });
```

- Login = `phone`. Email v1 da yo'q.
- `owner` rolini foydalanuvchi o'zi tanlab ro'yxatdan o'tadi, lekin saloni `status: 'pending'` bo'ladi — admin tasdiqlamaguncha katalogda ko'rinmaydi.
- Parolni tiklash: admin `/admin/foydalanuvchilar` dan yangi parol beradi.

---

## 2. `categories`

```js
const categorySchema = new Schema({
  name:     { uz: { type: String, required: true }, ru: { type: String, default: '' } },
  slug:     { type: String, required: true, unique: true },   // 'manikyur'
  icon:     { type: String, default: null },                   // svg fayl nomi yoki lucide nomi
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
```

**Boshlang'ich kategoriyalar (seed)** — rasmdagi ro'yxat bo'yicha:

| slug | uz |
|---|---|
| `gozallik-salonlari` | Go'zallik salonlari |
| `manikyur` | Manikyur |
| `pedikyur` | Pedikyur |
| `depilatsiya` | Depilatsiya |
| `kosmetolog` | Kosmetolog |
| `massaj` | Massaj |
| `psixolog` | Psixolog |
| `vizajist` | Vizajist |
| `soch-turmagi` | Soch turmagi / Parikmaxer |
| `fitness` | Fitness |
| `fotograf` | Fotograf |
| `boshqalar` | Boshqalar |

---

## 3. `salons`

```js
const workingDaySchema = new Schema({
  weekday:  { type: Number, required: true, min: 0, max: 6 }, // 0 = Yakshanba
  isOpen:   { type: Boolean, default: true },
  startMin: { type: Number, default: 540 },   // 09:00
  endMin:   { type: Number, default: 1140 },  // 19:00
  breaks:   [{ startMin: Number, endMin: Number }], // tushlik: 13:00–14:00
}, { _id: false });

const salonSchema = new Schema({
  owner:       { type: ObjectId, ref: 'User', required: true, index: true },
  name:        { type: String, required: true, trim: true },
  slug:        { type: String, required: true, unique: true },
  description: { type: String, default: '' },

  categories:  [{ type: ObjectId, ref: 'Category', index: true }],

  city:        { type: String, required: true, index: true },   // 'Toshkent'
  district:    { type: String, required: true, index: true },   // 'Chilonzor'
  address:     { type: String, default: '' },
  phone:       { type: String, required: true },
  telegram:    { type: String, default: null },
  instagram:   { type: String, default: null },

  cover:       { type: String, default: null },
  images:      [{ type: String }],

  workingHours: { type: [workingDaySchema], default: defaultWeek },

  // narx filtri uchun keshlanadi (xizmat qo'shilganda qayta hisoblanadi)
  minPrice:    { type: Number, default: 0, index: true },
  maxPrice:    { type: Number, default: 0 },

  rating:      { type: Number, default: 0, min: 0, max: 5 },  // v1: admin qo'lda
  reviewCount: { type: Number, default: 0 },                  // v1: admin qo'lda

  isTop:       { type: Boolean, default: false, index: true },
  topUntil:    { type: Date, default: null },
  isVerified:  { type: Boolean, default: false },

  status:      { type: String, enum: ['draft','pending','active','blocked'], default: 'draft', index: true },
  rejectReason:{ type: String, default: null },

  bookingCount:{ type: Number, default: 0 },  // statistika
}, { timestamps: true });

salonSchema.index({ status: 1, isTop: -1, rating: -1 });
salonSchema.index({ name: 'text', description: 'text' });
```

**`status` oqimi:**
`draft` (egasi to'ldirmoqda) → `pending` (tekshirishga yuborildi) → `active` (katalogda) / `blocked` (admin bloklagan)

---

## 4. `masters`

```js
const masterSchema = new Schema({
  salon:      { type: ObjectId, ref: 'Salon', required: true, index: true },
  fullName:   { type: String, required: true },
  photo:      { type: String, default: null },
  specialties:[{ type: ObjectId, ref: 'Category' }],
  experienceYears: { type: Number, default: 0 },
  bio:        { type: String, default: '' },

  // Agar bo'sh bo'lsa — salonning ish vaqti ishlatiladi
  workingHours: { type: [workingDaySchema], default: [] },

  rating:     { type: Number, default: 0 },
  isActive:   { type: Boolean, default: true, index: true },
  order:      { type: Number, default: 0 },
}, { timestamps: true });
```

> **Qoida:** salon yaratilganda avtomatik bitta `master` yaratiladi (salon nomi bilan). Agar salonda usta bo'linmagan bo'lsa, hamma yozuv shu "asosiy" ustaga tushadi. Bu booking logikasini bir xil saqlaydi.

---

## 5. `services`

```js
const serviceSchema = new Schema({
  salon:       { type: ObjectId, ref: 'Salon', required: true, index: true },
  category:    { type: ObjectId, ref: 'Category', required: true, index: true },
  name:        { type: String, required: true },    // 'Gel qoplama'
  description: { type: String, default: '' },

  price:       { type: Number, required: true, min: 0 },  // so'mda
  priceTo:     { type: Number, default: null },           // oralig'i bo'lsa
  isPriceFrom: { type: Boolean, default: false },         // "100 000 so'mdan"

  durationMin: { type: Number, required: true, min: 10 }, // ⭐ slot uchun
  bufferMin:   { type: Number, default: 0 },              // tozalash/tayyorlanish vaqti

  // Bu xizmatni qaysi ustalar bajaradi. Bo'sh = hammasi
  masters:     [{ type: ObjectId, ref: 'Master' }],

  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
}, { timestamps: true });
```

**Narxni ko'rsatish qoidasi (frontend):**
| Holat | Ko'rinishi |
|---|---|
| `price=100000`, `priceTo=null`, `isPriceFrom=false` | `100 000 so'm` |
| `price=100000`, `isPriceFrom=true` | `100 000 so'mdan` |
| `price=100000`, `priceTo=180000` | `100 000 – 180 000 so'm` |

---

## 6. `timeOffs` (bloklangan vaqt)

```js
const timeOffSchema = new Schema({
  salon:    { type: ObjectId, ref: 'Salon', required: true, index: true },
  master:   { type: ObjectId, ref: 'Master', default: null, index: true }, // null = butun salon
  dateFrom: { type: String, required: true },  // 'YYYY-MM-DD'
  dateTo:   { type: String, required: true },
  allDay:   { type: Boolean, default: true },
  startMin: { type: Number, default: null },   // allDay=false bo'lsa
  endMin:   { type: Number, default: null },
  reason:   { type: String, default: '' },     // 'Ta'til', 'Bayram'
}, { timestamps: true });

timeOffSchema.index({ master: 1, dateFrom: 1, dateTo: 1 });
```

---

## 7. `bookings` ⭐

```js
const bookingSchema = new Schema({
  code:     { type: String, required: true, unique: true },  // 'GA-4821' — mijozga aytish uchun

  client:   { type: ObjectId, ref: 'User', required: true, index: true },
  salon:    { type: ObjectId, ref: 'Salon', required: true, index: true },
  master:   { type: ObjectId, ref: 'Master', required: true, index: true },

  // Xizmatlar SNAPSHOT ko'rinishida saqlanadi — narx keyin o'zgarsa, yozuv o'zgarmaydi
  items: [{
    service:     { type: ObjectId, ref: 'Service' },
    name:        String,
    price:       Number,
    durationMin: Number,
  }],

  date:     { type: String, required: true, index: true },  // 'YYYY-MM-DD'
  startMin: { type: Number, required: true },               // 570 = 09:30
  endMin:   { type: Number, required: true },

  totalPrice:    { type: Number, required: true },
  totalDuration: { type: Number, required: true },

  // SMS yo'q — shuning uchun aloqa ma'lumoti majburiy
  clientName:  { type: String, required: true },
  clientPhone: { type: String, required: true },
  note:        { type: String, default: '' },

  status: {
    type: String,
    enum: ['pending','confirmed','completed','cancelled','no_show'],
    default: 'pending',
    index: true,
  },
  cancelledBy:  { type: String, enum: ['client','owner','admin',null], default: null },
  cancelReason: { type: String, default: null },
  confirmedAt:  { type: Date, default: null },
}, { timestamps: true });

// Ustma-ust yozuvni bazada bloklash (aynan bir xil boshlanish vaqti)
bookingSchema.index(
  { master: 1, date: 1, startMin: 1 },
  { unique: true, partialFilterExpression: { status: { $in: ['pending','confirmed'] } } }
);

// Kabinet kalendari uchun
bookingSchema.index({ master: 1, date: 1, status: 1 });
bookingSchema.index({ client: 1, createdAt: -1 });
```

### Status oqimi

```
        ┌──────────── mijoz bekor qiladi ──────┐
        │                                      ▼
pending ──(egasi tasdiqlaydi)──▶ confirmed ──▶ cancelled
   │                                 │
   │                                 ├──(vaqt o'tdi, cron)──▶ completed
   └──(egasi rad etadi)──▶ cancelled └──(mijoz kelmadi)─────▶ no_show
```

**Qoidalar:**
- Mijoz faqat `pending` / `confirmed` yozuvni bekor qila oladi va faqat **boshlanishiga 2 soatdan ko'p qolganda**
- `cancelled` va `no_show` slotni bo'shatadi (partial index ularni hisoblamaydi)
- Cron har kuni: `confirmed` + vaqti o'tgan → `completed`

---

## 8. `topOrders` (v1 — qo'lda, v2 — Payme)

```js
const topOrderSchema = new Schema({
  salon:     { type: ObjectId, ref: 'Salon', required: true, index: true },
  plan:      { type: String, enum: ['week','month'], required: true },
  days:      { type: Number, required: true },       // 7 yoki 30
  amount:    { type: Number, required: true },       // so'mda
  startDate: { type: Date, required: true },
  endDate:   { type: Date, required: true, index: true },

  paymentMethod: { type: String, enum: ['manual','payme'], default: 'manual' },
  paymentStatus: { type: String, enum: ['paid','pending','failed'], default: 'paid' },
  transactionId: { type: String, default: null },    // v2 uchun bo'sh turadi

  createdBy: { type: ObjectId, ref: 'User' },        // admin
  note:      { type: String, default: '' },
}, { timestamps: true });
```

Bu kolleksiya v1 da faqat **yozib qo'yish (log)** uchun. Payme kelganda struktura o'zgarmaydi — faqat `paymentMethod: 'payme'` va `transactionId` to'ldiriladi.

---

## 9. Band qilish to'lovi (booking fee)

Mijoz slotni band qilish uchun Payme orqali to'laydi. **Pul platformada qoladi**, salonga o'tkazilmaydi.

### Yangi kolleksiya: `settings` (bitta hujjat)

```js
const settingsSchema = new Schema({
  key: { type: String, unique: true },   // 'global'
  bookingFee: {
    enabled:     { type: Boolean, default: true },
    mode:        { type: String, enum: ['fixed','percent'], default: 'fixed' },
    fixedAmount: { type: Number, default: 5000 },    // so'mda
    percent:     { type: Number, default: 20 },
    minAmount:   { type: Number, default: 3000 },
    maxAmount:   { type: Number, default: 50000 },
  },
  holdMinutes: { type: Number, default: 15 },
  topPrices:   { week: { type: Number, default: 50000 }, month: { type: Number, default: 150000 } },
}, { timestamps: true });
```

> Admin panelda tahrirlanadi. Kod qayta yozilmasin — bozor reaksiyasiga qarab raqamlar o'zgaradi.

### `bookings` ga qo'shiladi

```js
bookingFee: {
  amount:        { type: Number, default: 0 },       // so'mda
  status:        { type: String, enum: ['none','pending','paid','refunded','failed'], default: 'none' },
  method:        { type: String, enum: ['payme', null], default: null },
  transactionId: { type: String, default: null },
  paidAt:        { type: Date, default: null },
  refundedAt:    { type: Date, default: null },
},

// To'lov jarayonida slotni vaqtincha ushlab turish
holdUntil: { type: Date, default: null },
```

### `status` enum kengaytiriladi

```js
enum: ['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show']
```

### Oqim

```
1. Mijoz slot tanlaydi
2. POST /bookings → status: 'awaiting_payment', holdUntil = hozir + 15 daqiqa
   ⚠️ Shu paytdan slot BAND hisoblanadi (boshqalarga ko'rinmaydi)
3. Payme checkout sahifasiga yo'naltiriladi
4. To'landi → webhook → status: 'pending', bookingFee.status: 'paid', holdUntil: null
5. To'lanmadi → cron (har 2 daqiqada) holdUntil o'tganlarni 'cancelled' qiladi → slot bo'shaydi
```

**Muhim:** slot hisoblashda `awaiting_payment` ham band deb qaraladi:

```js
status: { $in: ['awaiting_payment', 'pending', 'confirmed'] }
```

Unique partial index ham shunga moslashtiriladi.

Batafsil: [07-payme.md](07-payme.md)

---

## Seed skript nima yaratadi

```
1. Admin foydalanuvchi (.env dan telefon + parol)
2. 12 ta kategoriya (yuqoridagi jadval)
3. Toshkent tumanlari ro'yxati (constants.js da, alohida kolleksiya kerak emas)
4. Dev rejimda: 5 ta demo salon + 12 ta usta + 40 ta xizmat + 20 ta test yozuv
```
