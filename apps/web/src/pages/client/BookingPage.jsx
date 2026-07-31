import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { formatDurationUz, formatDateUz } from '@gozal/shared/utils/time';
import { formatPrice, formatServicePrice } from '@gozal/shared/utils/format';

import { bookingApi } from '../../api/booking.api';
import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { StepBar } from '../../components/booking/StepBar';
import { SlotPicker } from '../../components/booking/SlotPicker';
import {
  Button,
  Card,
  CardBody,
  ErrorState,
  Input,
  PhoneInput,
  Skeleton,
} from '../../components/ui';
import { useAuth } from '../../hooks/useAuth';

/** Xizmat shu ustaga biriktirilganmi? Bo'sh massiv = hamma usta bajaradi */
const servedBy = (service, masterId) =>
  !service.masters?.length || service.masters.includes(masterId);

export function BookingPage() {
  const { masterId: initialMasterId } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [masterId, setMasterId] = useState(initialMasterId);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState(() =>
    (params.get('services') || '').split(',').filter(Boolean),
  );
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', note: '' });

  // Usta → salon slug → salonning to'liq profili (xizmatlar + ustalar)
  const masterQuery = useQuery({
    queryKey: catalogKeys.master(initialMasterId),
    queryFn: () => catalogApi.master(initialMasterId),
  });

  const salonSlug = masterQuery.data?.salon?.slug;

  const salonQuery = useQuery({
    queryKey: catalogKeys.salon(salonSlug),
    queryFn: () => catalogApi.salon(salonSlug),
    enabled: Boolean(salonSlug),
  });

  const salon = salonQuery.data;

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        clientName: prev.clientName || user.fullName || '',
        clientPhone: prev.clientPhone || user.phone || '',
        note: prev.note,
      }));
    }
  }, [user]);

  const allServices = useMemo(
    () => (salon?.serviceGroups || []).flatMap((g) => g.services),
    [salon],
  );

  const services = useMemo(
    () => allServices.filter((s) => servedBy(s, masterId)),
    [allServices, masterId],
  );

  const chosen = services.filter((s) => selected.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  // Salonda bitta usta bo'lsa, 2-qadam ma'nosiz — o'tkazib yuboriladi
  const singleMaster = (salon?.masters?.length ?? 0) <= 1;

  const create = useMutation({
    mutationFn: () =>
      bookingApi.create({
        masterId,
        serviceIds: selected,
        date,
        startTime: slot.start,
        ...form,
      }),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      navigate(`/band-qilish/tasdiq/${booking.code}`, { state: { booking }, replace: true });
    },
    onError: (error) => {
      toast.error(error.message);

      // Slotni kimdir oldin olib qo'ygan bo'lsa — vaqt qadamiga qaytamiz
      // va bo'sh vaqtlarni qaytadan so'raymiz
      if (error.code === 'SLOT_TAKEN') {
        queryClient.invalidateQueries({ queryKey: ['availability'] });
        queryClient.invalidateQueries({ queryKey: ['availability-days'] });
        setSlot(null);
        setStep(3);
      }
    },
  });

  if (masterQuery.isPending || (salonSlug && salonQuery.isPending)) {
    return (
      <Container className="space-y-4 py-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Container>
    );
  }

  if (masterQuery.isError || salonQuery.isError) {
    return (
      <Container className="py-10">
        <ErrorState message="Ma'lumotni yuklab bo'lmadi" onRetry={masterQuery.refetch} />
      </Container>
    );
  }

  const master = salon.masters.find((m) => m.id === masterId) || masterQuery.data;
  const goToStep = (next) => setStep(next);

  const next = () => {
    if (step === 1 && singleMaster) return setStep(3);
    setStep(step + 1);
  };

  const back = () => {
    if (step === 3 && singleMaster) return setStep(1);
    if (step === 1) return navigate(-1);
    setStep(step - 1);
  };

  const toggleService = (id) => {
    setSlot(null);
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const canSubmit =
    selected.length > 0 && date && slot && form.clientName.trim().length >= 2 && form.clientPhone;

  return (
    <Container className="py-6 pb-32 sm:pb-6">
      <button
        type="button"
        onClick={back}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Orqaga
      </button>

      <h1 className="mb-1 text-xl font-semibold text-gray-900">Band qilish</h1>
      <p className="mb-5 text-sm text-gray-500">
        {salon.name} · {master.fullName}
      </p>

      <StepBar
        step={step}
        steps={
          singleMaster ? ['Xizmat', 'Vaqt', 'Tasdiq'] : ['Xizmat', 'Mutaxassis', 'Vaqt', 'Tasdiq']
        }
        onBack={goToStep}
      />

      {/* ── 1: xizmat ─────────────────────────────── */}
      {step === 1 && (
        <Card>
          <ul className="divide-y divide-brand-50">
            {services.map((service) => (
              <li key={service.id}>
                <label className="flex cursor-pointer items-center gap-3 p-3 transition hover:bg-brand-50/60 sm:p-4">
                  <input
                    type="checkbox"
                    checked={selected.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-gray-900">{service.name}</span>
                    <span className="block text-sm text-gray-500">
                      {formatDurationUz(service.durationMin)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-brand-700">
                    {formatServicePrice(service)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* ── 2: mutaxassis ─────────────────────────── */}
      {step === 2 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {salon.masters.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => {
                setMasterId(m.id);
                setDate(null);
                setSlot(null);
              }}
              className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${
                m.id === masterId
                  ? 'border-brand-600 bg-brand-50'
                  : 'border-brand-100 bg-white hover:border-brand-300'
              }`}
            >
              <span className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {m.photoThumb ? (
                  <img src={m.photoThumb} alt={m.fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-lg font-semibold text-brand-400">
                    {m.fullName[0]}
                  </span>
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium text-gray-900">{m.fullName}</span>
                {m.experienceYears > 0 && (
                  <span className="block text-sm text-gray-500">
                    {m.experienceYears} yil tajriba
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* ── 3: kun va vaqt ────────────────────────── */}
      {step === 3 && (
        <SlotPicker
          masterId={masterId}
          serviceIds={selected}
          date={date}
          onDateChange={setDate}
          slot={slot}
          onSlotChange={setSlot}
        />
      )}

      {/* ── 4: ma'lumot va tasdiq ─────────────────── */}
      {step === 4 && (
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <Input
                label="Ismingiz"
                required
                value={form.clientName}
                onChange={(e) => setForm({ ...form, clientName: e.target.value })}
              />
              <PhoneInput
                label="Telefon raqam"
                required
                hint="Salon shu raqamga qo'ng'iroq qilib tasdiqlaydi"
                value={form.clientPhone}
                onChange={(value) => setForm({ ...form, clientPhone: value })}
              />
              <Input
                label="Izoh"
                placeholder="Masalan: qisqa naxun, allergiyam bor"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Salon</span>
                <span className="font-medium text-gray-900">{salon.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Mutaxassis</span>
                <span className="font-medium text-gray-900">{master.fullName}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Vaqt</span>
                <span className="font-medium text-gray-900">
                  {date && formatDateUz(date)}, {slot?.start}–{slot?.end}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-500">Xizmatlar</span>
                <span className="text-right font-medium text-gray-900">
                  {chosen.map((s) => s.name).join(', ')}
                </span>
              </div>
              <div className="flex justify-between gap-3 border-t border-brand-50 pt-2">
                <span className="text-gray-500">Jami</span>
                <span className="font-semibold text-brand-700">
                  {formatPrice(totalPrice)} · {formatDurationUz(totalDuration)}
                </span>
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Pastdagi yopishqoq panel — mobilda navigatsiya ustida turadi */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-brand-100 bg-white p-3 sm:bottom-0 lg:static lg:mt-6 lg:border-0 lg:p-0">
        <Container className="flex items-center gap-3 px-0 sm:px-0">
          <div className="min-w-0 flex-1 text-sm">
            {chosen.length > 0 ? (
              <>
                <p className="truncate text-gray-600">
                  {chosen.length} ta xizmat · {formatDurationUz(totalDuration)}
                </p>
                <p className="font-semibold text-brand-700">{formatPrice(totalPrice)}</p>
              </>
            ) : (
              <p className="text-gray-500">Xizmatlarni tanlang</p>
            )}
          </div>

          {step < 4 ? (
            <Button
              onClick={next}
              disabled={(step === 1 && !chosen.length) || (step === 3 && !slot)}
            >
              Davom etish
            </Button>
          ) : (
            <Button
              onClick={() => create.mutate()}
              loading={create.isPending}
              disabled={!canSubmit}
            >
              Band qilish
            </Button>
          )}
        </Container>
      </div>
    </Container>
  );
}

export default BookingPage;
