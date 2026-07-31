import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, Plus, Trash2 } from 'lucide-react';
import { WEEKDAYS_UZ } from '@gozal/shared/utils/time';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { Button, Card, CardBody, ErrorState, Select, Skeleton } from '../../components/ui';

/** Hafta dushanbadan boshlanadi, yakshanba oxirida */
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];

const emptyDay = (weekday) => ({
  weekday,
  isOpen: weekday !== 0,
  start: '09:00',
  end: '19:00',
  breaks: weekday === 0 ? [] : [{ start: '13:00', end: '14:00' }],
});

function TimeSelect({ value, onChange, label }) {
  // 15 daqiqalik qadam — slot qadami bilan bir xil
  const options = [];
  for (let m = 0; m < 24 * 60; m += 15) {
    const time = `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
    options.push({ value: time, label: time });
  }

  return (
    <Select
      aria-label={label}
      value={value}
      options={options}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 w-28 text-sm"
    />
  );
}

function DayRow({ day, onChange }) {
  const set = (patch) => onChange({ ...day, ...patch });

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-brand-50 py-3 last:border-0">
      <label className="flex w-36 shrink-0 cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          checked={day.isOpen}
          onChange={(e) => set({ isOpen: e.target.checked })}
          className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        <span className={day.isOpen ? 'font-medium text-gray-900' : 'text-gray-400'}>
          {WEEKDAYS_UZ[day.weekday]}
        </span>
      </label>

      {day.isOpen ? (
        <div className="flex flex-wrap items-center gap-2">
          <TimeSelect
            label="Ish boshlanishi"
            value={day.start}
            onChange={(v) => set({ start: v })}
          />
          <span className="text-gray-400">—</span>
          <TimeSelect label="Ish tugashi" value={day.end} onChange={(v) => set({ end: v })} />

          {day.breaks.map((brk, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-xl bg-brand-50 px-2 py-1">
              <span className="text-xs text-brand-700">tanaffus</span>
              <TimeSelect
                label="Tanaffus boshlanishi"
                value={brk.start}
                onChange={(v) =>
                  set({ breaks: day.breaks.map((b, j) => (j === i ? { ...b, start: v } : b)) })
                }
              />
              <TimeSelect
                label="Tanaffus tugashi"
                value={brk.end}
                onChange={(v) =>
                  set({ breaks: day.breaks.map((b, j) => (j === i ? { ...b, end: v } : b)) })
                }
              />
              <button
                type="button"
                aria-label="Tanaffusni o'chirish"
                onClick={() => set({ breaks: day.breaks.filter((_, j) => j !== i) })}
                className="rounded-lg p-1 text-gray-400 hover:bg-white hover:text-rose-600"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}

          {day.breaks.length < 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => set({ breaks: [...day.breaks, { start: '13:00', end: '14:00' }] })}
            >
              <Plus className="h-3.5 w-3.5" />
              Tanaffus
            </Button>
          )}
        </div>
      ) : (
        <span className="text-sm text-gray-400">Dam olish kuni</span>
      )}
    </div>
  );
}

/**
 * ⭐ Salon egasi uchun eng muhim ekran.
 * Jadval to'ldirilmasa bo'sh slot ham bo'lmaydi — platforma ishlamaydi.
 * Shuning uchun bu yerda hech qanday texnik atama yo'q va 7 kunni qo'lda
 * to'ldirish shart emas ("dushanbani hamma kunga qo'llash").
 */
export function SchedulePage() {
  const queryClient = useQueryClient();
  const [masterId, setMasterId] = useState('');
  const [days, setDays] = useState(null);

  const mastersQuery = useQuery({ queryKey: ownerKeys.masters, queryFn: ownerApi.masters });

  const scheduleQuery = useQuery({
    queryKey: ownerKeys.schedule(masterId || null),
    queryFn: () => ownerApi.schedule(masterId || undefined),
  });

  useEffect(() => {
    if (!scheduleQuery.data) return;

    const byWeekday = new Map(scheduleQuery.data.days.map((d) => [d.weekday, d]));
    setDays(
      WEEK_ORDER.map((weekday) => {
        const day = byWeekday.get(weekday);
        if (!day) return emptyDay(weekday);
        return {
          weekday,
          isOpen: day.isOpen,
          start: day.start || '09:00',
          end: day.end || '19:00',
          breaks: day.breaks || [],
        };
      }),
    );
  }, [scheduleQuery.data]);

  const save = useMutation({
    mutationFn: () =>
      ownerApi.updateSchedule({
        target: masterId ? 'master' : 'salon',
        masterId: masterId || null,
        days,
      }),
    onSuccess: () => {
      toast.success('Ish vaqti saqlandi');
      queryClient.invalidateQueries({ queryKey: ['owner-schedule'] });
      // Jadval o'zgardi — bo'sh vaqtlar boshqacha hisoblanadi
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['availability-days'] });
    },
    onError: (error) => toast.error(error.message),
  });

  const applyMondayToAll = () => {
    const monday = days.find((d) => d.weekday === 1);
    setDays(
      days.map((day) =>
        day.weekday === 0
          ? day // yakshanbaga tegmaymiz: ko'pchilik salon dam oladi
          : {
              ...day,
              isOpen: monday.isOpen,
              start: monday.start,
              end: monday.end,
              breaks: monday.breaks,
            },
      ),
    );
    toast.success('Dushanba jadvali qolgan kunlarga qo\u2019llandi. Saqlashni unutmang');
  };

  if (scheduleQuery.isError) return <ErrorState onRetry={scheduleQuery.refetch} />;
  if (!days) return <Skeleton className="h-96 rounded-2xl" />;

  const masters = mastersQuery.data || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Ish vaqti</h1>
        <p className="mt-1 text-sm text-gray-500">
          Mijozlar bo&apos;sh vaqtni shu jadval asosida ko&apos;radi.
        </p>
      </div>

      {masters.length > 1 && (
        <Select
          label="Jadval kimga tegishli"
          value={masterId}
          onChange={(e) => setMasterId(e.target.value)}
          placeholder="Butun salon"
          options={masters.map((m) => ({ value: m.id, label: m.fullName }))}
        />
      )}

      {masterId && scheduleQuery.data && !scheduleQuery.data.hasOwnSchedule && (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Bu mutaxassis hozir salon jadvali bo&apos;yicha ishlaydi. Saqlasangiz, unga alohida jadval
          beriladi.
        </p>
      )}

      <Card>
        <CardBody>
          {days.map((day) => (
            <DayRow
              key={day.weekday}
              day={day}
              onChange={(next) => setDays(days.map((d) => (d.weekday === next.weekday ? next : d)))}
            />
          ))}
        </CardBody>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={applyMondayToAll}>
          <Copy className="h-4 w-4" />
          Dushanbani hamma kunga qo&apos;llash
        </Button>

        <Button className="ml-auto" onClick={() => save.mutate()} loading={save.isPending}>
          Saqlash
        </Button>
      </div>
    </div>
  );
}

export default SchedulePage;
