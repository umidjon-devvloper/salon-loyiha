import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';

/**
 * Ommaviy oferta va maxfiylik siyosati.
 *
 * ⚠️ MATN MIJOZDAN. Bu yerdagi matn — KARKAS, yuridik hujjat emas.
 * Payme shartnoma uchun ikkala sahifani ham talab qiladi va refund
 * qoidalari aynan ofertada yozilgan bo'lishi shart, aks holda nizo
 * chiqqanda Payme chargeback qiladi.
 */

function Section({ title, children }) {
  return (
    <section className="mt-6">
      <h2 className="mb-2 font-semibold text-gray-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-gray-600">{children}</div>
    </section>
  );
}

function Draft() {
  return (
    <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Bu matn dastlabki loyiha. Yakuniy tahrir yuridik shaxs tomonidan tasdiqlanishi kerak.
    </p>
  );
}

export function OfferPage() {
  usePageMeta({
    title: 'Ommaviy oferta',
    description: "Go'zal Ayol platformasidan foydalanish shartlari va to'lov qoidalari.",
  });

  return (
    <Container className="max-w-3xl py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Ommaviy oferta</h1>
      <p className="mt-2 text-sm text-gray-500">Oxirgi yangilanish: —</p>

      <div className="mt-4">
        <Draft />
      </div>

      <Section title="1. Umumiy qoidalar">
        <p>
          Platforma go&apos;zallik salonlari va mijozlarni bog&apos;laydigan onlayn xizmat
          hisoblanadi. Xizmatning o&apos;zini salon ko&apos;rsatadi; platforma faqat navbat olish
          imkonini beradi.
        </p>
      </Section>

      <Section title="2. Band qilish to'lovi">
        <p>
          Mijoz vaqtni band qilish uchun platformaga xizmat haqi to&apos;laydi. Bu summa salon
          xizmatining narxi emas — xizmat narxi salonda to&apos;lanadi.
        </p>
        <p>To&apos;lov Payme orqali qabul qilinadi va platforma hisobida qoladi.</p>
      </Section>

      <Section title="3. Pulni qaytarish shartlari">
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium text-gray-700">Holat</th>
                <th className="px-3 py-2 font-medium text-gray-700">To&apos;lov</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="px-3 py-2">Mijoz yozuvni o&apos;zi bekor qildi</td>
                <td className="px-3 py-2 text-gray-600">Qaytarilmaydi</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Salon yozuvni bekor qildi</td>
                <td className="px-3 py-2 text-gray-600">To&apos;liq qaytariladi</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Mijoz belgilangan vaqtda kelmadi</td>
                <td className="px-3 py-2 text-gray-600">Qaytarilmaydi</td>
              </tr>
              <tr>
                <td className="px-3 py-2">Texnik xato (summa ikki marta yechildi)</td>
                <td className="px-3 py-2 text-gray-600">Qaytariladi</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Qaytarish Payme orqali, to&apos;lov amalga oshirilgan kartaga qaytariladi.</p>
      </Section>

      <Section title="4. Yozuvni bekor qilish">
        <p>
          Mijoz yozuvni boshlanishiga kamida 2 soat qolganda bekor qila oladi. Undan keyin bekor
          qilish uchun salonga qo&apos;ng&apos;iroq qilish kerak.
        </p>
      </Section>

      <Section title="5. Tomonlarning javobgarligi">
        <p>
          Xizmat sifati uchun salon javobgar. Platforma salon va mijoz o&apos;rtasidagi
          munosabatlarga aralashmaydi.
        </p>
      </Section>

      <Section title="6. Bog'lanish">
        <p>Yuridik shaxs nomi, STIR, manzil va telefon raqami: —</p>
      </Section>
    </Container>
  );
}

export function PrivacyPage() {
  usePageMeta({
    title: 'Maxfiylik siyosati',
    description: "Go'zal Ayol platformasida shaxsiy ma'lumotlar qanday saqlanadi.",
  });

  return (
    <Container className="max-w-3xl py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Maxfiylik siyosati</h1>
      <p className="mt-2 text-sm text-gray-500">Oxirgi yangilanish: —</p>

      <div className="mt-4">
        <Draft />
      </div>

      <Section title="1. Qanday ma'lumot yig'iladi">
        <p>
          Ism, telefon raqam va shahar — ro&apos;yxatdan o&apos;tishda. Yozuv ma&apos;lumotlari:
          sana, vaqt, tanlangan xizmatlar va izoh.
        </p>
        <p>
          Karta ma&apos;lumotlari <strong>yig&apos;ilmaydi va saqlanmaydi</strong>. To&apos;lov
          Payme sahifasida amalga oshiriladi.
        </p>
      </Section>

      <Section title="2. Nima uchun ishlatiladi">
        <p>
          Telefon raqam salon egasiga ko&apos;rinadi — u yozuvni tasdiqlash uchun
          qo&apos;ng&apos;iroq qiladi. Boshqa maqsadda ishlatilmaydi.
        </p>
      </Section>

      <Section title="3. Kimga beriladi">
        <p>
          Yozuv ma&apos;lumotlari faqat siz tanlagan salonga ko&apos;rinadi. Uchinchi shaxslarga
          sotilmaydi va berilmaydi.
        </p>
        <p>To&apos;lov ma&apos;lumotlari Payme to&apos;lov tizimiga uzatiladi.</p>
      </Section>

      <Section title="4. Qancha saqlanadi">
        <p>
          Hisob faol bo&apos;lgunicha. Hisobni o&apos;chirishni so&apos;rasangiz, shaxsiy
          ma&apos;lumotlar o&apos;chiriladi; to&apos;lov yozuvlari buxgalteriya talablari
          bo&apos;yicha saqlanib qoladi.
        </p>
      </Section>

      <Section title="5. Xavfsizlik">
        <p>
          Parollar shifrlangan holda saqlanadi va hech qachon ochiq ko&apos;rinishda uzatilmaydi.
          Ulanish HTTPS orqali himoyalangan.
        </p>
      </Section>

      <Section title="6. Bog'lanish">
        <p>Ma&apos;lumotlaringiz bo&apos;yicha savol: —</p>
      </Section>
    </Container>
  );
}

export default OfferPage;
