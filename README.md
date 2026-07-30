# Go'zal Ayol

Go'zallik salonlari va mutaxassislar uchun onlayn band qilish (booking) platformasi.
Bozor: O'zbekiston, Toshkent · Interfeys tili: o'zbek.

**Asosiy qiymat:** salon egasi ish vaqtini bir marta kiritadi → tizim bo'sh vaqtlarni
avtomatik hisoblaydi → mijoz onlayn band qiladi → o'sha vaqt boshqalarga ko'rinmaydi.

---

## Texnologiyalar

**Backend** — Node.js 20 · Express 4 · MongoDB 7 + Mongoose 8 · JWT (access + refresh) · bcrypt · Zod · Multer + Sharp · PM2 + Nginx

**Frontend** — Vite · React 18 · Tailwind CSS · React Router v6 · TanStack Query · Zustand · react-hook-form + zod · date-fns

**To'lov** — Payme Merchant API (booking fee)

**Infra** — VPS Ubuntu 22.04 · Nginx reverse proxy · Let's Encrypt SSL

---

## Struktura (monorepo)

```
apps/
  api/       # Node.js + Express backend
  web/       # Vite + React (mijoz, salon egasi kabineti, /admin)
  mobile/    # React Native + Expo (keyingi bosqich)
packages/
  shared/
    api/       # axios client (token inject qilinadi)
    schemas/   # zod sxemalar
    types/
    utils/     # time.js, format.js
    theme.js   # dizayn tokenlari (web + NativeWind uchun bir xil)
```

---

## v1 hajmi

| ✅ Kiradi | ❌ Kirmaydi (v2) |
|---|---|
| Auth (telefon + parol, JWT) | SMS OTP |
| Katalog: 12 kategoriya, salon, usta, xizmat | Mobil ilova (alohida bosqich) |
| Qidiruv va filtr (kategoriya, tuman, narx) | Push bildirishnoma |
| Salon egasi kabineti (jadval, xizmat, usta, dam olish) | Ichki chat |
| Booking dvijogi (avtomatik slot generatsiyasi) | Sharh va reyting tizimi |
| Mijoz kabineti (yozuvlarim, bekor qilish) | Geolokatsiya / GPS |
| Admin panel (moderatsiya, TOP e'lon) | Ko'p tillilik |
| Payme booking fee | |
| Responsive (360px → desktop) | |

---

## Asosiy arxitektura qarorlari

| Qaror | Sabab |
|---|---|
| Vaqt: `date` string `'2026-08-05'` + `startMin` integer (`570` = 09:30) | `Date` obyekti ishlatilmaydi — timezone muammosi butunlay yo'qoladi. Platforma faqat `Asia/Tashkent` |
| Slotlar bazada saqlanmaydi, so'rov paytida hisoblanadi | Ish vaqti − tanaffus − ta'til − band yozuvlar = qolgani bo'sh |
| Booking `master` ga bog'lanadi, `salon` ga emas | Salon yaratilganda avtomatik bitta "asosiy usta" yaratiladi — logika har doim bir xil |
| Booking `items` snapshot ko'rinishida | Narx keyin o'zgarsa, eski yozuv o'zgarmaydi |
| Payme: Merchant API (Subscribe API emas) | Karta ma'lumoti bizga tegmaydi, PCI DSS javobgarligi yo'q |
| Frontend va admin bitta React loyihasida | Admin `/admin/*` route ostida |

**Bo'sh slot formulasi:**

```
BO'SH SLOTLAR = ISH VAQTI
              − tanaffuslar
              − timeOffs (ta'til, bayram)
              − band yozuvlar (awaiting_payment | pending | confirmed)
              − o'tib ketgan vaqt (bugun bo'lsa: hozir + 60 daqiqa)
```

Ustma-ust yozuvdan **ikki qatlamli** himoya: `POST /bookings` ichida slot qaytadan
hisoblanadi + `{ master, date, startMin }` bo'yicha unique partial index.

---

## Ishga tushirish

```bash
pnpm install

cp apps/api/.env.example apps/api/.env   # o'z qiymatlaringizni yozing
pnpm --filter api seed                   # admin + 12 kategoriya

pnpm --filter api dev                    # http://localhost:5000
pnpm --filter web dev                    # http://localhost:5173
```

Talab: Node.js 20+, MongoDB 7+, pnpm 9+

---

## Kod konvensiyalari

- `routes → controllers → services → models`. Biznes logika **services** da
- Javob formati: `{ success, data, meta? }` / `{ success: false, message, code }`
- Xato kodlari string konstanta: `SLOT_TAKEN`, `PHONE_TAKEN`, `NOT_OWNER`, `VALIDATION_ERROR`
- Har bir `/api/owner/*` da `ownerOfSalon` middleware
- Validatsiya: zod, `middleware/validate.js` orqali
- Kod, o'zgaruvchi nomlari, commit — **ingliz tilida**
- Foydalanuvchiga ko'rinadigan matnlar — **o'zbek tilida**
- Commit format: `feat(booking): add slot generation service`

---

## Hujjatlar

Batafsil texnik hujjatlar `docs/` papkasida. `CONTEXT.md` — yagona ma'lumot manbai.
