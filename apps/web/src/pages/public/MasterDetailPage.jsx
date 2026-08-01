import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarClock, MapPin, Star } from 'lucide-react';
import { formatPrice, formatServicePrice } from '@gozal/shared/utils/format';
import { formatDurationUz, WEEKDAYS_UZ } from '@gozal/shared/utils/time';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { Badge, Button, Card, CardBody, ErrorState, Skeleton } from '../../components/ui';

export function MasterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [selected, setSelected] = useState([]);

  const {
    data: master,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: catalogKeys.master(id),
    queryFn: () => catalogApi.master(id),
  });

  usePageMeta({
    title: master ? master.fullName : 'Mutaxassis',
    description: master
      ? `${master.fullName}${master.salon ? ` — ${master.salon.name}` : ''}. Xizmatlar, narxlar va bo'sh vaqtlar.`
      : undefined,
    image: master?.photo || undefined,
  });

  if (isPending) {
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container className="py-10">
        <ErrorState message="Mutaxassisni yuklab bo'lmadi" onRetry={refetch} />
      </Container>
    );
  }

  const chosen = master.services.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const toggle = (id_) =>
    setSelected((prev) => (prev.includes(id_) ? prev.filter((x) => x !== id_) : [...prev, id_]));

  return (
    <Container className="py-6">
      <Card>
        <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-brand-50">
            {master.photo ? (
              <img
                src={master.photo}
                alt={master.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-3xl font-semibold text-brand-400">
                {master.fullName[0]}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-gray-900">{master.fullName}</h1>

            {master.salon && (
              <Link
                to={`/salon/${master.salon.slug}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand-700 hover:underline"
              >
                <MapPin className="h-4 w-4" />
                {master.salon.name} · {master.salon.district}
              </Link>
            )}

            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {master.experienceYears > 0 && <span>{master.experienceYears} yil tajriba</span>}
              {master.rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  {master.rating.toFixed(1)}
                </span>
              )}
            </div>

            {master.specialties?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {master.specialties.map((s) => (
                  <Badge key={s.slug} tone="brand">
                    {s.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {master.bio && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-gray-600">
          {master.bio}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-3 font-semibold text-gray-900">Xizmatlar</h2>

          {master.services.length === 0 ? (
            <Card>
              <CardBody className="text-sm text-gray-500">
                Bu mutaxassisga biriktirilgan xizmat yo&apos;q.
              </CardBody>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-brand-50">
                {master.services.map((service) => (
                  <li key={service.id}>
                    <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-brand-50/60 sm:p-4">
                      <input
                        type="checkbox"
                        checked={selected.includes(service.id)}
                        onChange={() => toggle(service.id)}
                        className="h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900">{service.name}</span>
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
          )}
        </section>

        <div className="space-y-4">
          <Card>
            <CardBody className="p-4 sm:p-5">
              <h2 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <CalendarClock className="h-4 w-4 text-brand-500" />
                Ish vaqti
              </h2>

              {master.hasOwnSchedule ? (
                <ul className="space-y-1.5 text-sm">
                  {master.workingHours.map((day) => (
                    <li key={day.weekday} className="flex justify-between gap-3 text-gray-600">
                      <span>{WEEKDAYS_UZ[day.weekday]}</span>
                      <span>
                        {day.isOpen ? (
                          `${day.start}–${day.end}`
                        ) : (
                          <span className="text-gray-400">Dam olish</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  Salon jadvali bo&apos;yicha ishlaydi.{' '}
                  {master.salon && (
                    <Link to={`/salon/${master.salon.slug}`} className="text-brand-700 underline">
                      Jadvalni ko&apos;rish
                    </Link>
                  )}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody className="p-4 sm:p-5">
              <p className="text-sm text-gray-500">
                {chosen.length
                  ? `${chosen.length} ta xizmat · ${formatDurationUz(totalDuration)}`
                  : 'Xizmatlarni tanlang'}
              </p>
              <p className="mt-1 text-lg font-semibold text-brand-700">{formatPrice(totalPrice)}</p>
              <Button
                fullWidth
                className="mt-4"
                disabled={!chosen.length}
                onClick={() => navigate(`/band-qilish/${master.id}?services=${selected.join(',')}`)}
              >
                Band qilish
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </Container>
  );
}

export default MasterDetailPage;
