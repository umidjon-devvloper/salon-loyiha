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

## Holat

- [x] Expo + Router + NativeWind + monorepo
- [x] Auth store (SecureStore), API klient
- [x] Tab navigatsiya, bosh sahifa, kategoriyalar, salon kartochkasi
- [x] Kirish / ro'yxatdan o'tish ekranlari, UI primitivlari
- [ ] Qidiruv va filtrlar
- [ ] Salon va mutaxassis ekranlari
- [ ] Band qilish wizardi + slot picker
- [ ] Payme WebView + deep link
- [ ] Yozuvlarim, sevimlilar, profil
- [ ] Salon egasi: yozuvlar, tasdiqlash, qo'lda yozuv
- [ ] Hisobni o'chirish (Apple talabi)
- [ ] EAS build va do'konlarga chiqarish
