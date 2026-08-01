import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { BadgeCheck, MapPin, Phone, Star } from 'lucide-react';
import { formatServicePrice, formatPhone, formatPrice } from '@gozal/shared/utils/format';
import { formatDurationUz, WEEKDAYS_UZ } from '@gozal/shared/utils/time';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { Badge, Button, Card, CardBody, ErrorState, Skeleton } from '../../components/ui';

/** Bugungi kun jadvalda ajratib ko'rsatiladi */
const todayWeekday = () => new Date().getDay();

function Gallery({ salon }) {
  const [active, setActive] = useState(0);
  const images = salon.images?.length ? salon.images : [];
  const main = images[active]?.url || salon.cover;

  return (
    <div>
      <div className="aspect-[16/9] overflow-hidden rounded-2xl bg-brand-50 sm:aspect-[21/9]">
        {main ? (
          <img src={main} alt={salon.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
            <span className="text-5xl font-semibold text-brand-500">{salon.name[0]}</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, i) => (
            <button
              key={image.name}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`${i + 1}-rasm`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? 'border-brand-500' : 'border-transparent opacity-70'
              }`}
            >
              <img src={image.thumb} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function WorkingHours({ days }) {
  const today = todayWeekday();

  return (
    <Card>
      <CardBody className="p-4 sm:p-5">
        <h2 className="mb-3 font-semibold text-gray-900">Ish vaqti</h2>
        <ul className="space-y-1.5 text-sm">
          {days.map((day) => (
            <li
              key={day.weekday}
              className={`flex justify-between gap-3 ${
                day.weekday === today ? 'font-semibold text-brand-700' : 'text-gray-600'
              }`}
            >
              <span>{WEEKDAYS_UZ[day.weekday]}</span>
              <span>
                {day.isOpen ? (
                  <>
                    {day.start}–{day.end}
                    {day.breaks?.length > 0 && (
                      <span className="ml-1 text-gray-400">
                        (tanaffus {day.breaks.map((b) => `${b.start}–${b.end}`).join(', ')})
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-gray-400">Dam olish</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

export function SalonDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const {
    data: salon,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: catalogKeys.salon(slug),
    queryFn: () => catalogApi.salon(slug),
  });

  // Salon sahifasi — asosiy SEO kirish nuqtasi: odamlar salon nomini qidiradi
  usePageMeta({
    title: salon ? `${salon.name} — ${salon.district}` : 'Salon',
    description: salon
      ? `${salon.name}, ${salon.city} ${salon.district}. ${salon.serviceCount} ta xizmat, ish vaqti va bo'sh vaqtlar. Onlayn band qiling.`
      : undefined,
    image: salon?.cover || undefined,
  });

  if (isPending) {
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="aspect-[16/9] w-full rounded-2xl" />
        <Skeleton className="h-7 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-10">
        <ErrorState message="Salonni yuklab bo'lmadi" onRetry={refetch} />
      </Container>
    );
  }

  const allServices = salon.serviceGroups.flatMap((g) => g.services);
  const chosen = allServices.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (id) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const startBooking = () => {
    const master = salon.masters[0];
    if (!master) return;
    navigate(`/band-qilish/${master.id}?services=${selected.join(',')}`);
  };

  return (
    <>
      <Container className="py-4 sm:py-6">
        <Gallery salon={salon} />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">{salon.name}</h1>
              {salon.isTop && <Badge tone="brand">TOP</Badge>}
              {salon.isVerified && (
                <span className="flex items-center gap-1 text-sm text-emerald-600">
                  <BadgeCheck className="h-4 w-4" />
                  Tasdiqlangan
                </span>
              )}
            </div>

            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="h-4 w-4" />
              {salon.city}, {salon.district}
              {salon.address && ` · ${salon.address}`}
            </p>

            {salon.reviewCount > 0 && (
              <p className="mt-1 flex items-center gap-1 text-sm text-gray-600">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {salon.rating.toFixed(1)}
                <span className="text-gray-400">({salon.reviewCount} baho)</span>
              </p>
            )}
          </div>

          <a href={`tel:${salon.phone}`} className="shrink-0">
            <Button variant="secondary">
              <Phone className="h-4 w-4" />
              {formatPhone(salon.phone)}
            </Button>
          </a>
        </div>

        {salon.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
            {salon.description}
          </p>
        )}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <section>
              <h2 className="mb-3 font-semibold text-gray-900">Xizmatlar</h2>

              {salon.serviceGroups.length === 0 ? (
                <Card>
                  <CardBody className="text-sm text-gray-500">
                    Salon hali xizmatlarini kiritmagan. Qo&apos;ng&apos;iroq qilib so&apos;rashingiz
                    mumkin.
                  </CardBody>
                </Card>
              ) : (
                <div className="space-y-5">
                  {salon.serviceGroups.map((group) => (
                    <div key={group.slug}>
                      <h3 className="mb-2 text-sm font-medium text-gray-500">{group.name}</h3>
                      <Card>
                        <ul className="divide-y divide-brand-50">
                          {group.services.map((service) => (
                            <li key={service.id}>
                              <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-brand-50/60 sm:p-4">
                                <input
                                  type="checkbox"
                                  checked={selected.includes(service.id)}
                                  onChange={() => toggle(service.id)}
                                  className="h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block font-medium text-gray-900">
                                    {service.name}
                                  </span>
                                  <span className="block text-sm text-gray-500">
                                    {formatDurationUz(service.durationMin)}
                                  </span>
                                </span>
                                <span className="shrink-0 text-sm font-semibold text-brand-700">
                                  {formatServicePrice(service)}
                                </span>
                              </label>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section>
              <h2 className="mb-3 font-semibold text-gray-900">Mutaxassislar</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {salon.masters.map((master) => (
                  <Link
                    key={master.id}
                    to={`/mutaxassis/${master.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm transition hover:border-brand-300"
                  >
                    <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                      {master.photoThumb ? (
                        <img
                          src={master.photoThumb}
                          alt={master.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-400">
                          {master.fullName[0]}
                        </span>
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-gray-900">
                        {master.fullName}
                      </span>
                      {master.experienceYears > 0 && (
                        <span className="block text-sm text-gray-500">
                          {master.experienceYears} yil tajriba
                        </span>
                      )}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <WorkingHours days={salon.workingHours} />

            <Card className="hidden lg:block">
              <CardBody className="p-4 sm:p-5">
                <h2 className="font-semibold text-gray-900">Band qilish</h2>
                <p className="mt-1 text-sm text-gray-500">
                  {chosen.length
                    ? `${chosen.length} ta xizmat · ${formatDurationUz(totalDuration)}`
                    : 'Xizmatlarni tanlang'}
                </p>
                <p className="mt-2 text-lg font-semibold text-brand-700">
                  {formatPrice(totalPrice)}
                </p>
                <Button fullWidth className="mt-4" disabled={!chosen.length} onClick={startBooking}>
                  Band qilish
                </Button>
              </CardBody>
            </Card>
          </div>
        </div>
      </Container>

      {/* Mobilda pastda turadi. MobileNav ustida ko'rinishi uchun bottom-16 */}
      {chosen.length > 0 && (
        <div className="fixed inset-x-0 bottom-16 z-30 border-t border-brand-100 bg-white p-3 shadow-lg sm:bottom-0 lg:hidden">
          <Container className="flex items-center gap-3 px-0 sm:px-0">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-gray-600">
                {chosen.length} ta xizmat · {formatDurationUz(totalDuration)}
              </p>
              <p className="font-semibold text-brand-700">{formatPrice(totalPrice)}</p>
            </div>
            <Button onClick={startBooking}>Band qilish</Button>
          </Container>
        </div>
      )}
    </>
  );
}

export default SalonDetailPage;
