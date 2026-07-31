import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { KeyRound, Search, Users } from 'lucide-react';
import { formatPhone } from '@gozal/shared/utils/format';

import { adminApi, adminKeys } from '../../api/admin.api';
import { Pagination } from '../../components/catalog/Pagination';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  PasswordInput,
  Select,
  Skeleton,
} from '../../components/ui';
import { useFilterParams } from '../../hooks/useFilterParams';

const ROLE_LABEL = { client: 'Mijoz', owner: 'Salon egasi', admin: 'Administrator' };

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const [filters, patch] = useFilterParams();
  const [passwordFor, setPasswordFor] = useState(null);
  const [password, setPassword] = useState('');

  const params = {
    role: filters.role || undefined,
    q: filters.q || undefined,
    page: Number(filters.page) || 1,
    limit: 20,
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => adminApi.users(params),
    placeholderData: keepPreviousData,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-users'] });

  const update = useMutation({
    mutationFn: ({ type, id, value }) =>
      type === 'status'
        ? adminApi.setUserStatus(id, value)
        : type === 'role'
          ? adminApi.setUserRole(id, value)
          : adminApi.resetPassword(id, value),
    onSuccess: (_, variables) => {
      toast.success(variables.type === 'password' ? 'Parol yangilandi' : 'Saqlandi');
      setPasswordFor(null);
      setPassword('');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Foydalanuvchilar</h1>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Ism yoki telefon"
            className="pl-10"
            defaultValue={filters.q || ''}
            onKeyDown={(e) => e.key === 'Enter' && patch({ q: e.target.value })}
            onBlur={(e) => patch({ q: e.target.value })}
          />
        </div>

        <Select
          className="w-44"
          placeholder="Barcha rollar"
          value={filters.role || ''}
          options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))}
          onChange={(e) => patch({ role: e.target.value })}
        />
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : data.items.length === 0 ? (
        <EmptyState icon={Users} title="Foydalanuvchi topilmadi" />
      ) : (
        <>
          <Card>
            <ul className="divide-y divide-gray-100">
              {data.items.map((user) => (
                <li key={user.id} className="flex flex-wrap items-center gap-3 p-3 sm:p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate font-medium text-gray-900">{user.fullName}</span>
                      {!user.isActive && <Badge tone="rose">Bloklangan</Badge>}
                    </div>
                    <p className="mt-0.5 text-sm text-gray-500">{formatPhone(user.phone)}</p>
                  </div>

                  <Select
                    className="h-9 w-40 text-sm"
                    value={user.role}
                    options={Object.entries(ROLE_LABEL).map(([value, label]) => ({ value, label }))}
                    onChange={(e) =>
                      update.mutate({ type: 'role', id: user.id, value: e.target.value })
                    }
                  />

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPasswordFor(user)}
                    aria-label="Parolni tiklash"
                  >
                    <KeyRound className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={user.isActive ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() =>
                      update.mutate({ type: 'status', id: user.id, value: !user.isActive })
                    }
                  >
                    {user.isActive ? 'Bloklash' : 'Ochish'}
                  </Button>
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

      {/* SMS ham, email ham yo'q — parolni tiklashning yagona yo'li shu */}
      <Modal
        open={Boolean(passwordFor)}
        onClose={() => setPasswordFor(null)}
        title="Parolni tiklash"
        description={
          passwordFor
            ? `${passwordFor.fullName} uchun yangi parol. Uni foydalanuvchiga o'zingiz yetkazasiz.`
            : ''
        }
        footer={
          <>
            <Button variant="ghost" onClick={() => setPasswordFor(null)}>
              Yopish
            </Button>
            <Button
              loading={update.isPending}
              disabled={password.length < 6}
              onClick={() =>
                update.mutate({ type: 'password', id: passwordFor.id, value: password })
              }
            >
              Saqlash
            </Button>
          </>
        }
      >
        <PasswordInput
          label="Yangi parol"
          required
          hint="Kamida 6 belgi. Saqlangach foydalanuvchi hamma qurilmadan chiqariladi"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Modal>
    </div>
  );
}

export default AdminUsersPage;
