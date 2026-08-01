import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarX, MapPin, Phone } from 'lucide-react';
import { formatDateUz, formatDurationUz } from '@gozal/shared/utils/time';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';

import { bookingApi, bookingKeys } from '../../api/booking.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import {
  Button,
  Card,
  CardBody,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
} from '../../components/ui';
import { cn } from '../../lib/cn';

const TABS = [
  { key: 'upcoming', label: 'Kelgusi' },
  { key: 'all', label: 'Hammasi' },
];

/** Faqat kutilayotgan va tasdiqlangan yozuvni bekor qilish mumkin */
const CANCELLABLE = ['pending', 'confirmed', 'awaiting_payment'];

function BookingCard({ booking, onCancel }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="font-semibold text-gray-900">
              {formatDateUz(booking.date)} · {booking.start}
            </p>
            <Link
              to={booking.salon ? `/salon/${booking.salon.slug}` : '#'}
              className="mt-0.5 block truncate text-sm text-brand-700 hover:underline"
            >
              {booking.salon?.name}
            </Link>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <ul className="space-y-1 text-sm text-gray-600">
          {booking.items.map((item, i) => (
            <li key={`${item.name}-${i}`} className="flex justify-between gap-3">
              <span className="truncate">{item.name}</span>
              <span className="shrink-0">{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-brand-50 pt-3 text-sm">
          <span className="text-gray-500">
            {booking.master?.fullName} · {formatDurationUz(booking.totalDuration)}
          </span>
          <span className="font-semibold text-brand-700">{formatPrice(booking.totalPrice)}</span>
        </div>

        {booking.cancelReason && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Bekor qilindi: {booking.cancelReason}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto text-xs text-gray-400">Kod: {booking.code}</span>

          {booking.salon?.phone && (
            <a href={`tel:${booking.salon.phone}`}>
              <Button variant="secondary" size="sm">
                <Phone className="h-4 w-4" />
                {formatPhone(booking.salon.phone)}
              </Button>
            </a>
          )}

          {CANCELLABLE.includes(booking.status) && (
            <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
              Bekor qilish
            </Button>
          )}
        </div>

        {booking.salon?.address && (
          <p className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5" />
            {booking.salon.district}, {booking.salon.address}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

export function MyBookingsPage() {
  // Shaxsiy sahifalar qidiruvga chiqmasin
  usePageMeta({ title: 'Yozuvlarim', noIndex: true });

  const [tab, setTab] = useState('upcoming');
  const [toCancel, setToCancel] = useState(null);
  const queryClient = useQueryClient();

  const params = tab === 'upcoming' ? { upcoming: true } : {};

  const {
    data: bookings = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: bookingKeys.myBookings(params),
    queryFn: () => bookingApi.myBookings(params),
  });

  const cancel = useMutation({
    mutationFn: (id) => bookingApi.cancel(id),
    onSuccess: () => {
      toast.success('Yozuv bekor qilindi');
      setToCancel(null);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      // Bo'shagan slot boshqa mijozga darhol ko'rinsin
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability-days'] });
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <Container className="py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Yozuvlarim</h1>

      <div className="mb-5 flex gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setTab(item.key)}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm font-medium transition',
              tab === item.key
                ? 'bg-brand-600 text-white'
                : 'bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title={tab === 'upcoming' ? 'Kelgusi yozuvingiz yo\u2019q' : 'Hali yozuv yo\u2019q'}
          description="Katalogdan salon tanlab, bo'sh vaqtga yoziling."
          action={
            <Link to="/salonlar">
              <Button>Salonlarni ko&apos;rish</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingCard key={booking.id} booking={booking} onCancel={setToCancel} />
          ))}
        </div>
      )}

      <ConfirmModal
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        onConfirm={() => cancel.mutate(toCancel.id)}
        loading={cancel.isPending}
        title="Yozuvni bekor qilasizmi?"
        description={
          toCancel
            ? `${formatDateUz(toCancel.date)}, ${toCancel.start} — ${toCancel.salon?.name}. Boshlanishiga 2 soatdan kam qolgan bo'lsa, salonga qo'ng'iroq qilish kerak bo'ladi.`
            : ''
        }
        confirmText="Ha, bekor qilaman"
      />
    </Container>
  );
}

export default MyBookingsPage;
