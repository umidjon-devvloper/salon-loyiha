import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { formatDurationUz } from '@gozal/shared/utils/time';
import { formatPrice } from '@gozal/shared/utils/format';

import { ownerApi, ownerKeys } from '../../api/owner.api';
import { bookingApi, bookingKeys } from '../../api/booking.api';
import { Button, Input, Modal, PhoneInput, Select, Skeleton } from '../../components/ui';
import { SlotGrid } from '../../components/booking/SlotGrid';

/**
 * ⭐ Telefon orqali kelgan mijozni qo'lda kiritish.
 *
 * Salonlarning mijozlari hali ham asosan qo'ng'iroq qiladi. Egasi ularni
 * kiritmasa, jadval real bo'lmaydi va onlayn slotlar yolg'on chiqadi.
 *
 * Slotlar shu yerda ham backenddan so'raladi — egasi ustma-ust yozuv
 * qo'shib yubormasligi uchun.
 */
export function ManualBookingModal({ open, date, onClose, onCreated }) {
  const [masterId, setMasterId] = useState('');
  const [serviceIds, setServiceIds] = useState([]);
  const [slot, setSlot] = useState(null);
  const [form, setForm] = useState({ clientName: '', clientPhone: '', note: '' });

  const mastersQuery = useQuery({
    queryKey: ownerKeys.masters,
    queryFn: ownerApi.masters,
    enabled: open,
  });

  const servicesQuery = useQuery({
    queryKey: ownerKeys.services,
    queryFn: ownerApi.services,
    enabled: open,
  });

  const masters = (mastersQuery.data || []).filter((m) => m.isActive);
  const activeMaster = masterId || masters[0]?.id || '';
  const services = (servicesQuery.data || []).filter(
    (s) => s.isActive && (!s.masters?.length || s.masters.includes(activeMaster)),
  );

  const slotsQuery = useQuery({
    queryKey: bookingKeys.availability({ masterId: activeMaster, date, serviceIds }),
    queryFn: () => bookingApi.availability({ masterId: activeMaster, date, serviceIds }),
    enabled: open && Boolean(activeMaster) && serviceIds.length > 0,
  });

  const chosen = services.filter((s) => serviceIds.includes(s.id));
  const totalPrice = chosen.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = chosen.reduce((sum, s) => sum + s.durationMin, 0);

  const reset = () => {
    setServiceIds([]);
    setSlot(null);
    setForm({ clientName: '', clientPhone: '', note: '' });
  };

  const create = useMutation({
    mutationFn: () =>
      ownerApi.manualBooking({
        masterId: activeMaster,
        serviceIds,
        date,
        startTime: slot.start,
        ...form,
      }),
    onSuccess: () => {
      toast.success('Yozuv qo\u2019shildi');
      reset();
      onCreated?.();
      onClose();
    },
    onError: (error) => toast.error(error.message),
  });

  const canSubmit =
    activeMaster &&
    serviceIds.length > 0 &&
    slot &&
    form.clientName.trim().length >= 2 &&
    form.clientPhone;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Qo'lda yozuv"
      description="Telefon orqali kelgan mijoz uchun"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Yopish
          </Button>
          <Button loading={create.isPending} disabled={!canSubmit} onClick={() => create.mutate()}>
            Qo&apos;shish
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {masters.length > 1 && (
          <Select
            label="Mutaxassis"
            value={activeMaster}
            onChange={(e) => {
              setMasterId(e.target.value);
              setSlot(null);
            }}
            options={masters.map((m) => ({ value: m.id, label: m.fullName }))}
          />
        )}

        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Xizmatlar</span>

          {servicesQuery.isPending ? (
            <Skeleton className="h-24" />
          ) : services.length === 0 ? (
            <p className="text-sm text-gray-500">
              Avval xizmat qo&apos;shing — davomiyligisiz vaqtni hisoblab bo&apos;lmaydi.
            </p>
          ) : (
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-gray-200 p-2">
              {services.map((service) => (
                <label
                  key={service.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-brand-50"
                >
                  <input
                    type="checkbox"
                    checked={serviceIds.includes(service.id)}
                    onChange={() => {
                      setSlot(null);
                      setServiceIds((prev) =>
                        prev.includes(service.id)
                          ? prev.filter((x) => x !== service.id)
                          : [...prev, service.id],
                      );
                    }}
                    className="h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span className="flex-1 truncate text-sm">{service.name}</span>
                  <span className="text-xs text-gray-500">
                    {formatDurationUz(service.durationMin)}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>

        {serviceIds.length > 0 && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Bo&apos;sh vaqtlar
            </span>

            {slotsQuery.isPending ? (
              <Skeleton className="h-20" />
            ) : !slotsQuery.data?.slots?.length ? (
              <p className="text-sm text-gray-500">
                {slotsQuery.data?.reason || 'Bu kunda bo\u2019sh vaqt yo\u2019q'}
              </p>
            ) : (
              <SlotGrid slots={slotsQuery.data.slots} value={slot?.startMin} onChange={setSlot} />
            )}
          </div>
        )}

        <Input
          label="Mijoz ismi"
          required
          value={form.clientName}
          onChange={(e) => setForm({ ...form, clientName: e.target.value })}
        />
        <PhoneInput
          label="Telefon raqam"
          required
          value={form.clientPhone}
          onChange={(value) => setForm({ ...form, clientPhone: value })}
        />
        <Input
          label="Izoh"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
        />

        {chosen.length > 0 && (
          <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800">
            {chosen.length} ta xizmat · {formatDurationUz(totalDuration)} ·{' '}
            {formatPrice(totalPrice)}
          </p>
        )}
      </div>
    </Modal>
  );
}

export default ManualBookingModal;
