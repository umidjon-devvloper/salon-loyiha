# 01 — Arxitektura

## Umumiy ko'rinish

```
┌──────────────────────┐        ┌──────────────────────┐
│   Web (React SPA)    │        │  Admin panel (SPA)   │
│  mijoz + salon egasi │        │   (bir loyihada,     │
│                      │        │   /admin route)      │
└──────────┬───────────┘        └──────────┬───────────┘
           │  HTTPS / REST JSON            │
           └──────────────┬────────────────┘
                          ▼
              ┌───────────────────────┐
              │   Nginx (reverse      │
              │   proxy + static)     │
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │  Express API (Node)   │
              │  ┌─────────────────┐  │
              │  │ routes          │  │
              │  │ controllers     │  │
              │  │ services        │  │
              │  │   └ booking.svc │  │  ← slot hisoblash
              │  │ models          │  │
              │  └─────────────────┘  │
              └───────────┬───────────┘
                          ▼
              ┌───────────────────────┐
              │   MongoDB (Mongoose)  │
              └───────────────────────┘

Rasmlar: server diskida /var/www/uploads → Nginx orqali /uploads/... da beriladi
```

Frontend va admin **bitta React loyihasida** bo'ladi (alohida build qilish v1 uchun keraksiz ish). Admin sahifalar `/admin/*` route ostida, `role === 'admin'` bilan himoyalangan.

---

## Rollar va huquqlar

| Rol | Nima qila oladi |
|---|---|
| `guest` | Katalogni ko'rish, qidirish, bo'sh vaqtlarni ko'rish. Band qilish uchun ro'yxatdan o'tishi kerak |
| `client` | Band qilish, o'z yozuvlarini ko'rish va bekor qilish, profilni tahrirlash |
| `owner` | O'z salonini boshqarish: profil, xizmatlar, mutaxassislar, ish vaqti, kelgan yozuvlar |
| `admin` | Hammasi: salonlarni tasdiqlash/bloklash, kategoriyalar, TOP e'lon, foydalanuvchilar |

**Muhim:** `owner` faqat **o'zining** salonига tegishli ma'lumotni ko'radi. Har bir `/api/owner/*` so'rovda `salon.owner === req.user.id` tekshiruvi bo'lishi shart (middleware: `ownerOfSalon`).

---

## Asosiy oqimlar (flow)

### A. Mijoz band qiladi

```
1. Bosh sahifa → kategoriya tanlaydi (masalan "Manikyur")
2. Salonlar/mutaxassislar ro'yxati (filtr: shahar, narx, saralash)
3. Salon profilini ochadi → xizmatlar va narxlar ro'yxati
4. Xizmat(lar)ni tanlaydi  → jami davomiylik hisoblanadi
5. Mutaxassisni tanlaydi (yoki "farqi yo'q")
6. Kalendarda kun tanlaydi
      → GET /api/availability/days   (qaysi kunlarda joy bor)
7. Bo'sh soatlar chiqadi
      → GET /api/availability        (aniq slotlar)
8. Ism + telefon + izoh kiritadi
9. POST /api/bookings   → status: 'pending'
10. Tasdiq ekrani: "Yozuvingiz qabul qilindi, salon tez orada tasdiqlaydi"
11. Kabinetда ko'radi: /profil/yozuvlarim
```

### B. Salon egasi ish vaqtini kiritadi

```
1. /kabinet/jadval
2. Har bir hafta kuni uchun: ochiq/yopiq, boshlanish, tugash, tanaffus
      → PUT /api/owner/schedule
3. Xizmatlarga davomiylik beradi (manikyur = 60 daq, gel = 90 daq)
      → PUT /api/owner/services/:id
4. Ta'til/dam olish kunlarini bloklaydi
      → POST /api/owner/time-offs
5. Kelgan yozuvlarni ko'radi: /kabinet/yozuvlar (kun bo'yicha kalendar)
6. Tasdiqlaydi yoki bekor qiladi
      → PATCH /api/owner/bookings/:id/status
```

### C. TOP e'lon (v1 — qo'lda)

```
1. Salon egasi TOP ga chiqishni xohlaydi → adminga qo'ng'iroq/Telegram
2. Pulni naqd yoki karta orqali to'laydi (platformadan tashqarida)
3. Admin: /admin/salonlar → "TOP qilish" → tarif tanlaydi (7 / 30 kun)
      → PATCH /api/admin/salons/:id/top
4. Bazada: isTop = true, topUntil = bugun + N kun
5. Har kuni 00:05 da cron: topUntil o'tgan salonlarda isTop = false
6. Katalog saralashda TOP salonlar birinchi chiqadi
```

> v2 da 1–3 qadamlar Payme integratsiyasi bilan avtomatlashtiriladi. Baza sxemasi shunga tayyor (`topOrders` kolleksiyasi).

---

## Backend papka strukturasi

```
backend/
├── src/
│   ├── config/
│   │   ├── db.js               # Mongoose ulanish
│   │   ├── env.js              # process.env ni zod bilan tekshirish
│   │   └── constants.js        # SLOT_STEP, TIMEZONE, rollar, statuslar
│   ├── models/
│   │   ├── User.js
│   │   ├── Category.js
│   │   ├── Salon.js
│   │   ├── Master.js
│   │   ├── Service.js
│   │   ├── TimeOff.js
│   │   ├── Booking.js
│   │   └── TopOrder.js
│   ├── routes/
│   │   ├── index.js            # barcha routerlarni yig'adi
│   │   ├── auth.routes.js
│   │   ├── public.routes.js    # katalog, qidiruv, availability
│   │   ├── booking.routes.js
│   │   ├── owner.routes.js
│   │   └── admin.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── salon.controller.js
│   │   ├── master.controller.js
│   │   ├── service.controller.js
│   │   ├── booking.controller.js
│   │   ├── schedule.controller.js
│   │   └── admin.controller.js
│   ├── services/
│   │   ├── booking.service.js  # ⭐ slot hisoblash — eng muhim fayl
│   │   ├── schedule.service.js # ish vaqti intervallarini yasash
│   │   ├── token.service.js
│   │   └── upload.service.js   # sharp bilan resize
│   ├── middleware/
│   │   ├── auth.js             # JWT tekshirish → req.user
│   │   ├── requireRole.js      # requireRole('owner','admin')
│   │   ├── ownerOfSalon.js     # egalik tekshiruvi
│   │   ├── validate.js         # zod schema middleware
│   │   ├── errorHandler.js
│   │   └── rateLimit.js
│   ├── validators/             # zod sxemalari
│   ├── utils/
│   │   ├── time.js             # "09:30" ⇄ 570 konvertatsiya
│   │   ├── slugify.js
│   │   ├── ApiError.js
│   │   └── paginate.js
│   ├── jobs/
│   │   ├── expireTop.js        # cron: TOP muddatini tekshirish
│   │   └── autoComplete.js     # cron: o'tgan yozuvlarni 'completed' qilish
│   ├── app.js
│   └── server.js
├── uploads/                    # .gitignore
├── .env.example
└── package.json
```

### `.env.example`

```env
NODE_ENV=development
PORT=5000

MONGO_URI=mongodb://127.0.0.1:27017/gozal_ayol

JWT_ACCESS_SECRET=change_me
JWT_REFRESH_SECRET=change_me_too
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=30d

CLIENT_URL=http://localhost:5173
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5

TIMEZONE=Asia/Tashkent
SLOT_STEP_MIN=15
MIN_LEAD_TIME_MIN=60
MAX_ADVANCE_DAYS=60
```

---

## Frontend papka strukturasi

```
frontend/
├── src/
│   ├── api/
│   │   ├── client.js           # axios instance + interceptor (refresh token)
│   │   ├── auth.api.js
│   │   ├── catalog.api.js
│   │   ├── booking.api.js
│   │   ├── owner.api.js
│   │   └── admin.api.js
│   ├── components/
│   │   ├── ui/                 # Button, Input, Select, Modal, Badge, Skeleton...
│   │   ├── layout/             # Header, Footer, MobileNav, Sidebar
│   │   ├── catalog/            # CategoryGrid, SalonCard, MasterCard, FilterPanel
│   │   ├── booking/            # ServicePicker, MasterPicker, DatePicker, SlotGrid
│   │   └── owner/              # ScheduleEditor, BookingCalendar, ServiceForm
│   ├── pages/
│   │   ├── public/
│   │   ├── client/
│   │   ├── owner/
│   │   └── admin/
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useAvailability.js
│   │   └── useDebounce.js
│   ├── store/
│   │   └── authStore.js        # zustand + localStorage persist
│   ├── lib/
│   │   ├── format.js           # narxni "100 000 so'm" ko'rinishida
│   │   ├── time.js
│   │   └── constants.js
│   ├── routes/
│   │   ├── AppRoutes.jsx
│   │   ├── ProtectedRoute.jsx
│   │   └── RoleRoute.jsx
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
└── vite.config.js
```

---

## Xavfsizlik (v1 uchun minimal, lekin majburiy)

- Parol `bcrypt` (10 round) bilan hashlanadi, hech qachon javobda qaytmaydi
- Access token 15 daqiqa, refresh token 30 kun (httpOnly cookie yoki localStorage — v1 da localStorage yetarli)
- `/api/auth/login` va `/register` ga rate limit: 10 so'rov / 15 daqiqa / IP
- Barcha `body` zod bilan validatsiya qilinadi, `mongo-sanitize` NoSQL injection uchun
- Rasm yuklashda: faqat `image/jpeg|png|webp`, max 5 MB, `sharp` bilan qayta yoziladi (EXIF tozalanadi)
- `helmet`, `cors` faqat `CLIENT_URL` uchun
- Telefon raqam formati: `+998XXXXXXXXX` — bazaga normallashtirilgan holda yoziladi
