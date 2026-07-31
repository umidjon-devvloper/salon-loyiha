import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CalendarDays, Clock, Store, Users } from 'lucide-react';
import { formatPrice } from '@gozal/shared/utils/format';

import { adminApi, adminKeys } from '../../api/admin.api';
import { Card, CardBody, ErrorState, Skeleton } from '../../components/ui';

function Stat({ icon: Icon, label, value, hint, to }) {
  const card = (
    <Card className={to ? 'h-full transition hover:border-brand-300' : 'h-full'}>
      <CardBody className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
          <Icon className="h-5 w-5 text-brand-500" />
        </span>
        <span className="min-w-0">
          <span className="block text-xl font-semibold text-gray-900">{value}</span>
          <span className="block text-sm text-gray-500">{label}</span>
          {hint && <span className="mt-0.5 block text-xs text-gray-400">{hint}</span>}
        </span>
      </CardBody>
    </Card>
  );

  return to ? <Link to={to}>{card}</Link> : card;
}

export function AdminDashboard() {
  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.stats,
    queryFn: adminApi.stats,
  });

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Statistika</h1>

      {/* Moderatsiya navbati birinchi: kutayotgan salon bo'lsa, ish shundan boshlanadi */}
      {data.salons.pending > 0 && (
        <Link to="/admin/salonlar?status=pending">
          <Card className="border-amber-200 bg-amber-50 transition hover:border-amber-300">
            <CardBody className="flex items-center gap-3">
              <Clock className="h-5 w-5 shrink-0 text-amber-600" />
              <p className="text-sm text-amber-900">
                <span className="font-semibold">{data.salons.pending} ta salon</span> tekshiruvni
                kutmoqda
              </p>
            </CardBody>
          </Card>
        </Link>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={Store}
          label="Faol salonlar"
          value={data.salons.active}
          hint={`Jami ${data.salons.total} · TOP ${data.salons.top}`}
          to="/admin/salonlar"
        />
        <Stat
          icon={Users}
          label="Foydalanuvchilar"
          value={data.users.total}
          hint={`${data.users.owners} ta salon egasi`}
          to="/admin/foydalanuvchilar"
        />
        <Stat
          icon={CalendarDays}
          label="Bugungi yozuvlar"
          value={data.bookings.today}
          hint={`Jami ${data.bookings.total}`}
          to="/admin/yozuvlar"
        />
        <Stat
          icon={Store}
          label="TOP e'londan tushum"
          value={formatPrice(data.revenue.topOrdersTotal)}
          hint="Boshidan beri"
        />
      </div>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-semibold text-gray-900">Yozuvlar holati bo&apos;yicha</h2>
          <ul className="grid gap-2 sm:grid-cols-3">
            {Object.entries(data.bookings.byStatus).map(([status, count]) => (
              <li key={status} className="flex justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">{status}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <h2 className="mb-3 font-semibold text-gray-900">Salonlar holati</h2>
          <ul className="grid gap-2 sm:grid-cols-4">
            {['active', 'pending', 'draft', 'blocked'].map((key) => (
              <li key={key} className="flex justify-between rounded-xl bg-gray-50 px-3 py-2">
                <span className="text-sm text-gray-600">{key}</span>
                <span className="text-sm font-semibold text-gray-900">{data.salons[key]}</span>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}

export default AdminDashboard;
