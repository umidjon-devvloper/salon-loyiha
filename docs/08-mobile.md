# 08 — Mobil ilova (React Native + Expo)

## Asosiy qaror: ilova faqat MIJOZ uchun

| Rol | Qayerdan ishlaydi |
|---|---|
| **Mijoz** | Mobil ilova + web |
| **Salon egasi** | ❌ Faqat web (responsive, telefonda ham ishlaydi) |
| **Admin** | ❌ Faqat web |

**Sabab:** salon egasi kabineti — jadval tahrirlash, xizmat narxlari, yozuvlar kalendari. Bularni mobil ilovada qayta yozish ~90 soat qo'shadi, lekin egasi baribir kuniga bir-ikki marta kiradi va responsive web yetarli. Mijoz esa kuniga bir necha marta ochadi — unga ilova kerak.

> Agar keyinchalik egasi uchun ham ilova kerak bo'lsa, alohida bosqich sifatida qo'shiladi. API o'zgarmaydi.

---

## Texnologiyalar

| | |
|---|---|
| **Framework** | React Native + Expo (managed workflow) |
| **Routing** | Expo Router (file-based) |
| **Styling** | **NativeWind** — Tailwind sintaksisi RN da |
| **Server state** | TanStack Query (web bilan bir xil) |
| **Auth state** | Zustand + `expo-secure-store` |
| **Formalar** | react-hook-form + zod (web bilan bir xil) |
| **Rasm** | `expo-image` (kesh bilan) |
| **To'lov** | `expo-web-browser` → Payme checkout |
| **Sana** | date-fns |
| **Build** | EAS Build (Expo Application Services) |

> **NativeWind tanlanishining sababi:** `tailwind.config.js` webdan ko'chiriladi — brand ranglar, radiuslar, spacing bir xil bo'ladi. Dizayn tizimini ikki marta yozish shart emas.

---

## Kod ulashish (monorepo)

Web va mobil orasida **aynan bir xil** bo'ladigan kod bor: API client, tiplar, zod sxemalar, vaqt utilitalari, narx formatlash. Ularni ikki marta yozish = ikki marta xato tuzatish.

```
gozal-ayol/
├── package.json              # pnpm workspaces
├── apps/
│   ├── api/                  # Node.js backend
│   ├── web/                  # Vite + React
│   └── mobile/               # Expo
└── packages/
    └── shared/
        ├── api/              # axios client + barcha endpoint funksiyalari
        ├── schemas/          # zod sxemalar (backend bilan ham bir xil)
        ├── types/            # TypeScript tiplar
        └── utils/
            ├── time.js       # toMin, toHHMM, weekdayOf, addDays
            └── format.js     # narx, telefon, sana formatlash
```

**Muhim:** `packages/shared/api` da platformaga bog'liq kod bo'lmasin. Token saqlash turli xil (`localStorage` vs `SecureStore`), shuning uchun u **inject qilinadi**:

```js
// packages/shared/api/client.js
export function createApiClient({ baseURL, getToken, onTokenExpired }) {
  const client = axios.create({ baseURL });
  client.interceptors.request.use(async (config) => {
    const token = await getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  // ... refresh logikasi
  return client;
}
```

```js
// apps/mobile — SecureStore bilan
const api = createApiClient({
  baseURL: API_URL,
  getToken: () => SecureStore.getItemAsync('accessToken'),
  onTokenExpired: () => router.replace('/kirish'),
});
```

> Monorepo qo'shish ~1 kunlik sozlash, lekin `time.js` va API qatlamini ikki joyda saqlashdan ko'ra arzon. Agar monorepo qilinmasa, `shared` ni alohida npm paket qilib chiqarish ham mumkin.

---

## Ekranlar tuzilishi

```
apps/mobile/app/
├── (auth)/
│   ├── kirish.jsx
│   └── royxat.jsx
├── (tabs)/
│   ├── _layout.jsx              # pastdagi tab bar
│   ├── index.jsx                # 🏠 Bosh sahifa
│   ├── qidiruv.jsx              # 🔍 Qidiruv + filtrlar
│   ├── sevimlilar.jsx           # ♡ Sevimlilar
│   ├── yozuvlarim.jsx           # 📋 Mening yozuvlarim
│   └── profil.jsx               # 👤 Profil
├── kategoriya/[slug].jsx
├── salon/[slug].jsx
├── mutaxassis/[id].jsx
├── band-qilish/
│   ├── [masterId].jsx           # 4 qadamli wizard
│   ├── tolov.jsx                # Payme WebView
│   └── tasdiq/[code].jsx
├── sozlamalar/
│   ├── index.jsx
│   ├── parol.jsx
│   └── hisobni-ochirish.jsx     # ⚠️ Apple talabi, pastga qarang
└── _layout.jsx
```

**Pastdagi tab bar (5 ta):** Bosh sahifa · Qidiruv · Sevimlilar · Yozuvlarim · Profil

> Yuborilgan maketda "Xabarlar" tabi bor edi — chat v2 da bo'lgani uchun uning o'rniga **Yozuvlarim** qo'yildi.

### Bosh sahifa tarkibi (maketga muvofiq)

1. Yuqorida: avatar + shahar tanlash (`Toshkent ▾`) + bildirishnoma ikonkasi
2. Banner ("O'z go'zalligingizni biz bilan kashf eting")
3. Qidiruv paneli
4. Kategoriyalar gridi (3 ustun)
5. Mashhur xizmatlar (gorizontal skroll)
6. Tavsiya etamiz — TOP salonlar

---

## Web bilan farqlar

| | Web | Mobil |
|---|---|---|
| Token saqlash | `localStorage` | `expo-secure-store` (shifrlangan) |
| Navigatsiya | React Router | Expo Router |
| Rasm | `<img loading="lazy">` | `expo-image` (disk kesh) |
| Slot tanlash | Grid (6 ustun) | Gorizontal skroll + grid (3 ustun) |
| Kalendar | Oylik grid | Gorizontal kunlar lentasi + oylik modal |
| To'lov | Redirect | `expo-web-browser` sessiyasi |
| Filtr | Yon panel | Pastdan chiqadigan bottom sheet |
| Chiqish (back) | Brauzer tugmasi | Android hardware back tugmasi ham |

---

## Payme to'lovi mobil ilovada

```
1. POST /api/bookings → status 'awaiting_payment', holdUntil = +15 daq
2. Backend Payme checkout URL qaytaradi
3. WebBrowser.openAuthSessionAsync(checkoutUrl, 'gozalayol://tolov/qaytish')
4. Mijoz Payme ilovasida yoki brauzerda to'laydi
5. Deep link orqali ilovaga qaytadi
6. ⚠️ ILOVA QAYTGANIGA ISHONILMAYDI — backenddan holat so'raladi:
   GET /api/bookings/my/:id → status 'pending' bo'lsa to'langan
7. 'awaiting_payment' bo'lsa: har 2 sekundda qayta so'raladi (max 30 sek)
```

**Nima uchun ishonilmaydi:** mijoz to'lamasdan ham brauzerni yopib ilovaga qaytishi mumkin. Yagona haqiqat manbai — Payme webhooki (`PerformTransaction`). Ilova faqat backend holatini o'qiydi.

`app.json` ga qo'shiladi:
```json
{ "expo": { "scheme": "gozalayol" } }
```

---

## Bildirishnomalar (v2 ga tayyor)

v1 da push **yo'q**, lekin arxitektura tayyorlanadi:

- `users` ga `pushTokens: [{ token, platform, deviceId, updatedAt }]` maydoni qo'shiladi
- Ilova ishga tushganda `expo-notifications` tokenini oladi va `POST /api/auth/push-token` ga yuboradi
- Backend v2 da Expo Push API orqali yuboradi

**v2 da yuboriladigan bildirishnomalar:** yozuv tasdiqlandi · yozuvdan 2 soat oldin eslatma · salon bekor qildi · to'lov muvaffaqiyatli

---

## Store talablari (e'tibor bering)

### Apple App Store

| Talab | Izoh |
|---|---|
| Apple Developer | $99/yil |
| **Hisobni o'chirish funksiyasi** | ⚠️ **Majburiy.** Ro'yxatdan o'tish bo'lgan ilovada foydalanuvchi hisobini **ilova ichidan** o'chira olishi shart. Yo'q bo'lsa ilova rad etiladi |
| Maxfiylik siyosati URL | Majburiy |
| Privacy Nutrition Labels | Qanday ma'lumot yig'ilishini e'lon qilish |
| Ko'rib chiqish | Odatda 1–3 kun, rad etilsa qayta yuborish |

> Hisobni o'chirish uchun backendga ham endpoint kerak: `DELETE /api/auth/me` — foydalanuvchi anonimlashtiriladi, faol yozuvlari bekor qilinadi, lekin buxgalteriya uchun tranzaksiyalar saqlanadi.

### Google Play

| Talab | Izoh |
|---|---|
| Developer akkaunt | $25 (bir marta) |
| Data Safety formasi | Majburiy |
| Maxfiylik siyosati URL | Majburiy |
| Target SDK | Google har yili minimal versiyani oshiradi |

> Ikkala do'kon ham **ilova ichida to'lov** bo'lsa e'tibor beradi. Bizda to'lov jismoniy xizmat uchun (salon xizmati) — bu Apple'ning IAP talabiga kirmaydi, tashqi to'lov tizimi ruxsat etiladi. Lekin ariza tavsifida buni aniq yozish kerak.

---

## Backendga qo'shiladigan o'zgarishlar

Mobil ilova uchun API deyarli o'zgarmaydi. Faqat:

| Endpoint | Nima uchun |
|---|---|
| `POST /api/auth/push-token` | Push tokenni saqlash (v2 uchun, hozir bo'sh turadi) |
| `DELETE /api/auth/me` | Apple talabi — hisobni o'chirish |
| `GET /api/app/version` | Majburiy yangilanish tekshiruvi (`minVersion`, `latestVersion`, `updateUrl`) |

> `GET /api/app/version` — ilova ochilganda tekshiradi. Eski versiya bo'lsa "Yangilash" ekranini ko'rsatadi. Buni boshidan qo'ymasangiz, keyin eski versiyalarni to'xtata olmaysiz.

---

## Baholash va bosqichlar

| Modul | Soat |
|---|---|
| Monorepo, `shared` paket, Expo setup, NativeWind, navigatsiya | 35 |
| Auth ekranlari + SecureStore | 15 |
| Bosh sahifa, kategoriyalar, qidiruv, filtrlar | 40 |
| Salon va mutaxassis ekranlari | 25 |
| Band qilish wizard + mobil slot picker | 45 |
| Payme WebView + deep link + holat tekshiruvi | 15 |
| Yozuvlarim, bekor qilish, sevimlilar | 20 |
| Profil, sozlamalar, hisobni o'chirish | 15 |
| iOS va Android qurilmalarda test | 25 |
| EAS build, ikkala do'konga chiqarish | 25 |
| **JAMI** | **~260 soat** |

### Bosqichlash

✅ **Qaror: mobil ilova React Native + Expo da yoziladi.** PWA varianti ko'rib chiqilmaydi.

| Variant | Nima | Qo'shimcha narx | Umumiy muddat |
|---|---|---|---|
| **B. Ketma-ket** ← rejadagi | v1 web topshiriladi (7 hafta), keyin ilova alohida bosqich | +$2 000–2 400 | 7 + 6–7 hafta |
| **C. Birga** | Web va ilova parallel | +$2 000–2 400 | 11–13 hafta |

**Umumiy loyiha:** web $2 000–2 200 + ilova $2 000–2 400 = **$4 000 – 4 600**

---

## v1 da MAJBURIY bo'lib qolgan ishlar

Ilova qaror qilingani uchun quyidagilar v1 web bosqichida bajariladi. Keyin qo'shish qimmat va og'riqli:

| # | Ish | Nima uchun hozir |
|---|---|---|
| 1 | **Monorepo** — `apps/api`, `apps/web`, `packages/shared` | Keyin ko'chirish = butun import daraxtini qayta yozish |
| 2 | **`packages/shared`** — API client (token inject qilinadigan), `time.js`, `format.js`, zod sxemalar | Ikki marta yozilsa, xatolar ham ikki joyda tuzatiladi |
| 3 | **Dizayn tokenlari alohida faylda** (`packages/shared/theme.js`) | NativeWind webdagi `tailwind.config.js` ni o'qiydi — ranglar va radiuslar bir joyda turishi kerak |
| 4 | `POST /api/auth/push-token` | v1 da bo'sh turadi, ilovada ishlaydi |
| 5 | `DELETE /api/auth/me` | ⚠️ Apple talabi — hisobni ilova ichidan o'chirish |
| 6 | `GET /api/app/version` | Majburiy yangilanish tekshiruvi. Boshidan bo'lmasa, eski versiyalarni to'xtata olmaysiz |
| 7 | `users.pushTokens` maydoni | Migratsiya qilmaslik uchun |

> Bu ettitasi jami ~10–12 soat qo'shadi (asosan monorepo sozlash). Keyin qilinsa 40+ soat.
