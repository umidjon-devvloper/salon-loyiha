import { useEffect, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ImagePlus, Star, Trash2 } from 'lucide-react';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Button, Card, CardBody, Input, PhoneInput, Select, Skeleton } from '../../components/ui';

const EMPTY = {
  name: '',
  description: '',
  categories: [],
  city: 'Toshkent',
  district: '',
  address: '',
  phone: '',
  telegram: '',
  instagram: '',
};

export function SalonEditPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(EMPTY);
  const fileInput = useRef(null);

  const salonQuery = useQuery({ queryKey: ownerKeys.salon, queryFn: ownerApi.salon, retry: false });
  const { data: categories = [] } = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });
  const { data: cities = [] } = useQuery({
    queryKey: catalogKeys.cities,
    queryFn: catalogApi.cities,
    staleTime: Infinity,
  });

  const salon = salonQuery.data;
  const isNew = !salon;

  useEffect(() => {
    if (!salon) return;
    setForm({
      name: salon.name,
      description: salon.description || '',
      // Kabinet javobida kategoriyalar populate qilinmagan bo'lishi mumkin:
      // u holda massivda id string ko'rinishida keladi
      categories: (salon.categories || []).map((c) => (typeof c === 'string' ? c : c.id)),
      city: salon.city,
      district: salon.district,
      address: salon.address || '',
      phone: salon.phone || '',
      telegram: salon.telegram || '',
      instagram: salon.instagram || '',
    });
  }, [salon]);

  const districts = cities.find((c) => c.name === form.city)?.districts || [];

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ownerKeys.salon });

  const save = useMutation({
    mutationFn: () => (isNew ? ownerApi.createSalon(form) : ownerApi.updateSalon(form)),
    onSuccess: () => {
      toast.success(isNew ? 'Salon yaratildi' : 'Saqlandi');
      invalidate();
    },
    onError: (error) => toast.error(error.errors?.[0]?.message || error.message),
  });

  const upload = useMutation({
    mutationFn: (files) => ownerApi.uploadImages(files),
    onSuccess: () => {
      toast.success('Rasmlar yuklandi');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  const removeImage = useMutation({
    mutationFn: (name) => ownerApi.deleteImage(name),
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });

  const setCover = useMutation({
    mutationFn: (name) => ownerApi.setCover(name),
    onSuccess: () => {
      toast.success('Muqova o\u2019zgartirildi');
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });

  if (salonQuery.isPending) return <Skeleton className="h-96 rounded-2xl" />;

  const toggleCategory = (id) =>
    setForm((prev) => ({
      ...prev,
      categories: prev.categories.includes(id)
        ? prev.categories.filter((x) => x !== id)
        : [...prev.categories, id].slice(0, 5),
    }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          {isNew ? 'Salon yaratish' : 'Salon ma\u2019lumotlari'}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Bu ma&apos;lumotlar katalogda mijozlarga ko&apos;rinadi.
        </p>
      </div>

      <Card>
        <CardBody className="space-y-3">
          <Input
            label="Salon nomi"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Kategoriyalar <span className="text-gray-400">(5 tagacha)</span>
            </span>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const active = form.categories.includes(category.id);
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => toggleCategory(category.id)}
                    className={`rounded-xl px-3 py-1.5 text-sm transition ${
                      active
                        ? 'bg-brand-600 text-white'
                        : 'bg-white text-gray-600 ring-1 ring-brand-100 hover:bg-brand-50'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label="Shahar"
              required
              value={form.city}
              options={cities.map((c) => ({ value: c.name, label: c.name }))}
              onChange={(e) => setForm({ ...form, city: e.target.value, district: '' })}
            />
            <Select
              label="Tuman"
              required
              placeholder="Tanlang"
              value={form.district}
              options={districts.map((d) => ({ value: d, label: d }))}
              onChange={(e) => setForm({ ...form, district: e.target.value })}
            />
          </div>

          <Input
            label="Manzil"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <PhoneInput
            label="Telefon raqam"
            required
            hint="Mijozlar shu raqamga qo'ng'iroq qiladi"
            value={form.phone}
            onChange={(value) => setForm({ ...form, phone: value })}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Telegram"
              placeholder="@salon"
              value={form.telegram || ''}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
            />
            <Input
              label="Instagram"
              placeholder="@salon"
              value={form.instagram || ''}
              onChange={(e) => setForm({ ...form, instagram: e.target.value })}
            />
          </div>

          <Input
            label="Tavsif"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex justify-end">
            <Button
              loading={save.isPending}
              disabled={!form.name || !form.district || !form.phone || form.categories.length === 0}
              onClick={() => save.mutate()}
            >
              {isNew ? 'Yaratish' : 'Saqlash'}
            </Button>
          </div>
        </CardBody>
      </Card>

      {!isNew && (
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-gray-900">Rasmlar</h2>
              <Button
                variant="secondary"
                size="sm"
                loading={upload.isPending}
                onClick={() => fileInput.current?.click()}
              >
                <ImagePlus className="h-4 w-4" />
                Yuklash
              </Button>
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = [...(e.target.files || [])];
                  if (files.length) upload.mutate(files);
                  e.target.value = '';
                }}
              />
            </div>

            {salon.images?.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {salon.images.map((image) => (
                  <div key={image.name} className="group relative overflow-hidden rounded-xl">
                    <img src={image.thumb} alt="" className="aspect-[4/3] w-full object-cover" />

                    <div className="absolute inset-0 flex items-center justify-center gap-2 bg-gray-900/50 opacity-0 transition group-hover:opacity-100">
                      <button
                        type="button"
                        aria-label="Muqova qilish"
                        onClick={() => setCover.mutate(image.name)}
                        className="rounded-lg bg-white/90 p-1.5 text-gray-700 hover:bg-white"
                      >
                        <Star className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="O'chirish"
                        onClick={() => removeImage.mutate(image.name)}
                        className="rounded-lg bg-white/90 p-1.5 text-rose-600 hover:bg-white"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {salon.cover?.endsWith(image.name) && (
                      <span className="absolute left-1 top-1 rounded-md bg-brand-600 px-1.5 text-[11px] text-white">
                        Muqova
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                Rasm yo&apos;q. Birinchi yuklangan rasm avtomatik muqova bo&apos;ladi.
              </p>
            )}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

export default SalonEditPage;
