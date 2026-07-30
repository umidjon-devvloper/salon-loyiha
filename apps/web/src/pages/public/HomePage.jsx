import { Link } from 'react-router-dom';
import { CalendarCheck, Clock, ShieldCheck, Wallet } from 'lucide-react';

import { Container } from '../../components/layout/Container';
import { Button, Card, CardBody } from '../../components/ui';

const benefits = [
  { icon: Clock, title: 'Onlayn yozuv 24/7', text: 'Salon yopiq bo\u2019lsa ham navbat olasiz' },
  { icon: CalendarCheck, title: 'Aniq bo\u2019sh vaqt', text: 'Ko\u2019rinayotgan vaqt haqiqatan bo\u2019sh' },
  { icon: Wallet, title: 'Narxlar oldindan', text: 'Xizmat narxi va davomiyligi ko\u2019rinib turadi' },
  { icon: ShieldCheck, title: 'Tekshirilgan salonlar', text: 'Har bir salon moderatsiyadan o\u2019tadi' },
];

/**
 * Vaqtinchalik bosh sahifa — 2-haftada katalog bilan to'ldiriladi
 * (kategoriyalar gridi, TOP salonlar, qidiruv paneli).
 */
export default function HomePage() {
  return (
    <>
      <section className="bg-brand-50/60 py-12 sm:py-20">
        <Container className="max-w-3xl text-center">
          <h1 className="text-3xl font-bold leading-tight text-gray-900 sm:text-4xl">
            Go&apos;zallik salonlariga{' '}
            <span className="text-brand-600">bir necha bosishda</span> yoziling
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-gray-600">
            Bo&apos;sh vaqtni ko&apos;ring, xizmatni tanlang va navbatingizni band qiling.
            Qo&apos;ng&apos;iroq qilish shart emas.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/salonlar">
              <Button size="lg" fullWidth>
                Salonlarni ko&apos;rish
              </Button>
            </Link>
            <Link to="/royxatdan-otish">
              <Button size="lg" variant="secondary" fullWidth>
                Salon egasiman
              </Button>
            </Link>
          </div>
        </Container>
      </section>

      <Container className="py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardBody>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-500" />
                </div>
                <h2 className="font-semibold text-gray-900">{title}</h2>
                <p className="mt-1 text-sm text-gray-500">{text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}
