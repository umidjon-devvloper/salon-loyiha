# 09 — Serverga chiqarish (deploy)

VPS: Ubuntu 22.04, kamida 2 GB RAM. Domen DNS'i server IP'siga yo'naltirilgan bo'lishi kerak.

Fayllar `deploy/` papkasida: `nginx.conf`, `ecosystem.config.cjs`, `backup.sh`.

---

## 0. Oldindan tayyor bo'lishi kerak

- [ ] Domen sotib olingan va DNS A-yozuvi server IP'siga qaratilgan
- [ ] Server root yoki sudo huquqi
- [ ] `PAYME_MERCHANT_ID` va `PAYME_KEY` (production kalit)

> DNS tarqalishi 1–24 soat oladi. SSL sertifikati DNS ishlamaguncha olinmaydi —
> shuning uchun domenni **eng birinchi** sozlang.

---

## 1. Server tayyorlash

```bash
apt update && apt upgrade -y
apt install -y curl git nginx ufw

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
npm i -g pnpm pm2

# MongoDB 7
curl -fsSL https://pgp.mongodb.com/server-7.0.asc | gpg --dearmor -o /usr/share/keyrings/mongodb.gpg
echo "deb [signed-by=/usr/share/keyrings/mongodb.gpg] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" \
  > /etc/apt/sources.list.d/mongodb-org-7.0.list
apt update && apt install -y mongodb-org
systemctl enable --now mongod
```

### Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw enable
```

> ⚠️ MongoDB porti (27017) **tashqariga ochilmaydi**. U faqat `127.0.0.1` da
> tinglaydi (standart sozlama). Ochib qo'yish — bazani o'g'irlatishning eng
> keng tarqalgan yo'li.

---

## 2. Kodni joylashtirish

```bash
mkdir -p /var/www/gozalayol /var/log/gozalayol
cd /var/www/gozalayol

git clone <repo-url> src
cd src
pnpm install --frozen-lockfile
```

### Backend

```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```

To'ldiriladigan qiymatlar:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/gozal_ayol

# ⚠️ Har birini alohida generatsiya qiling: openssl rand -base64 48
JWT_ACCESS_SECRET=<generatsiya>
JWT_REFRESH_SECRET=<generatsiya>

CLIENT_URL=https://DOMEN.UZ
UPLOAD_DIR=/var/www/gozalayol/uploads

ADMIN_PHONE=+998XXXXXXXXX
ADMIN_PASSWORD=<kuchli parol>

PAYME_MERCHANT_ID=<Payme kabinetidan>
PAYME_KEY=<production kalit>
```

> ⚠️ `.env` ni git'ga qo'shmang. `JWT_*` sirlari o'zgarsa hamma foydalanuvchi
> tizimdan chiqib ketadi — ularni bir marta qo'ying va saqlang.

```bash
mkdir -p /var/www/gozalayol/uploads
ln -sfn /var/www/gozalayol/src/apps/api /var/www/gozalayol/api

# Boshlang'ich ma'lumot: admin + 12 kategoriya
cd /var/www/gozalayol/src && pnpm seed
```

### Frontend

```bash
cd /var/www/gozalayol/src/apps/web
echo "VITE_API_URL=https://DOMEN.UZ/api" > .env.production
pnpm build

mkdir -p /var/www/gozalayol/web
cp -r dist/* /var/www/gozalayol/web/
```

---

## 3. PM2

```bash
cp /var/www/gozalayol/src/deploy/ecosystem.config.cjs /var/www/gozalayol/
cd /var/www/gozalayol
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup     # chiqqan buyruqni nusxalab bajaring
```

Tekshirish:

```bash
pm2 logs gozalayol-api --lines 30
curl http://127.0.0.1:5000/api/health
```

---

## 4. Nginx va SSL

```bash
cp /var/www/gozalayol/src/deploy/nginx.conf /etc/nginx/sites-available/gozalayol
sed -i 's/DOMEN.UZ/haqiqiy-domen.uz/g' /etc/nginx/sites-available/gozalayol
ln -s /etc/nginx/sites-available/gozalayol /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

nginx -t && systemctl reload nginx
```

### Let's Encrypt

```bash
apt install -y certbot python3-certbot-nginx
mkdir -p /var/www/certbot
certbot --nginx -d haqiqiy-domen.uz -d www.haqiqiy-domen.uz
```

Certbot avtomatik yangilashni o'zi sozlaydi. Tekshirish:

```bash
certbot renew --dry-run
```

> ⚠️ Sertifikat olinmaguncha `nginx.conf` dagi HTTPS bloki ishlamaydi
> (fayl yo'q). Certbot uni o'zi to'ldiradi.

---

## 5. Zaxira (backup)

```bash
cp /var/www/gozalayol/src/deploy/backup.sh /var/www/gozalayol/deploy/
chmod +x /var/www/gozalayol/deploy/backup.sh

crontab -e
```

Qo'shiladigan qator:

```
0 3 * * * /var/www/gozalayol/deploy/backup.sh >> /var/log/gozalayol/backup.log 2>&1
```

Skript bazani va **rasmlarni birga** saqlaydi: bazadagi fayl nomlari
rasmlarsiz ma'nosiz. 14 kunlik nusxa qoldiriladi.

> ⚠️ **Tekshirilmagan zaxira — zaxira emas.** Birinchi haftada bir marta
> tiklashni sinab ko'ring:
> ```bash
> mongorestore --archive=/var/backups/gozalayol/db-<sana>.gz --gzip \
>   --nsFrom='gozal_ayol.*' --nsTo='gozal_test.*'
> ```
> Zaxira faylini serverdan **tashqariga** ham nusxalash kerak (S3 yoki
> boshqa disk). Server yo'qolsa, undagi zaxira ham yo'qoladi.

---

## 6. Payme webhookini ulash

Payme kabinetida:

| Maydon | Qiymat |
|---|---|
| Endpoint | `https://DOMEN.UZ/api/payme/callback` |
| `account` maydoni | `booking_id` |

Sandbox testlari o'tgach production kalit beriladi. Kalitni `.env` ga
qo'yib, `pm2 restart gozalayol-api`.

> ⚠️ Sandbox va production kalitlari **boshqa-boshqa**. Kod `NODE_ENV` ga
> qarab tanlaydi: production'da `PAYME_KEY`, aks holda `PAYME_KEY_TEST`.

---

## 7. Yangilanish (keyingi deploy)

```bash
cd /var/www/gozalayol/src
git pull
pnpm install --frozen-lockfile

# Frontend
cd apps/web && pnpm build && cp -r dist/* /var/www/gozalayol/web/

# Backend
pm2 restart gozalayol-api
```

> `index.html` keshlanmaydi (nginx sozlamasida), shuning uchun foydalanuvchi
> yangi versiyani darhol oladi. Hashli `assets/` fayllari abadiy keshlanadi.

---

## 8. Ishga tushirishdan oldingi tekshiruv ro'yxati

- [ ] `https://DOMEN.UZ` ochiladi, HTTP → HTTPS yo'naltiriladi
- [ ] `curl https://DOMEN.UZ/api/health` → `ok`
- [ ] `https://DOMEN.UZ/sitemap.xml` XML qaytaradi
- [ ] `https://DOMEN.UZ/robots.txt` da to'g'ri domen yozilgan
- [ ] Admin hisobi bilan kirish ishlaydi
- [ ] Salon egasi ro'yxatdan o'tib, salon yarata oladi
- [ ] Rasm yuklanadi va `/uploads/...` orqali ochiladi
- [ ] Mijoz bo'sh vaqtni ko'radi va band qiladi
- [ ] Payme to'lovi uchidan-uchiga o'tadi
- [ ] `pm2 logs` da xato yo'q
- [ ] Zaxira cron ishladi va fayl paydo bo'ldi
- [ ] 360px kenglikda sayt buzilmaydi

---

## Muammolar

| Belgi | Sabab |
|---|---|
| 502 Bad Gateway | API ishlamayapti → `pm2 logs gozalayol-api` |
| CORS xatosi | `.env` dagi `CLIENT_URL` domen bilan mos emas |
| Rasmlar 404 | `UPLOAD_DIR` va nginx `alias` yo'llari mos emas |
| Rate limit hamma uchun ishlaydi | `trust proxy` yoki `X-Forwarded-For` yo'q |
| Sayt oq ekran | Eski `index.html` keshlangan → nginx `no-store` sozlamasini tekshiring |
| Payme `-32504` | Kalit noto'g'ri yoki `NODE_ENV` production emas |
| Cron ikki marta ishlayapti | PM2 cluster rejimi → `instances: 1` bo'lsin |
