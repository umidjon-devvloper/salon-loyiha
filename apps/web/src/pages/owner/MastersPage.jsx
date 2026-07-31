import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Camera, Pencil, Plus, Trash2, Users } from 'lucide-react';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  Input,
  Modal,
  Skeleton,
} from '../../components/ui';

const EMPTY = { fullName: '', bio: '', experienceYears: 0, isActive: true };

export function MastersPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);
  const fileInputs = useRef({});

  const {
    data: masters = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ownerKeys.masters,
    queryFn: ownerApi.masters,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.masters });

  const save = useMutation({
    mutationFn: () => {
      const body = {
        fullName: form.fullName,
        bio: form.bio,
        experienceYears: Number(form.experienceYears) || 0,
        isActive: form.isActive,
      };
      return editing?.id ? ownerApi.updateMaster(editing.id, body) : ownerApi.createMaster(body);
    },
    onSuccess: () => {
      toast.success('Saqlandi');
      setEditing(null);
      invalidate();
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => ownerApi.deleteMaster(id),
    onSuccess: () => {
      toast.success('Mutaxassis o\u2019chirildi');
      setToDelete(null);
      invalidate();
    },
    // Kelgusi yozuvlari bo'lsa backend 409 qaytaradi va nima qilishni aytadi
    onError: (error) => toast.error(error.message),
  });

  const uploadPhoto = useMutation({
    mutationFn: ({ id, file }) => ownerApi.uploadMasterPhoto(id, file),
    onSuccess: () => {
      toast.success('Surat yangilandi');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Mutaxassislar</h1>
          <p className="mt-1 text-sm text-gray-500">
            Har bir mutaxassisning jadvali alohida bo&apos;lishi mumkin.
          </p>
        </div>
        <Button
          onClick={() => {
            setForm(EMPTY);
            setEditing({});
          }}
        >
          <Plus className="h-4 w-4" />
          Qo&apos;shish
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={refetch} />
      ) : isPending ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : masters.length === 0 ? (
        <EmptyState icon={Users} title="Mutaxassis yo'q" description="Kamida bittasi kerak." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {masters.map((master) => (
            <Card key={master.id}>
              <div className="flex items-center gap-3 p-3 sm:p-4">
                <button
                  type="button"
                  onClick={() => fileInputs.current[master.id]?.click()}
                  className="group relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-brand-50"
                  aria-label="Surat yuklash"
                >
                  {master.photoThumb ? (
                    <img
                      src={master.photoThumb}
                      alt={master.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xl font-semibold text-brand-400">
                      {master.fullName[0]}
                    </span>
                  )}
                  <span className="absolute inset-0 flex items-center justify-center bg-gray-900/40 opacity-0 transition group-hover:opacity-100">
                    <Camera className="h-5 w-5 text-white" />
                  </span>
                </button>

                <input
                  ref={(el) => (fileInputs.current[master.id] = el)}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadPhoto.mutate({ id: master.id, file });
                    e.target.value = '';
                  }}
                />

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-gray-900">{master.fullName}</span>
                    {master.isPrimary && <Badge tone="brand">Asosiy</Badge>}
                    {!master.isActive && <Badge tone="slate">Faol emas</Badge>}
                  </div>
                  {master.experienceYears > 0 && (
                    <p className="mt-0.5 text-sm text-gray-500">
                      {master.experienceYears} yil tajriba
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  aria-label="Tahrirlash"
                  onClick={() => {
                    setForm({
                      fullName: master.fullName,
                      bio: master.bio || '',
                      experienceYears: master.experienceYears || 0,
                      isActive: master.isActive,
                    });
                    setEditing(master);
                  }}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>

                {!master.isPrimary && (
                  <button
                    type="button"
                    aria-label="O'chirish"
                    onClick={() => setToDelete(master)}
                    className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.id ? 'Mutaxassisni tahrirlash' : 'Yangi mutaxassis'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Yopish
            </Button>
            <Button
              loading={save.isPending}
              disabled={form.fullName.trim().length < 2}
              onClick={() => save.mutate()}
            >
              Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Ism familiya"
            required
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label="Tajriba, yil"
            type="number"
            min={0}
            max={60}
            value={form.experienceYears}
            onChange={(e) => setForm({ ...form, experienceYears: e.target.value })}
          />
          <Input
            label="Qisqacha ma'lumot"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Faol (mijozlar unga yozila oladi)
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id)}
        loading={remove.isPending}
        danger
        title="Mutaxassisni o'chirasizmi?"
        description={
          toDelete
            ? `${toDelete.fullName} o'chiriladi. Kelgusi yozuvlari bo'lsa, avval ularni bekor qilish kerak.`
            : ''
        }
        confirmText="O'chirish"
      />
    </div>
  );
}

export default MastersPage;
