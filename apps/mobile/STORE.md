# Do'konlarga chiqarish

`eas.json` tayyor. Qolgani — akkauntlar, grafika va matnlar.

## Oldindan kerak

| | Narx | Kim |
|---|---|---|
| Apple Developer | $99/yil | Mijoz (yuridik shaxs nomidan) |
| Google Play Console | $25 (bir marta) | Mijoz |
| Expo (EAS) akkaunt | bepul tarif yetarli | Biz |

> ⚠️ Apple akkaunti **yuridik shaxs nomidan** ochilsin. Shaxsiy akkauntda
> ilova dasturchining ismi bilan chiqadi va keyin ko'chirish og'riqli.

## Grafika (mijozdan)

- [ ] Ikonka: 1024×1024 PNG, shaffof fonsiz
- [ ] Splash rasm
- [ ] Skrinshotlar: iPhone 6.7" va 6.5", Android telefon — kamida 3 tadan
- [ ] Do'kon tavsifi (o'zbekcha, 4000 belgigacha)
- [ ] Qisqa tavsif (80 belgi)

## Build

```bash
npm i -g eas-cli
eas login
eas build:configure

eas build --profile preview --platform android   # sinov uchun APK
eas build --profile production --platform all
```

Birinchi production build'da EAS imzo kalitlarini o'zi yaratadi va saqlaydi.
**Kalitlarni yo'qotmang** — Android'da kalit yo'qolsa ilovani yangilab
bo'lmaydi, faqat yangi ilova sifatida chiqarish mumkin.

## Apple talablari

| Talab | Holat |
|---|---|
| Hisobni ilova ichidan o'chirish | ✅ `sozlamalar/hisobni-ochirish` |
| Maxfiylik siyosati URL | ⏳ `https://DOMEN/maxfiylik` |
| Privacy Nutrition Labels | ⏳ formada to'ldiriladi |
| Ko'rib chiqish uchun test hisobi | ⏳ demo login/parol tayyorlang |

> ⚠️ **Ariza tavsifida to'lov haqida aniq yozing:** platformada olinadigan
> summa jismoniy xizmat (salon xizmati) uchun band qilish haqi. Bu Apple'ning
> IAP talabiga kirmaydi va tashqi to'lov tizimi ruxsat etiladi. Buni
> yozmasangiz, ko'rib chiquvchi IAP talab qilib rad etishi mumkin —
> eng ko'p uchraydigan rad sababi shu.

## Google Play talablari

| Talab | Holat |
|---|---|
| Data Safety formasi | ⏳ |
| Maxfiylik siyosati URL | ⏳ |
| Target SDK | Expo 52 joriy talabga mos |

## Ko'rib chiqishdan oldin

- [ ] `app.json` → `extra.apiUrl` production domenga qaratilgan
- [ ] `APP_MIN_VERSION` serverda to'g'ri qo'yilgan
- [ ] Demo hisob ishlaydi va unda kamida bitta yozuv bor
- [ ] Ilova internetsiz ochilganda yiqilmaydi
- [ ] Hisobni o'chirish oxirigacha ishlaydi
