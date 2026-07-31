import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarDays, CircleAlert, Clock, Scissors, Users } from 'lucide-react';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { Badge, Button, Card, CardBody, ErrorState, Skeleton } from '../../components/ui';

const STATUS_INFO = {
  draft: {
    tone: 'slate',
    label: 'To\u2019ldirilmoqda',
    text: 'Salon hali katalogda ko\u2019rinmaydi. Ma\u2019lumotlarni to\u2019ldiring va tekshiruvga yuboring.',
  },
  pending: {
    tone: 'amber',
    label: 'Tekshiruvda',
    text: 'Administrator tekshirmoqda. Odatda bir ish kuni ichida javob beriladi.',
  },
  active: { tone: 'emerald', label: 'Faol', text: 'Salon katalogda ko\u2019rinmoqda.' },
  blocked: { tone: 'rose', label: 'Bloklangan', text: 'Salon katalogdan olib qo\u2019yilgan.' },
};

function Stat({ icon: Icon, label, value, to }) {
  const body = (
    <CardBody className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50">
        <Icon className="h-5 w-5 text-brand-500" />
      </span>
      <span>
        <span className="block text-xl font-semibold text-gray-900">{value}</span>
        <span className="block text-sm text-gray-500">{label}</span>
      </span>
    </CardBody>
  );

  return to ? (
    <Link to={to}>
      <Card className="transition hover:border-brand-300">{body}</Card>
    </Link>
  ) : (
    <Card>{body}</Card>
  );
}

export function OwnerDashboard() {
  const queryClient = useQueryClient();

  const salonQuery = useQuery({ queryKey: ownerKeys.salon, queryFn: ownerApi.salon, retry: false });
  const summaryQuery = useQuery({
    queryKey: ownerKeys.summary,
    queryFn: ownerApi.summary,
    enabled: Boolean(salonQuery.data),
  });

  const submit = useMutation({
    mutationFn: ownerApi.submitSalon,
    onSuccess: () => {
      toast.success('Salon tekshiruvga yuborildi');
      queryClient.invalidateQueries({ queryKey: ownerKeys.salon });
    },
    onError: (error) => {
      // Backend yetishmayotgan narsalarni RO'YXAT qilib qaytaradi — hammasini ko'rsatamiz
      const issues = error.errors?.map((e) => e.message);
      if (issues?.length) issues.forEach((message) => toast.error(message));
      else toast.error(error.message);
    },
  });

  if (salonQuery.isPending) return <Skeleton className="h-64 rounded-2xl" />;

  // Salon hali yaratilmagan
  if (salonQuery.isError && salonQuery.error?.status === 404) {
    return (
      <Card>
        <CardBody className="text-center">
          <h1 className="text-lg font-semibold text-gray-900">Salon yarating</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
            Salon ma&apos;lumotlarini kiriting, xizmat va ish vaqtini qo&apos;shing — keyin
            administrator tasdiqlaydi va salon katalogda ko&apos;rinadi.
          </p>
          <Link to="/kabinet/salon" className="mt-5 inline-block">
            <Button>Boshlash</Button>
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (salonQuery.isError) return <ErrorState onRetry={salonQuery.refetch} />;

  const salon = salonQuery.data;
  const status = STATUS_INFO[salon.status] || STATUS_INFO.draft;
  const summary = summaryQuery.data;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{salon.name}</h1>
          <p className="mt-1 text-sm text-gray-500">
            {salon.city}, {salon.district}
          </p>
        </div>
        <Badge tone={status.tone}>{status.label}</Badge>
      </div>

      <Card>
        <CardBody className="flex flex-wrap items-center gap-3">
          <CircleAlert className="h-5 w-5 shrink-0 text-brand-500" />
          <p className="min-w-0 flex-1 text-sm text-gray-600">{status.text}</p>

          {salon.status === 'draft' && (
            <Button size="sm" loading={submit.isPending} onClick={() => submit.mutate()}>
              Tekshiruvga yuborish
            </Button>
          )}
        </CardBody>
      </Card>

      {salon.rejectReason && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Administrator izohi: {salon.rejectReason}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={CalendarDays}
          label="Bugungi yozuvlar"
          value={summary?.today ?? '—'}
          to="/kabinet/yozuvlar"
        />
        <Stat
          icon={Clock}
          label="Tasdiq kutmoqda"
          value={summary?.pending ?? '—'}
          to="/kabinet/yozuvlar"
        />
        <Stat icon={CalendarDays} label="Kelgusi yozuvlar" value={summary?.upcoming ?? '—'} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link to="/kabinet/jadval">
          <Card className="h-full transition hover:border-brand-300">
            <CardBody className="flex items-start gap-3">
              <Clock className="h-5 w-5 shrink-0 text-brand-500" />
              <span>
                <span className="block font-medium text-gray-900">Ish vaqti</span>
                <span className="block text-sm text-gray-500">
                  Mijozlar bo&apos;sh vaqtni shu jadval asosida ko&apos;radi
                </span>
              </span>
            </CardBody>
          </Card>
        </Link>

        <Link to="/kabinet/xizmatlar">
          <Card className="h-full transition hover:border-brand-300">
            <CardBody className="flex items-start gap-3">
              <Scissors className="h-5 w-5 shrink-0 text-brand-500" />
              <span>
                <span className="block font-medium text-gray-900">Xizmatlar</span>
                <span className="block text-sm text-gray-500">
                  Nom, narx va davomiylik — davomiyligisiz slot hisoblanmaydi
                </span>
              </span>
            </CardBody>
          </Card>
        </Link>

        <Link to="/kabinet/mutaxassislar">
          <Card className="h-full transition hover:border-brand-300">
            <CardBody className="flex items-start gap-3">
              <Users className="h-5 w-5 shrink-0 text-brand-500" />
              <span>
                <span className="block font-medium text-gray-900">Mutaxassislar</span>
                <span className="block text-sm text-gray-500">Xodimlar va ularning jadvali</span>
              </span>
            </CardBody>
          </Card>
        </Link>

        <Link to={`/salon/${salon.slug}`}>
          <Card className="h-full transition hover:border-brand-300">
            <CardBody className="flex items-start gap-3">
              <CalendarDays className="h-5 w-5 shrink-0 text-brand-500" />
              <span>
                <span className="block font-medium text-gray-900">
                  Salonni mijoz ko&apos;zi bilan ko&apos;rish
                </span>
                <span className="block text-sm text-gray-500">Ommaviy sahifangiz</span>
              </span>
            </CardBody>
          </Card>
        </Link>
      </div>
    </div>
  );
}

export default OwnerDashboard;
