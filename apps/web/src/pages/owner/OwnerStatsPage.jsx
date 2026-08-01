import { useQuery } from '@tanstack/react-query';
import { formatPrice } from '@gozal/shared/utils/format';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { Card, CardBody, ErrorState, Skeleton } from '../../components/ui';

const PERIODS = [
  { key: 'today', label: 'Bugun' },
  { key: 'week', label: "So'nggi 7 kun" },
  { key: 'month', label: "So'nggi 30 kun" },
];

function Row({ label, value, muted = false }) {
  return (
    <div className="flex justify-between gap-3 text-sm">
      <span className="text-gray-500">{label}</span>
      <span className={muted ? 'text-gray-500' : 'font-medium text-gray-900'}>{value}</span>
    </div>
  );
}

export function OwnerStatsPage() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: ownerKeys.stats,
    queryFn: ownerApi.stats,
  });

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Statistika</h1>
        <p className="mt-1 text-sm text-gray-500">
          Tushum faqat yakunlangan yozuvlar bo&apos;yicha hisoblanadi.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {PERIODS.map(({ key, label }) => {
          const period = data[key];

          return (
            <Card key={key}>
              <CardBody className="space-y-2">
                <h2 className="font-semibold text-gray-900">{label}</h2>

                <p className="text-2xl font-semibold text-brand-700">
                  {formatPrice(period.revenue)}
                </p>

                <div className="space-y-1 border-t border-brand-50 pt-2">
                  <Row label="Jami yozuv" value={period.total} />
                  <Row label="Yakunlangan" value={period.completed} />
                  <Row label="Tasdiqlangan" value={period.confirmed} />
                  <Row label="Bekor qilingan" value={period.cancelled} muted />
                  <Row label="Kelmadi" value={period.noShow} muted />
                </div>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default OwnerStatsPage;
