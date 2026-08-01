# Go'zal Ayol — mobil ilova

React Native + Expo. **Mijoz va salon egasi uchun** (admin faqat webda).

## Ishga tushirish

```bash
pnpm install            # repo ildizida
cd apps/mobile
pnpm start              # keyin telefonda Expo Go orqali QR skanerlanadi
```

`app.json` → `extra.apiUrl` ni lokal API'ga qarating:
`http://<kompyuter-IP>:5000/api` (localhost telefon uchun ishlamaydi).

## Nima umumiy, nima alohida

`packages/shared` dan olinadi — ikki marta yozilmaydi:

| | |
|---|---|
| API klient | `shared/api/client.js` (token injekt qilinadi) |
| Endpointlar | `shared/api/endpoints.js` |
| Vaqt utilitalari | `toMin`, `toHHMM`, `weekdayOf`, `addDays` |
| Kalendar gridi | `shared/utils/calendar.js` |
| Narx formati | `formatPrice`, `formatServicePrice` |
| Zod sxemalari | `shared/schemas/*` |
| Dizayn tokenlari | `shared/theme.js` → `tailwind.config.js` |

Alohida:

| | Web | Mobil |
|---|---|---|
| Token saqlash | localStorage | `expo-secure-store` (shifrlangan) |
| Navigatsiya | React Router | Expo Router |
| Rasm | `<img loading="lazy">` | `expo-image` (disk kesh) |
| To'lov | Redirect | `expo-web-browser` sessiyasi |

## Salon egasi qismi — nima ilovada, nima webda

| Ilovada (kunlik ish) | Faqat webda |
|---|---|
| Yozuvlar ro'yxati, kun bo'yicha | Ish vaqti jadvali |
| Tasdiqlash / bekor qilish / yakunlash | Xizmat va narxlar |
| Qo'lda yozuv | Salon profili, rasmlar |
| | Mutaxassislar, statistika |

Sabab: egasi yozuvlarni kuniga bir necha marta ko'radi — bu telefonda kerak.
Jadvalni esa oyiga bir marta, o'tirib to'ldiradi — katta ekran qulayroq.

## Holat

- [x] Expo + Router + NativeWind + monorepo
- [x] Auth store (SecureStore), API klient
- [x] Tab navigatsiya, bosh sahifa, kategoriyalar, salon kartochkasi
- [x] Kirish / ro'yxatdan o'tish ekranlari, UI primitivlari
- [x] Qidiruv, katalog va filtr (bottom sheet)
- [x] Salon, kategoriya va mutaxassis ekranlari
- [x] Band qilish oqimi (2 qadam) + kunlar lentasi + slot grid
- [x] Payme WebView + deep link + holat tekshiruvi
- [x] Yozuvlarim, sevimlilar, profil, sozlamalar
- [x] Salon egasi: yozuvlar, tasdiqlash, qo'lda yozuv
- [x] Hisobni o'chirish (Apple talabi)
- [x] Majburiy yangilanish, push token, EAS konfiguratsiyasi
- [ ] Do'konlarga chiqarish — akkaunt va grafika kerak, `STORE.md`
