# 06 — Ish rejasi (5 hafta)

Budjet: **$2 000 – 2 200** · Muddat: **6–7 hafta** · Hajm: **~230 soat**

> Payme booking fee (5 000 so'm) qo'shilgani uchun 5 hafta → 7 haftaga uzaydi.
> 5-hafta: Payme Merchant API + hold logikasi · 6-hafta: production, refund, sayqallash · 7-hafta: deploy va topshirish.

---

## Hafta 0 — boshlashdan oldin (mijozdan olinadigan narsalar)

Bularsiz ish boshlanmaydi:

- [ ] Oldindan to'lov (50% = $1 000 – 1 100)
- [ ] Domen nomi va kimga tegishli ekani
- [ ] Logotip (SVG yoki PNG, shaffof fon)
- [ ] Kategoriyalar oxirgi ro'yxati (tasdiqlangan)
- [ ] Kamida 3 ta demo salon ma'lumoti (nom, xizmatlar, narxlar, rasmlar) — testlash uchun
- [ ] Kim admin bo'ladi (telefon raqami)

---

## Hafta 1 — Poydevor

**Backend**
- [ ] Repo, papka strukturasi, ESLint + Prettier
- [ ] MongoDB ulanish, `.env` + zod validatsiya
- [ ] Barcha modellar (`User`, `Category`, `Salon`, `Master`, `Service`, `TimeOff`, `Booking`, `TopOrder`)
- [ ] Indekslar (ayniqsa booking unique partial index)
- [ ] Auth: register / login / refresh / me / change-password
- [ ] Middleware: `auth`, `requireRole`, `validate`, `errorHandler`, `rateLimit`
- [ ] Seed skript (admin + 12 kategoriya + demo ma'lumot)
- [ ] `utils/time.js` + unit testlar

**Frontend**
- [ ] Vite + Tailwind + Router + Query setup
- [ ] Dizayn tizimi: `Button`, `Input`, `Select`, `Modal`, `Badge`, `Card`, `Skeleton`, `Toast`
- [ ] Layout: Header, Footer, MobileNav
- [ ] `api/client.js` + refresh interceptor
- [ ] `authStore`, `ProtectedRoute`, `RoleRoute`
- [ ] Kirish va Ro'yxatdan o'tish sahifalari

**Hafta oxiri natijasi:** ro'yxatdan o'tish va kirish ishlaydi, dizayn tizimi tayyor.

---

## Hafta 2 — Katalog

**Backend**
- [ ] `GET /categories`, `/cities`
- [ ] `GET /salons` — filtr, saralash, pagination, `isTop` birinchi
- [ ] `GET /salons/:slug` — to'liq profil (xizmat + usta + jadval)
- [ ] `GET /masters`, `/masters/:id`
- [ ] `GET /search`
- [ ] Rasm yuklash (multer + sharp, 2 o'lcham)
- [ ] Owner: salon CRUD, xizmat CRUD, usta CRUD

**Frontend**
- [ ] Bosh sahifa (hero, qidiruv, kategoriyalar, TOP salonlar, ishonch bloki)
- [ ] Kategoriya sahifasi
- [ ] Salonlar ro'yxati + filtr paneli (URL params bilan)
- [ ] Salon profili sahifasi
- [ ] Mutaxassis profili sahifasi
- [ ] Qidiruv sahifasi (debounce bilan)

**Hafta oxiri natijasi:** katalogni to'liq ko'rib, qidirib, filtrlash mumkin.

---

## Hafta 3 — Booking dvijogi ⭐

Eng muhim va eng xatarli hafta. Boshqa ishga chalg'imaslik kerak.

**Backend**
- [ ] `schedule.service.js` — `getWorkingIntervals`, `applyTimeOffs`, `subtractMany`
- [ ] `booking.service.js` — `getAvailableSlots`
- [ ] `getMonthAvailability` (bir oy, 4 ta so'rov)
- [ ] `GET /availability`, `GET /availability/days`
- [ ] `POST /bookings` — ikki qatlamli himoya
- [ ] `GET /bookings/my`, `PATCH /bookings/my/:id/cancel`
- [ ] Owner: `PUT /schedule`, `time-offs` CRUD
- [ ] Owner: `GET /bookings`, `PATCH /bookings/:id/status`, `POST /bookings/manual`
- [ ] **04-booking-algoritmi.md dagi 14 ta test holatini yozish va o'tkazish**

**Frontend**
- [ ] `Calendar` komponenti (ochiq/yopiq kunlar, slot soni badge)
- [ ] `SlotPicker` + `SlotGrid`
- [ ] Band qilish wizard (4 qadam)
- [ ] Tasdiq sahifasi (kod bilan)
- [ ] Mijoz kabineti: yozuvlarim, bekor qilish

**Hafta oxiri natijasi:** to'liq oqim ishlaydi — egasi jadval kiritadi, mijoz band qiladi, slot yo'qoladi.

> ⚠️ Bu haftada kechikish bo'lsa, dizayn sifatidan yoki admin paneldan qisqartirish kerak — booking dvijogidan **hech qachon** emas.

---

## Hafta 4 — Kabinetlar

**Backend**
- [ ] Owner: `GET /stats`
- [ ] Admin: salonlar moderatsiyasi, `status`, `verify`
- [ ] Admin: `PATCH /salons/:id/top` + `topOrders` yozuvi
- [ ] Admin: kategoriyalar CRUD, foydalanuvchilar, parolni tiklash
- [ ] Admin: `GET /stats`, `GET /bookings`
- [ ] Cron: `expireTop`, `autoComplete`

**Frontend**
- [ ] Salon egasi: dashboard, salon tahrirlash, rasm yuklash
- [ ] Salon egasi: xizmatlar sahifasi
- [ ] Salon egasi: mutaxassislar sahifasi
- [ ] Salon egasi: **ish vaqti jadvali** ("hamma kunga qo'llash" tugmasi bilan)
- [ ] Salon egasi: dam olish kunlari
- [ ] Salon egasi: **yozuvlar** (desktop kalendar + mobil ro'yxat) + qo'lda yozuv modali
- [ ] Salon egasi: statistika
- [ ] Admin: 6 ta sahifa

**Hafta oxiri natijasi:** uchta rol ham to'liq ishlaydi.

---

## Hafta 5 — Sayqallash va ishga tushirish

- [ ] Mobil responsive to'liq tekshiruv (iPhone SE, iPhone 14, Android, planshet)
- [ ] Barcha bo'sh holat / loading / xato holatlari
- [ ] Xato xabarlari o'zbek tilida, tushunarli
- [ ] SEO minimum: `title`, `description`, Open Graph, `sitemap.xml`, `robots.txt`
- [ ] Tezlik: rasm lazy load, `React.lazy` route splitting, Lighthouse ≥ 85
- [ ] Xavfsizlik tekshiruvi: `owner` boshqa salonga tegishli ma'lumotni ola olmasligi
- [ ] VPS sozlash: Nginx, PM2, SSL, MongoDB backup (kunlik cron)
- [ ] Domen ulash, DNS
- [ ] Production seed: kategoriyalar + admin
- [ ] **Mijozga o'qitish**: salon egasi uchun 1 sahifalik qo'llanma + 10 daqiqalik video
- [ ] Topshirish, repo va kirish ma'lumotlarini berish
- [ ] Qolgan to'lov (50%)
- [ ] Payme production ulanishi tasdiqlangan

---

## Topshirish sharti (Definition of Done)

Loyiha quyidagilar bajarilganda topshirilgan hisoblanadi:

| # | Shart |
|---|---|
| 1 | Salon egasi ro'yxatdan o'tib, salon yaratib, admin tasdiqlagandan keyin katalogda ko'rinadi |
| 2 | Salon egasi hafta jadvalini, tanaffusni va dam olish kunlarini kiritadi |
| 3 | Salon egasi xizmat qo'shadi — nom, narx, **davomiylik** |
| 4 | Mijoz kategoriya orqali salonni topadi, xizmat tanlaydi, bo'sh vaqtni ko'radi |
| 5 | Mijoz band qiladi → yozuv `pending` holatda egasi kabinetiga tushadi |
| 6 | O'sha vaqt boshqa mijozga **ko'rinmaydi** |
| 7 | Egasi tasdiqlaydi/bekor qiladi; bekor qilinganda vaqt **qaytadan bo'shaydi** |
| 8 | Egasi telefon orqali kelgan mijozni qo'lda kiritadi, u ham slotni band qiladi |
| 9 | Mijoz o'z yozuvlarini ko'radi va 2 soatdan ko'p qolganda bekor qila oladi |
| 10 | Admin salonni TOP qiladi — u katalogda birinchi chiqadi va muddat tugagach avtomatik tushadi |
| 11 | Hammasi telefonda normal ishlaydi (360px kenglikda buzilmaydi) |
| 12 | 14 ta booking test holati o'tadi |
| 13 | Sayt domenda, HTTPS bilan ishlaydi, kunlik backup sozlangan |

---

## Xatarlar va ularni kamaytirish

| Xatar | Ehtimol | Nima qilamiz |
|---|---|---|
| **Mijoz yangi funksiya so'raydi** ("chat qo'shing", "Payme ham bo'lsin") | Yuqori | Shartnomada v1/v2 ro'yxati aniq yozilgan. Yangi so'rov = alohida narx va muddat |
| **Booking logikasi kutilganidan murakkab chiqadi** | O'rta | Hafta 3 butunlay shunga ajratilgan. Kechiksa — admin panel soddalashadi |
| **Salon egalari jadvalni to'ldirmaydi** | **Juda yuqori** | Bu texnik emas, biznes xatari. Yechim: sodda jadval UI + "hamma kunga qo'llash" + qo'llanma. Mijozga oldindan aytilishi kerak |
| **Rasmlar server joyini to'ldiradi** | O'rta | `sharp` bilan webp + o'lcham cheklovi (max 10 rasm/salon) |
| **Mijoz kontentni (rasm, matn) o'z vaqtida bermaydi** | Yuqori | Hafta 0 ro'yxati. Kontent kelmasa — demo ma'lumot bilan topshiriladi |
| **Parolni yo'qotgan salon egalari** | O'rta | Admin paneldan parol tiklash tayyor. SMS v2 da |

---

## Topshirilgandan keyin

**1 oy bepul qo'llab-quvvatlash** — faqat quyidagilar:
- ✅ Xatolarni (bug) tuzatish
- ✅ Server bilan bog'liq muammolar
- ✅ Savollarga javob, konsultatsiya

Kirmaydi:
- ❌ Yangi funksiya
- ❌ Dizaynni o'zgartirish
- ❌ Kontent kiritish, salon qo'shish

**v2 uchun tayyor asos:** SMS OTP (`users.phone` allaqachon normallashtirilgan), Payme (`topOrders` sxemasi tayyor), mobil ilova (REST API o'zgarmaydi), sharhlar (`rating`/`reviewCount` maydonlari bor), geolokatsiya (`salons` ga GeoJSON qo'shiladi). Shu sababli v2 nolga qaytish emas — qo'shish bo'ladi.
