import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CalendarOff, Plus, Trash2 } from 'lucide-react';
import { formatDateUz, todayStr } from '@gozal/shared/utils/time';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Select,
  Skeleton,
} from '../../components/ui';

const EMPTY = {
  masterId: '',
  dateFrom: todayStr(),
  dateTo: todayStr(),
  allDay: true,
  start: '09:00',
  end: '13:00',
  reason: '',
};

export function TimeOffPage() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);

  const {
    data: timeOffs = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ownerKeys.timeOffs,
    queryFn: () => ownerApi.timeOffs(),
  });

  const { data: masters = [] } = useQuery({
    queryKey: ownerKeys.masters,
    queryFn: ownerApi.masters,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ownerKeys.timeOffs });
    queryClient.invalidateQueries({ queryKey: ['availability'] });
    queryClient.invalidateQueries({ queryKey: ['availability-days'] });
  };

  const create = useMutation({
    mutationFn: () =>
      ownerApi.createTimeOff({
        masterId: form.masterId || null,
        dateFrom: form.dateFrom,
        dateTo: form.dateTo,
        allDay: form.allDay,
        ...(form.allDay ? {} : { start: form.start, end: form.end }),
        reason: form.reason,
      }),
    onSuccess: () => {
      toast.success('Qo\u2019shildi');
      setOpen(false);
      setForm(EMPTY);
      invalidate();
    },
    // Oraliqda faol yozuv bo'lsa backend 409 qaytaradi va nechtaligini aytadi
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => ownerApi.deleteTimeOff(id),
    onSuccess: () => {
      toast.success('O\u2019chirildi');
      setToDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const masterName = (id) => masters.find((m) => m.id === id)?.fullName || 'Butun salon';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dam olish kunlari</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ta&apos;til, bayram yoki kunning bir qismini yopish.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4" />
          Qo&apos;shish
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-48 rounded-2xl" />
      ) : timeOffs.length === 0 ? (
        <EmptyState
          icon={CalendarOff}
          title="Bloklangan kun yo'q"
          description="Ta'tilga chiqsangiz, o'sha kunlarga hech kim yozila olmaydi."
        />
      ) : (
        <Card>
          <ul className="divide-y divide-brand-50">
            {timeOffs.map((item) => (
              <li key={item.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900">
                    {formatDateUz(item.dateFrom, { withWeekday: false })}
                    {item.dateTo !== item.dateFrom &&
                      ` — ${formatDateUz(item.dateTo, { withWeekday: false })}`}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {masterName(item.masterId)} ·{' '}
                    {item.allDay ? 'Kun bo\u2019yi' : `${item.start}–${item.end}`}
                    {item.reason && ` · ${item.reason}`}
                  </p>
                </div>

                <button
                  type="button"
                  aria-label="O'chirish"
                  onClick={() => setToDelete(item)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Vaqtni bloklash"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Yopish
            </Button>
            <Button loading={create.isPending} onClick={() => create.mutate()}>
              Qo&apos;shish
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Kimga tegishli"
            placeholder="Butun salon"
            value={form.masterId}
            options={masters.map((m) => ({ value: m.id, label: m.fullName }))}
            onChange={(e) => setForm({ ...form, masterId: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Boshlanish"
              type="date"
              value={form.dateFrom}
              onChange={(e) => setForm({ ...form, dateFrom: e.target.value })}
            />
            <Input
              label="Tugash"
              type="date"
              value={form.dateTo}
              onChange={(e) => setForm({ ...form, dateTo: e.target.value })}
            />
          </div>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.allDay}
              onChange={(e) => setForm({ ...form, allDay: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Kun bo&apos;yi
          </label>

          {!form.allDay && (
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Vaqtdan"
                type="time"
                step={900}
                value={form.start}
                onChange={(e) => setForm({ ...form, start: e.target.value })}
              />
              <Input
                label="Vaqtgacha"
                type="time"
                step={900}
                value={form.end}
                onChange={(e) => setForm({ ...form, end: e.target.value })}
              />
            </div>
          )}

          <Input
            label="Sababi"
            placeholder="Ta'til, bayram..."
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id)}
        loading={remove.isPending}
        title="O'chirasizmi?"
        description="O'sha kunlarga mijozlar yana yozila oladi."
        confirmText="O'chirish"
      />
    </div>
  );
}

export default TimeOffPage;
