import { Link } from 'react-router-dom';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Search, Store } from 'lucide-react';

import { adminApi, adminKeys } from '../../api/admin.api';
import { Pagination } from '../../components/catalog/Pagination';
import { Badge, Card, EmptyState, ErrorState, Input, Skeleton } from '../../components/ui';
import { useFilterParams } from '../../hooks/useFilterParams';
import { cn } from '../../lib/cn';

const STATUS_TABS = [
  { key: '', label: 'Hammasi' },
  { key: 'pending', label: 'Tekshiruvda' },
  { key: 'active', label: 'Faol' },
  { key: 'draft', label: 'To\u2019ldirilmoqda' },
  { key: 'blocked', label: 'Bloklangan' },
];

const STATUS_TONE = {
  active: 'emerald',
  pending: 'amber',
  draft: 'slate',
  blocked: 'rose',
};

export function AdminSalonsPage() {
  const [filters, patch] = useFilterParams();

  const params = {
    status: filters.status || undefined,
    q: filters.q || undefined,
    page: Number(filters.page) || 1,
    limit: 20,
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.salons(params),
    queryFn: () => adminApi.salons(params),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Salonlar</h1>

      <div className="flex flex-wrap gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key || 'all'}
            type="button"
            onClick={() => patch({ status: tab.key })}
            className={cn(
              'rounded-xl px-3 py-1.5 text-sm font-medium transition',
              (filters.status || '') === tab.key
                ? 'bg-gray-900 text-white'
                : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Salon nomi"
          className="pl-10"
          defaultValue={filters.q || ''}
          onKeyDown={(e) => e.key === 'Enter' && patch({ q: e.target.value })}
          onBlur={(e) => patch({ q: e.target.value })}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Store} title="Salon topilmadi" />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-gray-100">
              {data.items.map((salon) => (
                <li key={salon.id}>
                  <Link
                    to={`/admin/salonlar/${salon.id}`}
                    className="flex items-center gap-3 p-3 transition hover:bg-gray-50 sm:p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-medium text-gray-900">{salon.name}</span>
                        {salon.isTop && <Badge tone="brand">TOP</Badge>}
                        {salon.isVerified && <Badge tone="emerald">Tasdiqlangan</Badge>}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-gray-500">
                        {salon.district} · {salon.owner?.fullName} · {salon.owner?.phone}
                      </p>
                    </div>

                    <span className="shrink-0 text-sm text-gray-400">
                      {salon.bookingCount} yozuv
                    </span>

                    <Badge tone={STATUS_TONE[salon.status] || 'slate'}>{salon.status}</Badge>
                  </Link>
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

export default AdminSalonsPage;
