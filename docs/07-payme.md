# 07 — Payme integratsiyasi (band qilish to'lovi)

MCHJ mavjud — asosiy yuridik to'siq yo'q. Qolgani: Payme Business bilan shartnoma, sandbox testi, production.

## Model

**Mijoz slotni band qilish uchun to'lov qiladi. Pul har doim platformada (MCHJ hisobi) qoladi.**

Bu **komissiya**, avans emas. Salonga hech narsa o'tkazilmaydi → **settlement (hisob-kitob) moduli kerak emas**.

To'lov miqdori `settings` kolleksiyasida, admin panelda tahrirlanadi:

```js
bookingFee: {
  enabled:     true,
  mode:        'fixed',    // ✅ QAROR
  fixedAmount: 5000,       // ✅ QAROR: 5 000 so'm har band qilishga
  percent:     20,         // 'percent' rejimi kodda bor, hozir ishlatilmaydi
  minAmount:   3000,
  maxAmount:   50000,
}
```

> Payme komissiyasi ~1% → 5 000 so'mdan ~50 so'm. Sof daromad ~4 950 so'm har yozuvga.
> Nima uchun sozlanadigan: bozor reaksiyasiga qarab raqam albatta o'zgaradi. Har safar kod o'zgartirilmasin.

---

## Qaysi API tanlanadi

Payme ikki xil ulanishni beradi:

| | Kim so'rov yuboradi | Bizga mos |
|---|---|---|
| **Subscribe API** | Ilova → Payme (karta ma'lumotini o'zimiz olamiz) | ❌ Karta ma'lumotini saqlash javobgarligi, PCI DSS |
| **Merchant API** | Payme → ilova (webhook) | ✅ **Shu tanlanadi** |

Merchant API da Payme bizning endpointimizga POST so'rov yuboradi, biz javob qaytaramiz. Karta ma'lumoti bizga umuman tegmaydi — mijoz Payme sahifasida to'laydi.

---

## To'lov oqimi

```
1. Mijoz slotni tanlaydi, "Band qilish" bosadi
   → POST /api/bookings
   → Booking yaratiladi: status='awaiting_payment', holdUntil = hozir + 15 daqiqa
   → bookingFee.amount = settings dan hisoblanadi
   ⚠️ Shu paytdan slot BAND — boshqalarga ko'rinmaydi

2. Frontend Payme checkout sahifasiga yo'naltiradi
   https://checkout.paycom.uz/<base64(m=MERCHANT_ID;ac.booking_id=<id>;a=<summa_tiyinda>;c=<return_url>)>

3. Mijoz Payme'da to'laydi

4. Payme bizning webhookka ketma-ket so'rov yuboradi:
   CheckPerformTransaction → CreateTransaction → PerformTransaction

5. PerformTransaction muvaffaqiyatli
   → booking.status = 'pending'
   → bookingFee.status = 'paid', paidAt = hozir
   → holdUntil = null
   → Salon egasi kabinetida ko'rinadi

6. Mijoz to'lamadi (15 daqiqa o'tdi)
   → cron: status = 'cancelled' → slot bo'shaydi
```

> ⚠️ **Summa tiyinda yuboriladi.** 30 000 so'm = `3000000`. Bu eng ko'p uchraydigan xato.

---

## Webhook endpoint

```
POST /api/payme/callback
Authorization: Basic base64("Paycom:" + PAYME_KEY)
Content-Type: application/json
```

Format — JSON-RPC 2.0:

```jsonc
// Payme yuboradi
{ "method": "CheckPerformTransaction",
  "params": { "amount": 3000000, "account": { "booking_id": "GA-4821" } },
  "id": 1 }

// Biz javob beramiz
{ "result": { "allow": true }, "id": 1 }

// yoki xato
{ "error": { "code": -31050, "message": { "uz": "Yozuv topilmadi", "ru": "Заказ не найден", "en": "Order not found" } }, "id": 1 }
```

`account` maydonining nomi (`booking_id`) Payme kabinetida sozlanadi — biz `booking.code` ni ishlatamiz.

### Amalga oshiriladigan metodlar

| Metod | Nima qiladi | Bizda nima bo'ladi |
|---|---|---|
| `CheckPerformTransaction` | To'lash mumkinmi? | Booking bor, `awaiting_payment`, summa to'g'ri, `holdUntil` o'tmagan → `allow: true` |
| `CreateTransaction` | Tranzaksiya ochish | `PaymeTransaction` yozuvi yaratiladi, `state = 1` |
| `PerformTransaction` | To'lovni tasdiqlash | `state = 2`, booking `pending` ga o'tadi |
| `CancelTransaction` | Bekor qilish / refund | `state = -1` yoki `-2`, booking `cancelled` |
| `CheckTransaction` | Holatni so'rash | Tranzaksiya holatini qaytaradi |
| `GetStatement` | Davr bo'yicha hisobot | Berilgan oraliqdagi tranzaksiyalar ro'yxati |

### Idempotentlik — majburiy talab

<cite>Takroriy `CreateTransaction`, `PerformTransaction`, `CancelTransaction` so'rovlarida javob birinchi so'rovdagi javob bilan bir xil bo'lishi kerak.</cite> Ya'ni bir tranzaksiyani ikki marta "perform" qilib bo'lmaydi — ikkinchi so'rovga birinchisining natijasi qaytariladi.

Shu sababli `PaymeTransaction` **bazada saqlanishi shart** — xotirada emas.

---

## Yangi model: `paymeTransactions`

```js
const paymeTransactionSchema = new Schema({
  paymeId:    { type: String, required: true, unique: true, index: true }, // Payme tranzaksiya id
  booking:    { type: ObjectId, ref: 'Booking', required: true, index: true },

  amount:     { type: Number, required: true },   // tiyinda
  state:      { type: Number, required: true, default: 1 },
  //  1 = yaratilgan (kutilmoqda)
  //  2 = to'langan
  // -1 = to'lashdan oldin bekor qilingan
  // -2 = to'langandan keyin bekor qilingan (refund)

  createTime:   { type: Number, default: 0 },   // Payme timestamp (ms)
  performTime:  { type: Number, default: 0 },
  cancelTime:   { type: Number, default: 0 },
  reason:       { type: Number, default: null },

  rawRequests: [{ type: Object }],   // debug uchun — barcha so'rovlar logi
}, { timestamps: true });
```

> `rawRequests` — Payme bilan nizo chiqsa, bu yagona dalil bo'ladi. Saqlash arzon, keyin juda asqotadi.

---

## Xato kodlari

| Kod | Qachon |
|---|---|
| `-32504` | Basic auth noto'g'ri |
| `-32700` | JSON parse xatosi |
| `-32601` | Noma'lum metod |
| `-31001` | Summa noto'g'ri (avans summasiga mos emas) |
| `-31003` | Tranzaksiya topilmadi |
| `-31008` | Amalni bajarib bo'lmaydi (masalan booking allaqachon bekor qilingan) |
| `-31050`…`-31099` | Bizning maxsus xatolarimiz: booking topilmadi, muddati o'tgan, slot band |
| `-32400` | Tizim xatosi (DB ishlamayapti) |

Xato xabari **uch tilda** (`uz`, `ru`, `en`) bo'lishi kerak — Payme shuni talab qiladi.

---

## Sandbox va production

Payme sandbox avtomatik test o'tkazadi va quyidagilarni tekshiradi:

- `CheckPerformTransaction` → `allow: true`
- `CreateTransaction` → xatosiz
- **Takroriy** `CreateTransaction` → o'sha javob
- `CheckTransaction` → xatosiz
- Yangi tranzaksiya, hisob "to'lov kutilmoqda" holatida → `-31008` xatosi

Ya'ni bitta bookingga ikkita faol tranzaksiya bo'lishiga yo'l qo'yilmaydi. Kodda shu tekshiruv bo'lishi shart.

Sandbox testlari o'tgandan keyin Payme production kalitlarini beradi.

---

## `.env` ga qo'shiladi

```env
PAYME_MERCHANT_ID=...
PAYME_KEY=...                 # production kalit (webhook auth)
PAYME_KEY_TEST=...            # sandbox kalit
PAYME_CHECKOUT_URL=https://checkout.paycom.uz
PAYME_ACCOUNT_FIELD=booking_id
PREPAYMENT_PERCENT=20
BOOKING_HOLD_MINUTES=15
```

---

## Refund qoidalari (taklif — mijoz tasdiqlashi kerak)

| Holat | To'lov | Payme metodi |
|---|---|---|
| Mijoz o'zi bekor qildi | ❌ Qaytarilmaydi | — |
| Salon bekor qildi | ✅ To'liq qaytariladi | `CancelTransaction`, `state = -2` |
| Mijoz kelmadi (`no_show`) | ❌ Bizda qoladi | — |
| Texnik xato / ikki marta yechildi | ✅ Qaytariladi | `CancelTransaction` |
| To'lanmadi, hold tugadi | — (tranzaksiya ochilmagan) | `state = -1` |

> Mijoz bekor qilganda pul qaytmasligi — bu qoidaning **maqsadi**. Aks holda odamlar bemalol band qilib, kelmay qo'yaveradi va salonning kuni buziladi.

Bu qoidalar **ommaviy ofertada yozilgan bo'lishi shart**, aks holda nizo chiqadi va Payme chargeback qiladi.

---

## Qolgan savollar

- [ ] **Ommaviy oferta va maxfiylik siyosati matni** — Payme talab qiladi. Refund qoidalari shu yerda yozilishi shart
- [ ] Payme Business'ga ariza berilsin (shartnoma 1–2 hafta)
- [ ] 5 000 so'm xizmat narxidan chegiriladimi yoki ustiga qo'shiladimi? — salon bilan kelishuvga bog'liq

**Hal qilingan:** booking fee = 5 000 so'm qat'iy · pul platformada qoladi · settlement moduli yo'q · refund qoidalari yuqoridagi jadval bo'yicha

---

## Muddat

| Bosqich | Kim | Vaqt |
|---|---|---|
| Payme Business'ga ariza + shartnoma | Mijoz (MCHJ bor) | 1–2 hafta |
| Ommaviy oferta va maxfiylik siyosati sahifalari | Biz + mijoz matni | 1 kun |
| Merchant API kodi + booking hold logikasi | Biz | 5–7 kun |
| Sandbox testlari | Biz | 2–3 kun |
| Production ulanish | Payme | 2–5 kun |

**Muhim:** mijoz arizani **hoziroq** bersin. Biz v1 ni yozayotganda u parallel ketadi — shunda oxirida kutib o'tirilmaydi.

---

## Booking algoritmiga o'zgarish

`04-booking-algoritmi.md` dagi so'rov shunday bo'ladi:

```js
// Band deb hisoblanadigan statuslar
status: { $in: ['awaiting_payment', 'pending', 'confirmed'] }
```

Va unique partial index ham shu ro'yxatga moslashtiriladi. Qo'shimcha cron:

```js
// jobs/expireHolds.js — har 2 daqiqada
await Booking.updateMany(
  { status: 'awaiting_payment', holdUntil: { $lt: new Date() } },
  { $set: { status: 'cancelled', cancelReason: 'To\'lov qilinmadi' } },
);
```

> ⚠️ Hold muddatini 15 daqiqadan uzun qilmang. Uzoq bo'lsa, to'lamaydigan odamlar slotlarni band qilib turadi va real mijozlar yozila olmaydi.
