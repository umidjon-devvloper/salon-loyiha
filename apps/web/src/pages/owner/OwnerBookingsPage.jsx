import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarX, ChevronLeft, ChevronRight, Phone, Plus } from 'lucide-react';
import { addDays, formatDateUz, formatDurationUz, todayStr } from '@gozal/shared/utils/time';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { ManualBookingModal } from './ManualBookingModal';
import {
  Badge,
  Button,
  Card,
  CardBody,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Skeleton,
  StatusBadge,
} from '../../components/ui';

/** Kun bo'yicha ro'yxat — mobilda ham, desktopda ham bir xil o'qiladi */
function BookingRow({ booking, onConfirm, onCancel, onComplete, onNoShow }) {
  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-gray-900">
              {booking.start}–{booking.end}
              <span className="ml-2 font-normal text-gray-500">
                {formatDurationUz(booking.totalDuration)}
              </span>
            </p>
            <p className="mt-0.5 text-sm text-gray-600">{booking.master?.fullName}</p>
          </div>

          <div className="flex items-center gap-2">
            {booking.source === 'manual' && <Badge tone="slate">Qo&apos;lda</Badge>}
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="rounded-xl bg-brand-50/60 px-3 py-2">
          <p className="font-medium text-gray-900">{booking.clientName}</p>
          <a
            href={`tel:${booking.clientPhone}`}
            className="mt-0.5 flex items-center gap-1.5 text-sm text-brand-700"
          >
            <Phone className="h-3.5 w-3.5" />
            {formatPhone(booking.clientPhone)}
          </a>
          {booking.note && <p className="mt-1 text-sm text-gray-600">{booking.note}</p>}
        </div>

        <ul className="space-y-1 text-sm text-gray-600">
          {booking.items.map((item, i) => (
            <li key={i} className="flex justify-between gap-3">
              <span className="truncate">{item.name}</span>
              <span className="shrink-0">{formatPrice(item.price)}</span>
            </li>
          ))}
        </ul>

        {booking.cancelReason && (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {booking.cancelReason}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-brand-50 pt-3">
          <span className="mr-auto text-xs text-gray-400">{booking.code}</span>

          {booking.status === 'pending' && (
            <>
              <Button size="sm" onClick={() => onConfirm(booking)}>
                Tasdiqlash
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
                Bekor qilish
              </Button>
            </>
          )}

          {booking.status === 'confirmed' && (
            <>
              <Button variant="secondary" size="sm" onClick={() => onComplete(booking)}>
                Yakunlandi
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onNoShow(booking)}>
                Kelmadi
              </Button>
              <Button variant="ghost" size="sm" onClick={() => onCancel(booking)}>
                Bekor qilish
              </Button>
            </>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export function OwnerBookingsPage() {
  const queryClient = useQueryClient();
  const [date, setDate] = useState(todayStr());
  const [manualOpen, setManualOpen] = useState(false);
  const [toCancel, setToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [toNoShow, setToNoShow] = useState(null);

  const params = { date };

  const {
    data: bookings = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ownerKeys.bookings(params),
    queryFn: () => ownerApi.bookings(params),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['owner-summary'] });
    queryClient.invalidateQueries({ queryKey: ['availability'] });
    queryClient.invalidateQueries({ queryKey: ['availability-days'] });
  };

  const setStatus = useMutation({
    mutationFn: ({ id, status, reason }) =>
      ownerApi.setBookingStatus(id, { status, cancelReason: reason || '' }),
    onSuccess: () => {
      toast.success('Holat yangilandi');
      setToCancel(null);
      setCancelReason('');
      setToNoShow(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const shift = (delta) => setDate(addDays(date, delta));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Yozuvlar</h1>
        <Button onClick={() => setManualOpen(true)}>
          <Plus className="h-4 w-4" />
          Qo&apos;lda yozuv
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => shift(-1)} aria-label="Oldingi kun">
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <span className="min-w-44 text-center font-medium text-gray-900">{formatDateUz(date)}</span>

        <Button variant="secondary" size="sm" onClick={() => shift(1)} aria-label="Keyingi kun">
          <ChevronRight className="h-4 w-4" />
        </Button>

        <Button
          variant={date === todayStr() ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => setDate(todayStr())}
        >
          Bugun
        </Button>

        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          aria-label="Sana tanlash"
          className="h-9 rounded-xl border border-gray-200 px-3 text-sm focus:border-brand-500 focus:outline-none"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon={CalendarX}
          title="Bu kunda yozuv yo'q"
          description="Telefon orqali kelgan mijozni qo'lda kiritishingiz mumkin."
          action={
            <Button onClick={() => setManualOpen(true)}>Qo&apos;lda yozuv qo&apos;shish</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => (
            <BookingRow
              key={booking.id}
              booking={booking}
              onConfirm={(b) => setStatus.mutate({ id: b.id, status: 'confirmed' })}
              onComplete={(b) => setStatus.mutate({ id: b.id, status: 'completed' })}
              onNoShow={setToNoShow}
              onCancel={setToCancel}
            />
          ))}
        </div>
      )}

      <ManualBookingModal
        open={manualOpen}
        date={date}
        onClose={() => setManualOpen(false)}
        onCreated={invalidate}
      />

      {/* Bekor qilishda sabab majburiy — mijozga aynan shu matn ko'rinadi */}
      <Modal
        open={Boolean(toCancel)}
        onClose={() => setToCancel(null)}
        title="Yozuvni bekor qilish"
        description={toCancel ? `${toCancel.clientName} · ${toCancel.start}` : ''}
        footer={
          <>
            <Button variant="ghost" onClick={() => setToCancel(null)}>
              Yopish
            </Button>
            <Button
              variant="danger"
              loading={setStatus.isPending}
              disabled={cancelReason.trim().length === 0}
              onClick={() =>
                setStatus.mutate({ id: toCancel.id, status: 'cancelled', reason: cancelReason })
              }
            >
              Bekor qilish
            </Button>
          </>
        }
      >
        <Input
          label="Sababi"
          required
          placeholder="Masalan: usta kasal bo'lib qoldi"
          hint="Bu matn mijozga ko'rinadi"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
      </Modal>

      <ConfirmModal
        open={Boolean(toNoShow)}
        onClose={() => setToNoShow(null)}
        onConfirm={() => setStatus.mutate({ id: toNoShow.id, status: 'no_show' })}
        loading={setStatus.isPending}
        danger
        title="Mijoz kelmadimi?"
        description={
          toNoShow
            ? `${toNoShow.clientName} · ${toNoShow.start}. Buni keyin qaytarib bo'lmaydi.`
            : ''
        }
        confirmText="Ha, kelmadi"
      />
    </div>
  );
}

export default OwnerBookingsPage;
