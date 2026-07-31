# PROJECT CONTEXT — Go'zal Ayol

> Bu fayl loyihaning yagona ma'lumot manbasi. Har bir yangi chat shu fayldan kontekst oladi.
> Oxirgi yangilanish: 2026-07-30

---

## 1. Loyiha nima

Go'zallik salonlari va mutaxassislar uchun **onlayn band qilish (booking) platformasi**. Bozor: O'zbekiston, Toshkent. Til: o'zbek.

**Asosiy qiymat:** salon egasi ish vaqtini bir marta kiritadi → tizim bo'sh vaqtlarni avtomatik hisoblaydi → mijoz onlayn band qiladi → o'sha vaqt boshqalarga ko'rinmaydi.

**Foydalanuvchi auditoriyasi:** ayollar (manikyur, kosmetologiya, soch, massaj va h.k.). Dizayn pushti (pink) palitrada, mobile-first — foydalanuvchilarning 85%+ telefondan kiradi.

**Daromad modeli:**
1. **Band qilish to'lovi (booking fee)** — mijoz slotni band qilish uchun Payme orqali to'laydi. **Pul har doim platformada (MCHJ hisobida) qoladi**, salonga o'tkazilmaydi. Bu komissiya, avans emas
2. **TOP e'lon** — salon katalogda birinchi chiqishi uchun to'laydi (v1 da admin qo'lda yoqadi)

> **Qaror: booking fee = 5 000 so'm, qat'iy summa** (`mode: 'fixed'`, `fixedAmount: 5000`). Foiz rejimi kodda bor, lekin ishlatilmaydi.
> Booking fee **admin panelda sozlanadi** — bozor reaksiyasiga qarab raqam o'zgaradi, har safar kod o'zgartirilmasin.
> ⚠️ Biznes xatari: qat'iy 5 000 so'm arzon xizmatga (masalan 50 000 so'mlik manikyur) 10% ga teng, qimmat xizmatga (500 000 so'm) 1% ga. Mijoz shuni bilib qo'ysin.

---

## 2. Kim kim

| | |
|---|---|
| **Ishlab chiquvchi** | Umidjon — freelance, mijoz bilan oylik shartnoma asosida ishlaydi (har oy bitta ilova) |
| **Mijoz** | MCHJ (yuridik shaxs mavjud) |
| **Muloqot tili** | O'zbek. Kod, o'zgaruvchi nomlari, commit — ingliz |

---

## 3. Kommersial shartlar (kelishilgan)

| | |
|---|---|
| **Narx** | $2 000 – 2 200 (v1 + Payme booking fee). Settlement moduli kerak emasligi uchun dastlabki $2 200–2 400 dan tushirildi |
| **Framing** | Mijozga $1 800 → $1 500 ko'rinishida taqdim etilgan edi (Paymesiz v1 uchun). Payme qo'shilgach narx qayta kelishildi |
| **To'lov** | 50% oldindan (majburiy, muzokara qilinmaydi), 50% topshirishda |
| **Muddat** | 6–7 hafta |
| **Qo'llab-quvvatlash** | Topshirilgandan keyin 1 oy bepul — faqat bug fix va server muammolari. Yangi funksiya, dizayn o'zgarishi, kontent kiritish kirmaydi |

**Chegirma qoidasi:** chegirma har doim sabab bilan beriladi ("birinchi hamkorlik uchun", "portfolio sharti bilan"). Sababsiz chegirma mijozga "yana tushirsa bo'ladi" degan signal beradi.

---

## 4. Texnologiyalar

**Backend:** Node.js 20 + Express 4 · MongoDB 7 + Mongoose 8 · JWT (access+refresh) + bcrypt · Zod · Multer + Sharp · PM2 + Nginx

**Frontend:** Vite + React 18 · Tailwind CSS · React Router v6 · TanStack Query · Zustand · react-hook-form + zod · date-fns

**Infra:** VPS Ubuntu 22.04 · Nginx reverse proxy · Let's Encrypt · rasmlar server diskida `/uploads`

**Mobil ilova (React Native + Expo):** ✅ **Qaror qilingan** — batafsil `08-mobile.md`. Faqat **mijoz** uchun (salon egasi va admin webdan ishlaydi). ~260 soat, +$2 000–2 400. Bosqichlash: v1 web topshirilgach alohida bosqich.

**Umumiy loyiha:** web $2 000–2 200 + ilova $2 000–2 400 = **$4 000 – 4 600**

**Kod strukturasi — monorepo (v1 dan boshlab, MAJBURIY):**
```
apps/api · apps/web · apps/mobile (keyingi bosqich)
packages/shared/{api, schemas, types, utils, theme}
```
> `time.js`, API client, zod sxemalar, dizayn tokenlari — web va mobil uchun bir xil.
> v1 da `shared` ga qo'yilsa ~10–12 soat. Keyin ko'chirilsa 40+ soat.

---

## 5. v1 hajmi (SCOPE) — qat'iy

### ✅ Kiradi

1. **Auth** — telefon (`+998XXXXXXXXX`) + parol, JWT. **SMS OTP YO'Q**
2. **Katalog** — 12 kategoriya, salonlar, mutaxassislar, xizmatlar va narxlar
3. **Qidiruv va filtr** — kategoriya, shahar/tuman, narx oralig'i, saralash
4. **Salon egasi kabineti** — profil, xizmatlar, ustalar, ish vaqti jadvali, dam olish kunlari
5. **Booking dvijogi** — avtomatik slot generatsiyasi, band vaqt bloklanadi
6. **Mijoz kabineti** — band qilish, yozuvlarim, bekor qilish
7. **Admin panel** — salon moderatsiyasi, kategoriyalar, TOP e'lonni qo'lda yoqish
8. **Payme booking fee** — mijoz band qilish uchun to'laydi, pul platformada qoladi. Miqdori admin panelda sozlanadi (foiz yoki qat'iy summa)
9. **Responsive** — 360px dan desktopgacha
10. **Mobil ilovaga tayyorgarlik (majburiy)** — monorepo + `packages/shared`, `POST /auth/push-token`, `DELETE /auth/me` (⚠️ Apple talabi: hisobni ilova ichidan o'chirish), `GET /app/version` (majburiy yangilanish), `users.pushTokens` maydoni

### ❌ Kirmaydi (v2)

SMS OTP · React Native mobil ilova · Push bildirishnoma · Ichki chat · Sharh va reyting tizimi (v1 da reytingni admin qo'lda kiritadi) · Geolokatsiya/GPS/masofa (v1 da tuman filtri yetarli) · Ko'p tillilik (baza `{uz, ru}` ga tayyor, lekin interfeys faqat o'zbekcha)

> ⚠️ **Bu ro'yxat muzokara qilinmaydi.** Mijozdan yangi so'rov kelsa → alohida narx va muddat. Shartnomada shu ro'yxat yozilgan bo'lishi kerak.

---

## 6. Asosiy arxitektura qarorlari (o'zgartirilmaydi)

| Qaror | Sabab |
|---|---|
| **Vaqt: `date` string (`'2026-08-05'`) + `startMin` integer (`570` = 09:30)** | `Date` obyekti ishlatilmaydi. Timezone muammosini butunlay yo'q qiladi. Platforma faqat `Asia/Tashkent` (UTC+5) |
| **Slotlar bazada saqlanmaydi, so'rov paytida hisoblanadi** | Ish vaqti − tanaffus − ta'til − band yozuvlar = qolgani bo'sh. Saqlash keraksiz va ish vaqti o'zgarganda hammasi eskiradi |
| **Booking `master` ga bog'lanadi, `salon` ga emas** | Salon yaratilganda avtomatik bitta "asosiy usta" yaratiladi. Shunda ustalar bo'linmagan salonda ham logika bir xil |
| **Xizmat narxi `price` + `priceTo` + `isPriceFrom`** | Bozorda "100 000 – 180 000 so'm" va "100 000 so'mdan" keng tarqalgan |
| **Booking `items` snapshot ko'rinishida saqlanadi** | Narx keyin o'zgarsa, eski yozuv o'zgarmaydi |
| **Parolni tiklash admin orqali** | SMS va email yo'q. Admin panelda parol tiklash tugmasi bor |
| **Frontend va admin bitta React loyihasida** | Alohida build v1 uchun keraksiz ish. Admin `/admin/*` route ostida |
| **Payme: Merchant API (Subscribe API emas)** | Karta ma'lumoti bizga tegmaydi, PCI DSS javobgarligi yo'q |

---

## 7. Ma'lumotlar modeli (qisqacha)

```
users ──1:1──▶ salons ──1:N──▶ masters ──1:N──▶ timeOffs
                  │                │
                  └──1:N──▶ services
                                   │
users(client) ──1:N──▶ bookings ◀──┘ ──1:N──▶ paymeTransactions
categories ────▶ salons.categories, services.category
salons ──1:N──▶ topOrders
```

**Kolleksiyalar:** `users`, `categories`, `salons`, `masters`, `services`, `timeOffs`, `bookings`, `topOrders`, `paymeTransactions`

**Rollar:** `client` · `owner` · `admin`

**Booking statuslari:**
`awaiting_payment` → `pending` → `confirmed` → `completed` / `cancelled` / `no_show`

**Salon statuslari:** `draft` → `pending` → `active` / `blocked`

**Kritik indeks:**
```js
bookingSchema.index(
  { master: 1, date: 1, startMin: 1 },
  { unique: true, partialFilterExpression: {
      status: { $in: ['awaiting_payment','pending','confirmed'] } } }
);
```

---

## 8. Booking algoritmi — asosiy qoida

```
BO'SH SLOTLAR = ISH VAQTI
              − tanaffuslar
              − timeOffs (ta'til, bayram)
              − band yozuvlar (awaiting_payment | pending | confirmed)
              − o'tib ketgan vaqt (bugun bo'lsa: hozir + 60 daqiqa)
```

**Diqqat qilinadigan nuqtalar:**
- `t + totalDuration <= interval.end` — xizmat ish vaqti **ichida tugashi** kerak
- Slotlar `SLOT_STEP_MIN` (15 daq) ga tekislanadi: 09:00, 09:15, 09:30
- `bufferMin` — xizmatdan keyingi tozalash vaqti, davomiylikka qo'shiladi
- Ustaning o'z jadvali bo'lsa u ishlatiladi, bo'lmasa salonniki
- `timeOff.master = null` → butun salon yopiq

**Ustma-ust yozuvdan himoya — ikki qatlam:**
1. `POST /bookings` ichida slot **qaytadan hisoblanadi** (frontenddan kelgan `startTime` ga ishonilmaydi)
2. Unique partial index — bir sekundda kelgan ikki so'rovni bloklaydi (`err.code === 11000` → `409 SLOT_TAKEN`)

---

## 9. Payme integratsiyasi (qisqacha)

**Merchant API** — Payme bizning webhookka POST yuboradi, biz javob qaytaramiz.

**Endpoint:** `POST /api/payme/callback`, Basic auth (`Paycom:PAYME_KEY`), JSON-RPC 2.0

**Metodlar:** `CheckPerformTransaction` · `CreateTransaction` · `PerformTransaction` · `CancelTransaction` · `CheckTransaction` · `GetStatement`

**Oqim:**
```
Mijoz slot tanlaydi → booking (awaiting_payment, holdUntil = +15 daq)
  → Payme checkout → PerformTransaction → booking (pending), bookingFee.status='paid'
  → to'lamasa: cron (har 2 daq) holdUntil o'tganini 'cancelled' qiladi → slot bo'shaydi
```

**Booking fee sozlamasi** (`settings` kolleksiyasi, admin panelda tahrirlanadi):
```js
bookingFee: {
  enabled:     true,
  mode:        'fixed',    // ✅ QAROR: qat'iy summa
  fixedAmount: 5000,       // ✅ QAROR: 5 000 so'm
  percent:     20,         // mode='percent' bo'lsa (hozir ishlatilmaydi)
  minAmount:   3000,
  maxAmount:   50000,
}
```

**Qaytarish (refund) qoidalari — taklif, mijoz tasdiqlashi kerak:**

| Holat | To'lov |
|---|---|
| Mijoz o'zi bekor qildi | ❌ Qaytarilmaydi (aynan shu no-show ni kamaytiradi) |
| Salon bekor qildi | ✅ To'liq qaytariladi (`CancelTransaction`) |
| Mijoz kelmadi (`no_show`) | ❌ Bizda qoladi |
| Texnik xato (ikki marta yechildi) | ✅ Qaytariladi |

**Uchta eng ko'p uchraydigan xato:**
1. **Summa tiyinda** — 30 000 so'm = `3000000`
2. **Idempotentlik** — takroriy `CreateTransaction`/`PerformTransaction` so'roviga birinchi javobning aynan o'zi qaytadi. Tranzaksiya bazada saqlanadi
3. **Hold 15 daqiqadan uzun bo'lmasin** — uzoq bo'lsa to'lamaydiganlar jadvalni to'sadi

**Xato xabari uch tilda:** `{ uz, ru, en }`

---

## 10. Kod konvensiyalari

- Papka strukturasi: `routes → controllers → services → models`. Biznes logika **services** da, controller faqat so'rov/javob
- Javob formati: `{ success, data, meta? }` / `{ success: false, message, code }`
- Xato kodlari string konstanta: `SLOT_TAKEN`, `PHONE_TAKEN`, `NOT_OWNER`, `VALIDATION_ERROR`...
- Har bir `/api/owner/*` so'rovda `salon.owner === req.user.id` tekshiruvi (middleware `ownerOfSalon`)
- Validatsiya: zod, `middleware/validate.js` orqali
- Frontend server state: TanStack Query. Auth: Zustand + localStorage. Filtrlar: URL search params
- Narx formati: `Intl.NumberFormat('uz-UZ')` → `100 000 so'm`
- Telefon: kirishda normallashtiriladi → `+998901234567`
- Xato xabarlari foydalanuvchiga **o'zbek tilida**, tushunarli

**Tailwind brand ranglari:** `brand.500 #F4407D` (asosiy), `brand.600 #DB2777` (tugma), `brand.700 #BE185D` (sarlavha). Kartochkalar `rounded-2xl`, tugmalar `rounded-xl`, `shadow-sm` + `border-brand-100`.

---

## 11. Biznes xatarlari (texnik emas)

| Xatar | Nima qilamiz |
|---|---|
| **Salon egalari jadvalni to'ldirmaydi** ← eng katta xatar | Jadval UI juda sodda + "dushanbani hamma kunga qo'llash" tugmasi + topshirishda 1 sahifalik qo'llanma va 10 daqiqalik video |
| **Telefon orqali kelgan mijozlar tizimga kirmaydi** | `POST /owner/bookings/manual` — qo'lda yozuv qo'shish. **Bu funksiyasiz platforma ishlamaydi**: jadval real bo'lmasa, onlayn slotlar yolg'on chiqadi |
| **Mijoz yangi funksiya so'raydi** | v1/v2 ro'yxati shartnomada. Yangi so'rov = alohida narx |
| **Mijoz kontentni (rasm, matn) bermaydi** | Hafta 0 ro'yxati. Kelmasa demo ma'lumot bilan topshiriladi |
| **Avansga ishonchsizlik** | Bazada salon kam bo'lsa, odam oldindan pul tashlamaydi. Salon soni to'plangunicha avans foizini past ushlash kerak |

---

## 12. Ochiq savollar

### ✅ Hal qilingan

- **Qo'lda yozuvda mijoz kim?** → `booking.client` **nullable** + `source: 'online' | 'manual'`.
  Telefon orqali kelgan mijozning akkaunti yo'q; aloqa uchun `clientName` va `clientPhone`
  har doim majburiy. Muqobil variant (har salonga soxta "telefon mijozi" foydalanuvchisi)
  bazani va admin statistikasini buzgani uchun rad etildi
- **Pul kimga tushadi?** → Platformaga (MCHJ hisobi). Salonga o'tkazilmaydi
- **Kim to'laydi?** → Mijoz (band qilayotgan odam)
- **Booking fee qancha?** → **5 000 so'm, qat'iy summa**
- **Refund qoidalari** → Mijoz bekor qilsa qaytmaydi · Salon bekor qilsa qaytadi · `no_show` da bizda qoladi
- **Settlement moduli kerakmi?** → Yo'q
- **Geolokatsiya?** → Yo'q, tuman filtri yetarli
- **SMS OTP?** → Yo'q, telefon + parol

### ⏳ Kodni to'xtatmaydi, lekin ishga tushirishdan oldin kerak

- [ ] **Ommaviy oferta va maxfiylik siyosati matni** — Payme talab qiladi. Refund qoidalari aynan shu yerda yozilishi kerak
- [ ] Payme Business'ga ariza berilsinmi? (shartnoma 1–2 hafta)
- [ ] Mijozga to'lov qanday tushuntiriladi — xizmat narxidan chegiriladimi yoki ustiga qo'shiladimi? Salon bilan kelishuvga bog'liq

> Oxirgi savol: 5 000 so'm xizmat narxidan chegirilsa salon shuncha kam oladi; ustiga qo'shilsa mijoz ortiqcha to'laydi. Mijoz shundan birini tanlab, salonlarga aniq aytishi kerak — aks holda nizo chiqadi.

**Mijozdan olinadigan boshqa narsalar:**
- [ ] Oldindan to'lov (50%)
- [ ] Domen nomi
- [ ] Logotip (SVG/PNG shaffof fon)
- [ ] Kamida 3 ta demo salon ma'lumoti (nom, xizmatlar, narxlar, rasmlar)
- [ ] Admin kim bo'ladi (telefon raqami)
- [ ] **Payme Business'ga ariza berilsin — hoziroq** (shartnoma 1–2 hafta oladi, parallel ketishi kerak)

---

## 13. Hozirgi holat

| Bosqich | Holat |
|---|---|
| Texnik hujjatlar (7 ta `.md` + CONTEXT) | ✅ Tayyor |
| Barcha arxitektura va biznes qarorlari | ✅ Qabul qilingan |
| Payme shartnomasi | ⏳ Mijoz ariza berishi kerak |
| Ommaviy oferta matni | ⏳ Mijozdan |
| 1-hafta — monorepo, modellar, auth, seed, dizayn tizimi | ✅ Tayyor |
| 2-hafta — katalog API + owner CRUD + katalog sahifalari | ✅ Tayyor |
| 3-hafta — booking dvijogi | 🔨 **Ishlanmoqda** |

**Keyingi qadam:** salon egasi jadvali (`PUT /owner/schedule`), dam olish kunlari,
kabinet yozuvlari va qo'lda yozuv; keyin frontend band qilish wizardi.

---

## 14. Ish rejasi (6–7 hafta)

| Hafta | Nima |
|---|---|
| 1 | Backend setup, modellar, indekslar, auth, seed · Frontend setup, dizayn tizimi, layout, kirish/ro'yxat |
| 2 | Katalog: salon/usta/xizmat CRUD, filtr, qidiruv · Bosh sahifa, ro'yxatlar, profil sahifalari |
| 3 | ⭐ **Booking dvijogi** — slot hisoblash, availability API, band qilish wizard, 14 ta test holati |
| 4 | Kabinetlar: salon egasi (jadval, yozuvlar, qo'lda yozuv) + admin panel + cron |
| 5 | Payme: Merchant API, hold logikasi, sandbox testlari |
| 6 | Payme production, refund, sayqallash, responsive tekshiruv |
| 7 | Deploy, SSL, backup, SEO minimum, mijozga o'qitish, topshirish |

> ⚠️ **3-hafta muqaddas.** Kechikish bo'lsa admin panel yoki dizayn qisqartiriladi, booking dvijogi hech qachon.

---

## 15. Topshirish sharti (Definition of Done)

1. Salon egasi ro'yxatdan o'tadi, salon yaratadi, admin tasdiqlaydi → katalogda ko'rinadi
2. Egasi hafta jadvalini, tanaffusni, dam olish kunlarini kiritadi
3. Egasi xizmat qo'shadi — nom, narx, **davomiylik**
4. Mijoz salonni topadi, xizmat tanlaydi, bo'sh vaqtni ko'radi
5. Mijoz band qilish to'lovini to'laydi → yozuv `pending` holatda egasiga tushadi, pul MCHJ hisobiga tushadi
6. O'sha vaqt boshqa mijozga **ko'rinmaydi**
7. Egasi tasdiqlaydi/bekor qiladi; bekor qilinganda vaqt **qaytadan bo'shaydi**
8. Egasi telefon orqali kelgan mijozni qo'lda kiritadi — u ham slotni band qiladi
9. To'lanmagan yozuv 15 daqiqadan keyin avtomatik bekor bo'ladi
10. Admin salonni TOP qiladi → katalogda birinchi, muddat tugagach avtomatik tushadi
11. 360px kenglikda hech narsa buzilmaydi
12. 14 ta booking test holati o'tadi
13. Payme sandbox testlari o'tadi, production ishlaydi
14. Sayt domenda, HTTPS, kunlik backup
