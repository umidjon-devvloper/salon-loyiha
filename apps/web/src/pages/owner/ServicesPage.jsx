import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Pencil, Plus, Scissors, Trash2 } from 'lucide-react';
import { formatDurationUz } from '@gozal/shared/utils/time';
import { formatServicePrice } from '@gozal/shared/utils/format';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { catalogApi, catalogKeys } from '../../api/catalog.api';
import {
  Badge,
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
  name: '',
  category: '',
  price: '',
  priceTo: '',
  isPriceFrom: false,
  durationMin: 60,
  bufferMin: 0,
  isActive: true,
};

function ServiceForm({ value, onChange, categories }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-3">
      <Input
        label="Xizmat nomi"
        required
        value={value.name}
        onChange={(e) => set({ name: e.target.value })}
      />

      <Select
        label="Kategoriya"
        required
        placeholder="Tanlang"
        value={value.category}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(e) => set({ category: e.target.value })}
      />

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Narx, so'm"
          required
          type="number"
          min={0}
          value={value.price}
          onChange={(e) => set({ price: e.target.value })}
        />
        <Input
          label="Yuqori narx"
          type="number"
          min={0}
          hint="Oraliq bo'lsa"
          value={value.priceTo}
          onChange={(e) => set({ priceTo: e.target.value })}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={value.isPriceFrom}
          onChange={(e) => set({ isPriceFrom: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Narx &quot;dan&quot; boshlanadi (100 000 so&apos;mdan)
      </label>

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="Davomiyligi, daqiqa"
          required
          type="number"
          min={10}
          max={600}
          hint="Bo'sh vaqt shu asosda hisoblanadi"
          value={value.durationMin}
          onChange={(e) => set({ durationMin: e.target.value })}
        />
        <Input
          label="Tayyorgarlik, daqiqa"
          type="number"
          min={0}
          max={120}
          hint="Tozalash vaqti"
          value={value.bufferMin}
          onChange={(e) => set({ bufferMin: e.target.value })}
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={value.isActive}
          onChange={(e) => set({ isActive: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
        />
        Faol (mijozlarga ko&apos;rinadi)
      </label>
    </div>
  );
}

export function ServicesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);

  const {
    data: services = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ownerKeys.services,
    queryFn: ownerApi.services,
  });

  const { data: categories = [] } = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ownerKeys.services });
    queryClient.invalidateQueries({ queryKey: ownerKeys.salon });
  };

  const payload = () => ({
    name: form.name,
    category: form.category,
    price: Number(form.price),
    priceTo: form.priceTo === '' ? null : Number(form.priceTo),
    isPriceFrom: form.isPriceFrom,
    durationMin: Number(form.durationMin),
    bufferMin: Number(form.bufferMin) || 0,
    isActive: form.isActive,
  });

  const save = useMutation({
    mutationFn: () =>
      editing?.id
        ? ownerApi.updateService(editing.id, payload())
        : ownerApi.createService(payload()),
    onSuccess: () => {
      toast.success('Saqlandi');
      setEditing(null);
      invalidate();
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => ownerApi.deleteService(id),
    onSuccess: () => {
      toast.success('Xizmat o\u2019chirildi');
      setToDelete(null);
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const openNew = () => {
    setForm(EMPTY);
    setEditing({});
  };

  const openEdit = (service) => {
    setForm({
      name: service.name,
      category: service.category?.id || '',
      price: service.price,
      priceTo: service.priceTo ?? '',
      isPriceFrom: service.isPriceFrom,
      durationMin: service.durationMin,
      bufferMin: service.bufferMin ?? 0,
      isActive: service.isActive,
    });
    setEditing(service);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Xizmatlar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Davomiyligi bo&apos;sh vaqtni hisoblash uchun ishlatiladi.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="h-4 w-4" />
          Xizmat qo&apos;shish
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : services.length === 0 ? (
        <EmptyState
          icon={Scissors}
          title="Hali xizmat yo'q"
          description="Kamida bitta xizmat qo'shing — busiz mijoz yozila olmaydi."
          action={<Button onClick={openNew}>Xizmat qo&apos;shish</Button>}
        />
      ) : (
        <Card>
          <ul className="divide-y divide-brand-50">
            {services.map((service) => (
              <li key={service.id} className="flex items-center gap-3 p-3 sm:p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium text-gray-900">{service.name}</span>
                    {!service.isActive && <Badge tone="slate">Faol emas</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {service.category?.name} · {formatDurationUz(service.durationMin)}
                  </p>
                </div>

                <span className="shrink-0 text-sm font-semibold text-brand-700">
                  {formatServicePrice(service)}
                </span>

                <button
                  type="button"
                  aria-label="Tahrirlash"
                  onClick={() => openEdit(service)}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="O'chirish"
                  onClick={() => setToDelete(service)}
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
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Xizmatni tahrirlash' : 'Yangi xizmat'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Yopish
            </Button>
            <Button
              loading={save.isPending}
              disabled={!form.name || !form.category || form.price === ''}
              onClick={() => save.mutate()}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <ServiceForm value={form} onChange={setForm} categories={categories} />
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id)}
        loading={remove.isPending}
        danger
        title="Xizmatni o'chirasizmi?"
        description={
          toDelete
            ? `"${toDelete.name}" o'chiriladi. Eski yozuvlar o'zgarmaydi — ularda xizmat nusxasi saqlanadi.`
            : ''
        }
        confirmText="O'chirish"
      />
    </div>
  );
}

export default ServicesPage;
