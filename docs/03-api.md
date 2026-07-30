# 03 — REST API

Barcha endpointlar `/api` prefiksi bilan. Javob formati har doim bir xil:

```jsonc
// muvaffaqiyat
{ "success": true, "data": { ... } }

// ro'yxat (pagination bilan)
{ "success": true, "data": [ ... ], "meta": { "page": 1, "limit": 20, "total": 143, "pages": 8 } }

// xato
{ "success": false, "message": "Bu vaqt allaqachon band qilingan", "code": "SLOT_TAKEN" }
```

Auth kerak bo'lgan joyda: `Authorization: Bearer <accessToken>`

---

## Auth — `/api/auth`  (SMS YO'Q)

| Metod | Yo'l | Kim | Tavsif |
|---|---|---|---|
| POST | `/register` | guest | Ro'yxatdan o'tish |
| POST | `/login` | guest | Kirish |
| POST | `/refresh` | guest | Access tokenni yangilash |
| POST | `/logout` | auth | Refresh tokenni o'chirish |
| GET | `/me` | auth | O'z profili |
| PATCH | `/me` | auth | Profilni tahrirlash (ism, avatar, shahar) |
| POST | `/change-password` | auth | Parolni o'zgartirish (eski parol bilan) |

```jsonc
// POST /api/auth/register
{
  "phone": "+998901234567",
  "password": "min 6 belgi",
  "fullName": "Dildora Karimova",
  "role": "client"          // yoki "owner"
}
// → 201
{ "success": true, "data": {
    "user": { "id": "...", "phone": "...", "fullName": "...", "role": "client" },
    "accessToken": "...", "refreshToken": "..."
}}
```

```jsonc
// POST /api/auth/login
{ "phone": "+998901234567", "password": "..." }
```

**Validatsiya:**
- `phone` — `+998` + 9 raqam. Kiritilganda avtomatik normallashtiriladi (`90 123 45 67` → `+998901234567`)
- `password` — min 6 belgi
- Telefon band bo'lsa: `409 PHONE_TAKEN`
- Parol xato: `401 INVALID_CREDENTIALS` (telefon topilmadi/parol xato — ikkisiga bir xil xabar)

---

## Katalog (ochiq) — `/api/`

| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/categories` | Kategoriyalar ro'yxati (+ har birida salon soni) |
| GET | `/cities` | Shahar va tumanlar ro'yxati (constants dan) |
| GET | `/salons` | Salonlar ro'yxati, filtr va pagination bilan |
| GET | `/salons/:slug` | Salon to'liq profili (xizmatlar + ustalar + ish vaqti) |
| GET | `/masters` | Mutaxassislar ro'yxati |
| GET | `/masters/:id` | Mutaxassis profili (+ xizmatlari) |
| GET | `/search?q=` | Umumiy qidiruv (salon nomi, usta nomi, xizmat nomi) |

### `GET /api/salons` — query parametrlari

| Parametr | Misol | Tavsif |
|---|---|---|
| `category` | `manikyur` | Kategoriya slug |
| `city` | `Toshkent` | Shahar |
| `district` | `Chilonzor` | Tuman |
| `minPrice` / `maxPrice` | `50000` / `200000` | Narx oralig'i |
| `q` | `lotus` | Nom bo'yicha qidiruv |
| `sort` | `top` \| `price_asc` \| `price_desc` \| `rating` \| `new` | Saralash. Default: `top` |
| `page` / `limit` | `1` / `20` | Pagination |

> **Muhim:** `sort=top` da tartib — `isTop: -1, rating: -1, createdAt: -1`. Faqat `status: 'active'` salonlar chiqadi.

---

## Bo'sh vaqt (availability) — ⭐ eng muhim endpointlar

### `GET /api/availability`

```
GET /api/availability?masterId=65f...&date=2026-08-05&serviceIds=65a...,65b...
```

```jsonc
// → 200
{
  "success": true,
  "data": {
    "date": "2026-08-05",
    "weekday": 3,
    "isWorkingDay": true,
    "workingHours": { "start": "09:00", "end": "19:00", "breaks": [{ "start": "13:00", "end": "14:00" }] },
    "totalDuration": 90,
    "slots": [
      { "start": "09:00", "end": "10:30", "startMin": 540 },
      { "start": "09:15", "end": "10:45", "startMin": 555 },
      { "start": "14:00", "end": "15:30", "startMin": 840 }
    ]
  }
}
```

Agar kun yopiq bo'lsa: `isWorkingDay: false`, `slots: []`, `reason: "Dam olish kuni"` yoki `reason: "Ta'til"`.

### `GET /api/availability/days`

Kalendarda qaysi kunlarni yoqish/o'chirish uchun — bir oyni bir so'rovda oladi.

```
GET /api/availability/days?masterId=65f...&month=2026-08&serviceIds=65a...
```

```jsonc
{ "success": true, "data": {
    "2026-08-01": { "available": true,  "slotCount": 12 },
    "2026-08-02": { "available": false, "reason": "closed" },
    "2026-08-03": { "available": false, "reason": "full" },
    "2026-08-04": { "available": true,  "slotCount": 3 }
}}
```

> Bu endpoint 30 kunni bitta MongoDB so'rovi bilan hisoblaydi (barcha oy yozuvlarini bir marta olib, xotirada guruhlaydi). N+1 so'rov qilish taqiqlanadi.

---

## Booking (mijoz) — `/api/bookings`

| Metod | Yo'l | Kim | Tavsif |
|---|---|---|---|
| POST | `/` | client | Yangi yozuv yaratish |
| GET | `/my` | client | Mening yozuvlarim (`?status=`, `?upcoming=true`) |
| GET | `/my/:id` | client | Bitta yozuv |
| PATCH | `/my/:id/cancel` | client | Bekor qilish |

```jsonc
// POST /api/bookings
{
  "masterId": "65f...",
  "serviceIds": ["65a...", "65b..."],
  "date": "2026-08-05",
  "startTime": "14:00",
  "clientName": "Dildora",
  "clientPhone": "+998901234567",
  "note": "Ilova qildim, qisqa naxun"
}
// → 201
{ "success": true, "data": { "id": "...", "code": "GA-4821", "status": "pending", ... } }
```

**Server tomonda tekshiruvlar (hammasi majburiy):**

| Tekshiruv | Xato kodi |
|---|---|
| Usta va xizmatlar mavjud, `isActive`, salon `active` | `404 NOT_FOUND` |
| Xizmatlar shu salonga tegishli | `400 INVALID_SERVICE` |
| Sana o'tmagan, `MAX_ADVANCE_DAYS` (60 kun) ichida | `400 INVALID_DATE` |
| Bugungi kun bo'lsa — hozirdan `MIN_LEAD_TIME_MIN` (60 daq) keyin | `400 TOO_LATE` |
| `startTime` hisoblangan slotlar ro'yxatida bor | `409 SLOT_TAKEN` |
| Mijozning shu kunda shu salonda faol yozuvi yo'q (spam himoya) | `409 DUPLICATE_BOOKING` |
| Mijozning umumiy faol yozuvi 5 tadan kam | `429 TOO_MANY_ACTIVE` |

> ⚠️ **Slot tekshiruvi `POST` ichida qaytadan bajarilishi shart.** Frontenddan kelgan `startTime` ga ishonib bo'lmaydi — mijoz slotni ko'rgandan keyin boshqa kishi band qilib qo'yishi mumkin.

---

## Salon egasi kabineti — `/api/owner`

Barchasi: `auth` + `requireRole('owner')` + `ownerOfSalon`

### Salon profili
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/salon` | O'z salonim |
| POST | `/salon` | Salon yaratish (bir egaga bitta salon — v1) |
| PUT | `/salon` | Tahrirlash |
| POST | `/salon/submit` | Tekshirishga yuborish (`draft` → `pending`) |
| POST | `/salon/images` | Rasm yuklash (multipart, max 10 ta) |
| DELETE | `/salon/images/:filename` | Rasmni o'chirish |

### Ish vaqti
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/schedule` | Hafta jadvali |
| PUT | `/schedule` | To'liq haftani saqlash |

```jsonc
// PUT /api/owner/schedule
{ "target": "salon",        // yoki "master"
  "masterId": null,
  "days": [
    { "weekday": 1, "isOpen": true,  "start": "09:00", "end": "19:00",
      "breaks": [{ "start": "13:00", "end": "14:00" }] },
    { "weekday": 0, "isOpen": false }
  ]
}
```

### Mutaxassislar
| Metod | Yo'l |
|---|---|
| GET | `/masters` |
| POST | `/masters` |
| PUT | `/masters/:id` |
| DELETE | `/masters/:id` |
| PUT | `/masters/:id/schedule` |

> Ustani o'chirish: agar kelgusi faol yozuvlari bo'lsa → `409 HAS_ACTIVE_BOOKINGS`. Buning o'rniga `isActive: false` qilish taklif qilinadi.

### Xizmatlar
| Metod | Yo'l |
|---|---|
| GET | `/services` |
| POST | `/services` |
| PUT | `/services/:id` |
| DELETE | `/services/:id` |
| PATCH | `/services/reorder` |

### Dam olish / bloklangan vaqt
| Metod | Yo'l |
|---|---|
| GET | `/time-offs?from=&to=` |
| POST | `/time-offs` |
| DELETE | `/time-offs/:id` |

### Yozuvlar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/bookings?date=2026-08-05` | Bir kunlik (kalendar ko'rinishi) |
| GET | `/bookings?from=&to=&status=&masterId=` | Ro'yxat, filtr bilan |
| GET | `/bookings/:id` | Batafsil (mijoz telefoni bilan) |
| PATCH | `/bookings/:id/status` | `confirmed` / `cancelled` / `completed` / `no_show` |
| POST | `/bookings/manual` | Qo'lda yozuv qo'shish (telefon orqali kelgan mijoz) |

```jsonc
// PATCH /api/owner/bookings/:id/status
{ "status": "cancelled", "cancelReason": "Usta kasal bo'lib qoldi" }
```

> **`POST /bookings/manual` juda muhim.** Salonlarning 80% mijozi hali ham telefon qilib yoziladi. Egasi ularni tizimga qo'lda kiritmasa, jadval real emas va onlayn slotlar yolg'on chiqadi. Bu funksiya bo'lmasa platforma ishlamaydi.

### Statistika (oddiy)
| Metod | Yo'l | Qaytaradi |
|---|---|---|
| GET | `/stats` | Bugun/hafta/oy: yozuv soni, tasdiqlangan, bekor qilingan, jami summa |

---

## Admin — `/api/admin`

`auth` + `requireRole('admin')`

### Salonlar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/salons?status=pending` | Moderatsiya navbati |
| GET | `/salons/:id` | Batafsil |
| PATCH | `/salons/:id/status` | `active` / `blocked` / `pending` + `rejectReason` |
| PATCH | `/salons/:id/verify` | "Tasdiqlangan" belgisini yoqish |
| PATCH | `/salons/:id/top` | TOP ga chiqarish |
| PATCH | `/salons/:id/rating` | Reytingni qo'lda kiritish (v1) |
| DELETE | `/salons/:id` | O'chirish |

```jsonc
// PATCH /api/admin/salons/:id/top
{ "plan": "month", "amount": 150000, "note": "Naqd to'landi 30.07" }
// → isTop = true, topUntil = bugun + 30 kun, topOrders ga yozuv qo'shiladi
```

```jsonc
// TOP ni o'chirish
{ "plan": null }
```

### Kategoriyalar
| Metod | Yo'l |
|---|---|
| GET / POST | `/categories` |
| PUT / DELETE | `/categories/:id` |
| PATCH | `/categories/reorder` |

### Foydalanuvchilar
| Metod | Yo'l | Tavsif |
|---|---|---|
| GET | `/users?role=&q=&page=` | Ro'yxat |
| PATCH | `/users/:id/status` | Blok / aktiv |
| PATCH | `/users/:id/password` | **Parolni tiklash** (SMS yo'q — shuning uchun kerak) |
| PATCH | `/users/:id/role` | Rolni o'zgartirish |

### Yozuvlar va statistika
| Metod | Yo'l |
|---|---|
| GET | `/bookings?from=&to=&status=&salon=` |
| GET | `/stats` |
| GET | `/top-orders` |

`GET /api/admin/stats` qaytaradi:
```jsonc
{ "users": { "total": 1240, "clients": 1180, "owners": 58 },
  "salons": { "total": 62, "active": 51, "pending": 8, "blocked": 3, "top": 6 },
  "bookings": { "today": 34, "week": 210, "month": 870,
                "byStatus": { "pending": 12, "confirmed": 18, "completed": 780, "cancelled": 60 } },
  "revenue": { "topOrdersMonth": 900000 } }
```

---

## Rasm yuklash

```
POST /api/owner/salon/images
Content-Type: multipart/form-data
field: images (max 10 fayl)
```

Server: `sharp` bilan 2 o'lchamda saqlaydi —
- `full` — max eni 1600px, webp, quality 80
- `thumb` — 400×300, webp

Javob: `{ "data": ["salon-65f-1722345.webp", ...] }`
URL: `https://domen.uz/uploads/salons/salon-65f-1722345.webp`

---

## Xato kodlari to'liq ro'yxati

| Kod | HTTP | Ma'nosi |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Zod validatsiya xatosi (`errors` massivi bilan) |
| `INVALID_CREDENTIALS` | 401 | Telefon yoki parol xato |
| `TOKEN_EXPIRED` | 401 | Access token muddati tugagan → refresh qilish |
| `FORBIDDEN` | 403 | Rol yetarli emas |
| `NOT_OWNER` | 403 | Bu salon sizga tegishli emas |
| `NOT_FOUND` | 404 | — |
| `PHONE_TAKEN` | 409 | Telefon band |
| `SLOT_TAKEN` | 409 | Vaqt band qilingan |
| `DUPLICATE_BOOKING` | 409 | Shu kunda shu salonda yozuvingiz bor |
| `HAS_ACTIVE_BOOKINGS` | 409 | O'chirib bo'lmaydi — faol yozuvlar bor |
| `TOO_MANY_ACTIVE` | 429 | 5 tadan ko'p faol yozuv |
| `RATE_LIMITED` | 429 | Juda ko'p so'rov |
| `SERVER_ERROR` | 500 | — |
