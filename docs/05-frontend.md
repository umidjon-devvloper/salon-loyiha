# 05 — Frontend (Vite + React + Tailwind)

## Routing xaritasi

```jsx
// routes/AppRoutes.jsx
<Routes>
  {/* ── OCHIQ ───────────────────────────── */}
  <Route path="/"                    element={<HomePage />} />
  <Route path="/kategoriya/:slug"    element={<CategoryPage />} />
  <Route path="/salonlar"            element={<SalonListPage />} />
  <Route path="/salon/:slug"         element={<SalonDetailPage />} />
  <Route path="/mutaxassislar"       element={<MasterListPage />} />
  <Route path="/mutaxassis/:id"      element={<MasterDetailPage />} />
  <Route path="/qidiruv"             element={<SearchPage />} />
  <Route path="/biz-haqimizda"       element={<AboutPage />} />
  <Route path="/kirish"              element={<LoginPage />} />
  <Route path="/royxatdan-otish"     element={<RegisterPage />} />

  {/* ── BAND QILISH (auth kerak) ────────── */}
  <Route element={<ProtectedRoute />}>
    <Route path="/band-qilish/:masterId" element={<BookingPage />} />
    <Route path="/band-qilish/tasdiq/:code" element={<BookingSuccessPage />} />
  </Route>

  {/* ── MIJOZ KABINETI ──────────────────── */}
  <Route path="/profil" element={<RoleRoute roles={['client','owner','admin']} />}>
    <Route index               element={<ProfilePage />} />
    <Route path="yozuvlarim"   element={<MyBookingsPage />} />
    <Route path="sevimlilar"   element={<FavoritesPage />} />   {/* localStorage, v1 */}
    <Route path="sozlamalar"   element={<SettingsPage />} />
  </Route>

  {/* ── SALON EGASI KABINETI ────────────── */}
  <Route path="/kabinet" element={<RoleRoute roles={['owner']} />}>
    <Route index               element={<OwnerDashboard />} />
    <Route path="salon"        element={<SalonEditPage />} />
    <Route path="xizmatlar"    element={<ServicesPage />} />
    <Route path="mutaxassislar" element={<MastersPage />} />
    <Route path="jadval"       element={<SchedulePage />} />      {/* ⭐ ish vaqti */}
    <Route path="dam-olish"    element={<TimeOffPage />} />
    <Route path="yozuvlar"     element={<OwnerBookingsPage />} /> {/* ⭐ kalendar */}
    <Route path="statistika"   element={<OwnerStatsPage />} />
  </Route>

  {/* ── ADMIN ───────────────────────────── */}
  <Route path="/admin" element={<RoleRoute roles={['admin']} />}>
    <Route index                element={<AdminDashboard />} />
    <Route path="salonlar"      element={<AdminSalonsPage />} />
    <Route path="salonlar/:id"  element={<AdminSalonDetailPage />} />
    <Route path="kategoriyalar" element={<AdminCategoriesPage />} />
    <Route path="foydalanuvchilar" element={<AdminUsersPage />} />
    <Route path="yozuvlar"      element={<AdminBookingsPage />} />
    <Route path="top"           element={<AdminTopPage />} />
  </Route>

  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

---

## Sahifalar tavsifi

### Bosh sahifa `/`
Rasmdagi dizayn bo'yicha:
1. **Hero** — sarlavha, qidiruv paneli (xizmat + joylashuv + kategoriya + "Qidirish"), statistika chiplari
2. **Kategoriyalar** — 11–12 ta ikonka grid (mobilda 3 ustun, desktopda 6–11)
3. **Mashhur xizmatlar** — TOP salonlar kartochkalari (rasm, nom, reyting, tuman, narx "50 000 so'mdan")
4. **Ishonch bloki** — 4 ta afzallik ("Onlayn yozuv 24/7", "Qulay narxlar"...)
5. **Footer**

> "Maxsus takliflar" va "20% chegirma" bloklari v1 da **statik** (admin `settings` dan matn kiritadi). Aksiya tizimi v2.

### Salon profili `/salon/:slug`
```
┌──────────────────────────────────────┐
│  Cover rasm + galereya               │
├──────────────────────────────────────┤
│  Nom  ⭐4.8 (128)  [TOP]  ✓Tasdiqlangan│
│  📍 Toshkent, Chilonzor              │
│  📞 Qo'ng'iroq qilish  (tel: link)    │
├──────────────────────────────────────┤
│  Ish vaqti jadvali (7 kun)           │
├──────────────────────────────────────┤
│  Xizmatlar (kategoriya bo'yicha):    │
│   Manikyur                           │
│   ☐ Klassik manikyur  60daq  100 000 │
│   ☐ Gel qoplama       90daq  150 000 │
│   ...                                │
├──────────────────────────────────────┤
│  Mutaxassislar (kartochka)           │
├──────────────────────────────────────┤
│  ┌────────────────────────────────┐  │  ← sticky (mobilda pastda)
│  │ 2 xizmat · 150 daq · 250 000   │  │
│  │      [ Band qilish ]           │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
```

### ⭐ Band qilish sahifasi `/band-qilish/:masterId`

4 qadamli wizard:

```
[1] Xizmat tanlash        → checkbox ro'yxati, pastda jami: daqiqa + summa
[2] Mutaxassis tanlash    → agar salonda 1 usta bo'lsa, avtomatik o'tib ketadi
[3] Kun va vaqt           → kalendar + slot grid
[4] Ma'lumot va tasdiq    → ism, telefon, izoh → "Band qilish"
```

3-qadam eng muhim komponent:

```jsx
// components/booking/SlotPicker.jsx
function SlotPicker({ masterId, serviceIds, onSelect }) {
  const [month, setMonth] = useState(currentMonth());
  const [date, setDate]   = useState(null);

  // Kalendarda qaysi kunlar ochiq
  const { data: days } = useQuery({
    queryKey: ['month-availability', masterId, month, serviceIds],
    queryFn: () => api.getMonthAvailability({ masterId, month, serviceIds }),
    enabled: serviceIds.length > 0,
  });

  // Tanlangan kunning aniq slotlari
  const { data: avail, isLoading } = useQuery({
    queryKey: ['availability', masterId, date, serviceIds],
    queryFn: () => api.getAvailability({ masterId, date, serviceIds }),
    enabled: !!date,
    staleTime: 30_000,          // 30 sekund — slot tez o'zgaradi
    refetchOnWindowFocus: true, // boshqa tabdan qaytganda yangilash
  });

  return (
    <div className="space-y-6">
      <Calendar
        month={month} onMonthChange={setMonth}
        value={date} onChange={setDate}
        isDayDisabled={(d) => !days?.[d]?.available}
        dayBadge={(d) => days?.[d]?.slotCount}
      />

      {date && (
        isLoading ? <SlotSkeleton /> :
        !avail?.slots?.length
          ? <EmptyState text="Bu kunda bo'sh vaqt yo'q. Boshqa kunni tanlang." />
          : <SlotGrid slots={avail.slots} onSelect={onSelect} />
      )}
    </div>
  );
}
```

Slot grid — mobilda 3 ustun, desktopda 6:

```jsx
<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
  {slots.map((s) => (
    <button key={s.startMin} onClick={() => onSelect(s)}
      className={cn(
        'py-2.5 rounded-xl border text-sm font-medium transition',
        selected === s.startMin
          ? 'bg-pink-600 text-white border-pink-600'
          : 'bg-white border-pink-100 text-gray-700 hover:border-pink-400 hover:bg-pink-50',
      )}>
      {s.start}
    </button>
  ))}
</div>
```

**Xato holati:** `POST /bookings` `409 SLOT_TAKEN` qaytarsa — toast ko'rsatiladi va slotlar **avtomatik qayta yuklanadi**:

```js
onError: (err) => {
  if (err.code === 'SLOT_TAKEN') {
    toast.error('Kechirasiz, bu vaqtni sizdan oldin band qilishdi. Boshqa vaqtni tanlang.');
    queryClient.invalidateQueries({ queryKey: ['availability'] });
    setStep(3);
  }
}
```

### ⭐ Ish vaqti jadvali `/kabinet/jadval`

Salon egasi uchun eng muhim ekran. **Sodda bo'lishi shart** — salon egasi texnik odam emas.

```
┌────────────────────────────────────────────────────────┐
│  Ish vaqti                                             │
│  Jadval kimga: (•) Butun salon  ( ) Alohida usta ▾     │
├────────────────────────────────────────────────────────┤
│  Dushanba   [✓] ochiq   09:00 ▾ – 19:00 ▾   tanaffus ✎│
│  Seshanba   [✓] ochiq   09:00 ▾ – 19:00 ▾   13–14     │
│  Chorshanba [✓] ochiq   09:00 ▾ – 19:00 ▾   13–14     │
│  Payshanba  [✓] ochiq   09:00 ▾ – 19:00 ▾   13–14     │
│  Juma       [✓] ochiq   09:00 ▾ – 18:00 ▾   13–14     │
│  Shanba     [✓] ochiq   10:00 ▾ – 16:00 ▾   —         │
│  Yakshanba  [ ] yopiq                                  │
├────────────────────────────────────────────────────────┤
│  [ Dushanbani hamma kunga qo'llash ]                   │
│                                    [ Saqlash ]         │
└────────────────────────────────────────────────────────┘
```

"Dushanbani hamma kunga qo'llash" tugmasi — 7 kunni qo'lda to'ldirish zerikarli. Bu kichik narsa, lekin egasi shu tugma yo'qligi uchun jadvalni to'ldirmasligi mumkin.

### ⭐ Yozuvlar kalendari `/kabinet/yozuvlar`

```
┌──────────────────────────────────────────────────────────┐
│  ◀  5-avgust, chorshanba  ▶      Usta: Hammasi ▾         │
│  [Bugun] [Ertaga] [Hafta]              [+ Qo'lda yozuv]  │
├──────────────────────────────────────────────────────────┤
│ 09:00 │                                                  │
│ 09:30 │ ┌─ Dildora K. · Gel qoplama ────── 🕐 kutilmoqda │
│ 10:00 │ │  +998 90 123 45 67   150 000 so'm              │
│ 10:30 │ └─ [✓ Tasdiqlash]  [✗ Bekor qilish]              │
│ 11:00 │                                                  │
│ 11:30 │ ┌─ Nargiza S. · Manikyur ───────── ✓ tasdiqlangan│
│ 12:30 │ └─ +998 91 222 33 44   100 000 so'm              │
│ 13:00 │ ▨▨▨ Tanaffus ▨▨▨                                 │
│ 14:00 │                                                  │
└──────────────────────────────────────────────────────────┘
```

Mobilda kalendar emas, **ro'yxat** ko'rinishida (vaqt bo'yicha tartiblangan kartochkalar). Salon egalarining ko'pchiligi telefondan kiradi — mobil versiya birinchi darajali.

### Admin `/admin/salonlar`
Jadval: nom, egasi, tuman, status badge, TOP holati, yozuv soni, amallar (`Tasdiqlash` / `Bloklash` / `TOP qilish` / `Ko'rish`). Yuqorida `pending` filtri sonli badge bilan.

---

## State boshqaruvi

| Nima | Qanday |
|---|---|
| Server ma'lumotlari (salonlar, slotlar, yozuvlar) | **TanStack Query** — kesh, refetch, loading |
| Auth (user, token) | **Zustand** + `localStorage` persist |
| Booking wizard qadamlari | **`useState`** sahifa ichida (URL query ga yozish shart emas) |
| Filtrlar | **URL search params** — havolani ulashish uchun |
| Sevimlilar | **localStorage** (v1 — backendsiz) |

```js
// store/authStore.js
export const useAuthStore = create(persist((set) => ({
  user: null, accessToken: null, refreshToken: null,
  setAuth: ({ user, accessToken, refreshToken }) => set({ user, accessToken, refreshToken }),
  logout: () => set({ user: null, accessToken: null, refreshToken: null }),
}), { name: 'ga-auth' }));
```

```js
// api/client.js — 401 da tokenni yangilash
client.interceptors.response.use(null, async (error) => {
  const { response, config } = error;
  if (response?.status === 401 && response.data?.code === 'TOKEN_EXPIRED' && !config._retried) {
    config._retried = true;
    const ok = await refreshTokens();      // bir vaqtda faqat bitta refresh
    if (ok) return client(config);
    useAuthStore.getState().logout();
    window.location.href = '/kirish';
  }
  return Promise.reject(normalizeError(error));
});
```

---

## Dizayn tizimi (Tailwind)

Rasmdagi pushti (pink) palitra:

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#FFF1F5',
          100: '#FFE4EC',
          200: '#FFC9DA',
          300: '#FF9EBE',
          400: '#FF6B9D',
          500: '#F4407D',   // asosiy
          600: '#DB2777',   // tugmalar
          700: '#BE185D',   // sarlavhalar
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
      borderRadius: { xl: '0.875rem', '2xl': '1.25rem' },
    },
  },
};
```

**Qoidalar:**
- Radius: kartochkalar `rounded-2xl`, tugmalar `rounded-xl`, inputlar `rounded-xl`
- Soya: `shadow-sm` + `border border-brand-100` (og'ir soya ishlatilmaydi)
- Asosiy tugma: `bg-brand-600 hover:bg-brand-700 text-white`
- Ikkilamchi: `bg-white border border-brand-200 text-brand-700 hover:bg-brand-50`
- Status badge: kutilmoqda `amber`, tasdiqlangan `emerald`, bekor `rose`, tugallangan `slate`
- Har bir tugmada `disabled:opacity-50 disabled:cursor-not-allowed`

## Responsive

| Breakpoint | Nima o'zgaradi |
|---|---|
| `< 640px` | Pastdagi navigatsiya bar (rasmdagi mobil ilova kabi: Bosh sahifa / Qidiruv / Sevimlilar / Yozuvlar / Profil). Kategoriyalar 3 ustun. Kabinet — burger menyu. Yozuvlar — kalendar emas, ro'yxat |
| `640–1024px` | 2–3 ustunli grid, sidebar yopilgan holda |
| `> 1024px` | Yuqoridagi header + sidebar, 4 ustunli grid |

> Mobil versiya birinchi navbatda ishlab chiqiladi (mobile-first). Bozorda foydalanuvchilarning 85%+ telefondan kiradi.

## Majburiy UX detallari

1. **Skeleton loader** — har bir ro'yxat va slot gridda (spinner emas)
2. **Bo'sh holat** — "Bu kunda bo'sh vaqt yo'q", "Salon topilmadi" + tavsiya
3. **Xato holati** — retry tugmasi bilan
4. **Narx formati** — `100 000 so'm` (probel bilan, `Intl.NumberFormat('uz-UZ')`)
5. **Telefon maskasi** — `+998 (__) ___-__-__`
6. **Sana o'zbekcha** — "5-avgust, chorshanba" (`date-fns` + custom locale, chunki `uz` locale to'liq emas)
7. **Tasdiq modali** — bekor qilish va o'chirishda
8. **Toast** — barcha muvaffaqiyat/xato xabarlari uchun (`react-hot-toast`)
