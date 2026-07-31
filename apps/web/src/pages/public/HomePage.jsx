import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarCheck, Clock, ShieldCheck, Wallet } from 'lucide-react';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { CategoryGrid } from '../../components/catalog/CategoryGrid';
import { SearchBar } from '../../components/catalog/SearchBar';
import { SalonCard, SalonCardSkeleton } from '../../components/catalog/SalonCard';
import { Button, Card, CardBody } from '../../components/ui';

const benefits = [
  { icon: Clock, title: 'Onlayn yozuv 24/7', text: 'Salon yopiq bo\u2019lsa ham navbat olasiz' },
  {
    icon: CalendarCheck,
    title: 'Aniq bo\u2019sh vaqt',
    text: 'Ko\u2019rinayotgan vaqt haqiqatan bo\u2019sh',
  },
  {
    icon: Wallet,
    title: 'Narxlar oldindan',
    text: 'Xizmat narxi va davomiyligi ko\u2019rinib turadi',
  },
  {
    icon: ShieldCheck,
    title: 'Tekshirilgan salonlar',
    text: 'Har bir salon moderatsiyadan o\u2019tadi',
  },
];

export function HomePage() {
  const { data: categories = [], isPending: categoriesLoading } = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });

  const topParams = { sort: 'top', page: 1, limit: 6 };
  const { data: topSalons, isPending: salonsLoading } = useQuery({
    queryKey: catalogKeys.salons(topParams),
    queryFn: () => catalogApi.salons(topParams),
  });

  return (
    <>
      <section className="bg-gradient-to-b from-brand-50 to-white">
        <Container className="py-10 text-center sm:py-16">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Go&apos;zallik salonlariga onlayn navbat
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-gray-600">
            Bo&apos;sh vaqtni ko&apos;ring, xizmatni tanlang va navbatingizni band qiling.
            Qo&apos;ng&apos;iroq qilish shart emas.
          </p>

          <div className="mx-auto mt-6 max-w-2xl">
            <SearchBar />
          </div>
        </Container>
      </section>

      <Container className="py-8 sm:py-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Kategoriyalar</h2>
          <Link to="/salonlar" className="text-sm font-medium text-brand-700 hover:underline">
            Barcha salonlar
          </Link>
        </div>

        <CategoryGrid categories={categories} loading={categoriesLoading} />
      </Container>

      <Container className="pb-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Tavsiya etamiz</h2>
          <Link to="/salonlar" className="text-sm font-medium text-brand-700 hover:underline">
            Hammasi
          </Link>
        </div>

        {salonsLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <SalonCardSkeleton key={i} />
            ))}
          </div>
        ) : topSalons?.items.length ? (
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {topSalons.items.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        ) : (
          <Card>
            <CardBody className="text-center text-sm text-gray-500">
              Katalog hozircha bo&apos;sh. Birinchi bo&apos;lib salonini qo&apos;shing.
              <div className="mt-4">
                <Link to="/royxatdan-otish">
                  <Button variant="secondary">Salon egasiman</Button>
                </Link>
              </div>
            </CardBody>
          </Card>
        )}
      </Container>

      <Container className="pb-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: Icon, title, text }) => (
            <Card key={title}>
              <CardBody>
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
                  <Icon className="h-5 w-5 text-brand-500" />
                </div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="mt-1 text-sm text-gray-500">{text}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
}

export default HomePage;
