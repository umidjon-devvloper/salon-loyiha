import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

import { adminApi, adminKeys } from '../../api/admin.api';
import { Button, Card, CardBody, ErrorState, Input, Select, Skeleton } from '../../components/ui';

/**
 * Sozlamalar. Bu raqamlar bozor reaksiyasiga qarab o'zgaradi —
 * shuning uchun ular kodda emas, bazada turadi.
 */
export function AdminSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: adminKeys.settings,
    queryFn: adminApi.settings,
  });

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useMutation({
    mutationFn: () =>
      adminApi.updateSettings({
        bookingFee: {
          enabled: form.bookingFee.enabled,
          mode: form.bookingFee.mode,
          fixedAmount: Number(form.bookingFee.fixedAmount),
          percent: Number(form.bookingFee.percent),
          minAmount: Number(form.bookingFee.minAmount),
          maxAmount: Number(form.bookingFee.maxAmount),
        },
        holdMinutes: Number(form.holdMinutes),
        topPrices: {
          week: Number(form.topPrices.week),
          month: Number(form.topPrices.month),
        },
        promoText: form.promoText,
      }),
    onSuccess: () => {
      toast.success('Saqlandi');
      queryClient.invalidateQueries({ queryKey: adminKeys.settings });
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  if (isError) return <ErrorState onRetry={refetch} />;
  if (isPending || !form) return <Skeleton className="h-96 rounded-2xl" />;

  const fee = form.bookingFee;
  const setFee = (patch) => setForm({ ...form, bookingFee: { ...fee, ...patch } });

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-gray-900">Sozlamalar</h1>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold text-gray-900">Band qilish to&apos;lovi</h2>
          <p className="text-sm text-gray-500">
            Mijoz band qilish uchun to&apos;laydigan summa. Pul platformada qoladi.
          </p>

          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={fee.enabled}
              onChange={(e) => setFee({ enabled: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Yoqilgan
          </label>

          <Select
            label="Hisoblash usuli"
            value={fee.mode}
            options={[
              { value: 'fixed', label: "Qat'iy summa" },
              { value: 'percent', label: 'Xizmat narxining foizi' },
            ]}
            onChange={(e) => setFee({ mode: e.target.value })}
          />

          {fee.mode === 'fixed' ? (
            <Input
              label="Summa, so'm"
              type="number"
              min={0}
              value={fee.fixedAmount}
              onChange={(e) => setFee({ fixedAmount: e.target.value })}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-3">
              <Input
                label="Foiz"
                type="number"
                min={0}
                max={100}
                value={fee.percent}
                onChange={(e) => setFee({ percent: e.target.value })}
              />
              <Input
                label="Eng kam, so'm"
                type="number"
                min={0}
                value={fee.minAmount}
                onChange={(e) => setFee({ minAmount: e.target.value })}
              />
              <Input
                label="Eng ko'p, so'm"
                type="number"
                min={0}
                value={fee.maxAmount}
                onChange={(e) => setFee({ maxAmount: e.target.value })}
              />
            </div>
          )}

          <Input
            label="To'lov kutish vaqti, daqiqa"
            type="number"
            min={1}
            max={30}
            hint="Shu vaqt ichida to'lanmasa slot bo'shaydi. 15 daqiqadan uzun qilinmasin"
            value={form.holdMinutes}
            onChange={(e) => setForm({ ...form, holdMinutes: e.target.value })}
          />
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold text-gray-900">TOP e&apos;lon narxlari</h2>
          <p className="text-sm text-gray-500">
            Ma&apos;lumot uchun: to&apos;lov platformadan tashqarida qabul qilinadi.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="7 kun, so'm"
              type="number"
              min={0}
              value={form.topPrices.week}
              onChange={(e) =>
                setForm({ ...form, topPrices: { ...form.topPrices, week: e.target.value } })
              }
            />
            <Input
              label="30 kun, so'm"
              type="number"
              min={0}
              value={form.topPrices.month}
              onChange={(e) =>
                setForm({ ...form, topPrices: { ...form.topPrices, month: e.target.value } })
              }
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-3">
          <h2 className="font-semibold text-gray-900">Bosh sahifa matni</h2>
          <Input
            label="Maxsus takliflar bloki"
            hint="Bo'sh qoldirilsa blok ko'rinmaydi"
            value={form.promoText || ''}
            onChange={(e) => setForm({ ...form, promoText: e.target.value })}
          />
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button loading={save.isPending} onClick={() => save.mutate()}>
          Saqlash
        </Button>
      </div>
    </div>
  );
}

export default AdminSettingsPage;
