import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import { adminApi, adminKeys } from '../../api/admin.api';
import { CategoryIcon } from '../../components/catalog/CategoryIcon';
import {
  Badge,
  Button,
  Card,
  ConfirmModal,
  ErrorState,
  Input,
  Modal,
  Skeleton,
} from '../../components/ui';

const EMPTY = { nameUz: '', nameRu: '', slug: '', icon: '', order: 0, isActive: true };

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [toDelete, setToDelete] = useState(null);

  const {
    data: categories = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: adminKeys.categories,
    queryFn: adminApi.categories,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: adminKeys.categories });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const save = useMutation({
    mutationFn: () => {
      const body = {
        nameUz: form.nameUz,
        nameRu: form.nameRu,
        icon: form.icon || null,
        order: Number(form.order) || 0,
        isActive: form.isActive,
        ...(form.slug ? { slug: form.slug } : {}),
      };
      return editing?.id
        ? adminApi.updateCategory(editing.id, body)
        : adminApi.createCategory(body);
    },
    onSuccess: () => {
      toast.success('Saqlandi');
      setEditing(null);
      invalidate();
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const remove = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('O\u2019chirildi');
      setToDelete(null);
      invalidate();
    },
    // Ishlatilayotgan kategoriyani backend o'chirmaydi va nechta salonda borligini aytadi
    onError: (error) => toast.error(error.message),
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Kategoriyalar</h1>
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
      ) : (
        <Card>
          <ul className="divide-y divide-gray-100">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 p-3 sm:p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50">
                  <CategoryIcon name={category.icon} className="h-5 w-5 text-brand-500" />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium text-gray-900">{category.name}</span>
                    {!category.isActive && <Badge tone="slate">Yashirilgan</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-gray-500">
                    /{category.slug} · {category.salonCount} ta salon
                  </p>
                </div>

                <span className="shrink-0 text-sm text-gray-400">#{category.order}</span>

                <button
                  type="button"
                  aria-label="Tahrirlash"
                  onClick={() => {
                    setForm({
                      nameUz: category.name,
                      nameRu: category.nameRu || '',
                      slug: category.slug,
                      icon: category.icon || '',
                      order: category.order,
                      isActive: category.isActive,
                    });
                    setEditing(category);
                  }}
                  className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  aria-label="O'chirish"
                  onClick={() => setToDelete(category)}
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
        title={editing?.id ? 'Kategoriyani tahrirlash' : 'Yangi kategoriya'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              Yopish
            </Button>
            <Button loading={save.isPending} disabled={!form.nameUz} onClick={() => save.mutate()}>
              Saqlash
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Nomi (o'zbekcha)"
            required
            value={form.nameUz}
            onChange={(e) => setForm({ ...form, nameUz: e.target.value })}
          />
          <Input
            label="Nomi (ruscha)"
            hint="Interfeys hozircha faqat o'zbekcha, baza ikki tilga tayyor"
            value={form.nameRu}
            onChange={(e) => setForm({ ...form, nameRu: e.target.value })}
          />
          <Input
            label="Slug"
            hint="Bo'sh qoldirilsa nomdan yasaladi. O'zgartirilsa eski havolalar buziladi"
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
          />
          <Input
            label="Ikonka nomi"
            hint="lucide nomi: scissors, hand, camera..."
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          />
          <Input
            label="Tartib raqami"
            type="number"
            min={0}
            value={form.order}
            onChange={(e) => setForm({ ...form, order: e.target.value })}
          />
          <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            Katalogda ko&apos;rinadi
          </label>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => remove.mutate(toDelete.id)}
        loading={remove.isPending}
        danger
        title="Kategoriyani o'chirasizmi?"
        description="Salonlarda ishlatilayotgan kategoriya o'chirilmaydi — uni yashirish mumkin."
        confirmText="O'chirish"
      />
    </div>
  );
}

export default AdminCategoriesPage;
