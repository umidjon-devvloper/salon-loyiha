import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import { formatDateUz, toHHMM } from '@gozal/shared/utils/time';
import { formatPhone, formatPrice } from '@gozal/shared/utils/format';

import { adminApi, adminKeys } from '../../api/admin.api';
import { Pagination } from '../../components/catalog/Pagination';
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Select,
  Skeleton,
  StatusBadge,
} from '../../components/ui';
import { useFilterParams } from '../../hooks/useFilterParams';

const STATUSES = ['awaiting_payment', 'pending', 'confirmed', 'completed', 'cancelled', 'no_show'];

export function AdminBookingsPage() {
  const [filters, patch] = useFilterParams();

  const params = {
    from: filters.from || undefined,
    to: filters.to || undefined,
    status: filters.status || undefined,
    page: Number(filters.page) || 1,
    limit: 20,
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.bookings(params),
    queryFn: () => adminApi.bookings(params),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Yozuvlar</h1>

      <div className="grid gap-2 sm:grid-cols-3">
        <Input
          label="Sanadan"
          type="date"
          value={filters.from || ''}
          onChange={(e) => patch({ from: e.target.value })}
        />
        <Input
          label="Sanagacha"
          type="date"
          value={filters.to || ''}
          onChange={(e) => patch({ to: e.target.value })}
        />
        <Select
          label="Holat"
          placeholder="Hammasi"
          value={filters.status || ''}
          options={STATUSES.map((s) => ({ value: s, label: s }))}
          onChange={(e) => patch({ status: e.target.value })}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={CalendarX} title="Yozuv topilmadi" />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-gray-100">
              {data.items.map((booking) => (
                <li key={booking.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {formatDateUz(booking.date, { withWeekday: false })} ·{' '}
                        {toHHMM(booking.startMin)}
                      </span>
                      {booking.source === 'manual' && <Badge tone="slate">Qo&apos;lda</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-gray-500">
                      {booking.salon?.name} · {booking.clientName} ·{' '}
                      {formatPhone(booking.clientPhone)}
                    </p>
                  </div>

                  <span className="shrink-0 text-sm font-medium text-gray-700">
                    {formatPrice(booking.totalPrice)}
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{booking.code}</span>
                  <StatusBadge status={booking.status} />
                </li>
              ))}
            </ul>
          </Card>

          <Pagination
            page={data.meta.page}
            pages={data.meta.pages}
            onChange={(page) => patch({ page })}
          />
        </>
      )}
    </div>
  );
}

export default AdminBookingsPage;
