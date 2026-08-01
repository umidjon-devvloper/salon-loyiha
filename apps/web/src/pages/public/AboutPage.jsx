import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, ShieldCheck, Store } from 'lucide-react';

import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { Button, Card, CardBody } from '../../components/ui';

const forClients = [
  {
    icon: Clock,
    text: "Salon yopiq bo'lganda ham navbat olasiz — kechasi ham, dam olish kunida ham",
  },
  {
    icon: CalendarCheck,
    text: "Ko'rinayotgan vaqt haqiqatan bo'sh: band vaqtlar ro'yxatdan yo'qoladi",
  },
  {
    icon: ShieldCheck,
    text: 'Narx va davomiylik oldindan ko\u2019rinadi — salonda kutilmagan summa bo\u2019lmaydi',
  },
];

export function AboutPage() {
  usePageMeta({
    title: 'Biz haqimizda',
    description:
      "Go'zal Ayol — go'zallik salonlariga onlayn navbat olish platformasi. Salonlar uchun bepul jadval boshqaruvi.",
  });

  return (
    <Container className="max-w-3xl py-8">
      <h1 className="text-2xl font-semibold text-gray-900">Biz haqimizda</h1>

      <p className="mt-3 text-gray-600">
        Go&apos;zal Ayol — go&apos;zallik salonlari va mijozlarni bog&apos;laydigan onlayn navbat
        platformasi. Salon ish vaqtini bir marta kiritadi, tizim bo&apos;sh vaqtlarni o&apos;zi
        hisoblaydi, mijoz esa istalgan paytda yozila oladi.
      </p>

      <h2 className="mt-8 font-semibold text-gray-900">Mijozlar uchun</h2>
      <div className="mt-3 space-y-3">
        {forClients.map(({ icon: Icon, text }) => (
          <div key={text} className="flex gap-3">
            <Icon className="mt-0.5 h-5 w-5 shrink-0 text-brand-500" />
            <p className="text-sm text-gray-600">{text}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 font-semibold text-gray-900">Salon egalari uchun</h2>
      <Card className="mt-3">
        <CardBody className="space-y-3">
          <p className="text-sm text-gray-600">
            Jadvalingiz bir joyda turadi. Telefon orqali kelgan mijozlarni ham shu yerga kiritasiz —
            shunda daftar va onlayn yozuvlar bir-biriga zid bo&apos;lmaydi.
          </p>
          <p className="text-sm text-gray-600">
            Ro&apos;yxatdan o&apos;tib, salon ma&apos;lumotlarini to&apos;ldirasiz. Administrator
            tasdiqlagach salon katalogda paydo bo&apos;ladi.
          </p>

          <div className="pt-1">
            <Link to="/royxatdan-otish">
              <Button>
                <Store className="h-4 w-4" />
                Salonimni qo&apos;shish
              </Button>
            </Link>
          </div>
        </CardBody>
      </Card>

      <h2 className="mt-8 font-semibold text-gray-900">To&apos;lov qanday ishlaydi</h2>
      <p className="mt-3 text-sm text-gray-600">
        Vaqtni band qilish uchun kichik xizmat haqi olinadi — bu salon xizmatining narxi emas.
        Xizmat narxini salonda to&apos;laysiz. Batafsil:{' '}
        <Link to="/oferta" className="text-brand-700 underline">
          ommaviy oferta
        </Link>
        .
      </p>
    </Container>
  );
}

export default AboutPage;
