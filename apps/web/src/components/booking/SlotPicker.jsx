import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CalendarX } from 'lucide-react';
import { currentMonth, formatDateUz, monthOf } from '@gozal/shared/utils/time';

import { bookingApi, bookingKeys } from '../../api/booking.api';
import { Calendar } from './Calendar';
import { SlotGrid, SlotGridSkeleton } from './SlotGrid';
import { EmptyState, ErrorState } from '../ui';

/**
 * Kun tanlash + bo'sh vaqtlar.
 *
 * Ikki so'rov: oy bo'yicha (qaysi kunlar ochiq — nuqta bilan) va tanlangan kun
 * bo'yicha (aniq slotlar). Oylik so'rov 30 kunni bir marta oladi, har kunga
 * alohida so'rov yuborilmaydi.
 *
 * Ko'rilayotgan oy — shu komponentning ichki holati: odam tanlamasdan ham
 * keyingi oyni varaqlab ko'rishi mumkin.
 */
export function SlotPicker({ masterId, serviceIds, date, onDateChange, slot, onSlotChange }) {
  const [month, setMonth] = useState(date ? monthOf(date) : currentMonth());

  const daysQuery = useQuery({
    queryKey: bookingKeys.availabilityDays({ masterId, month, serviceIds }),
    queryFn: () => bookingApi.availabilityDays({ masterId, month, serviceIds }),
    enabled: serviceIds.length > 0,
  });

  const slotsQuery = useQuery({
    queryKey: bookingKeys.availability({ masterId, date, serviceIds }),
    queryFn: () => bookingApi.availability({ masterId, date, serviceIds }),
    enabled: Boolean(date) && serviceIds.length > 0,
    // Slot tez o'zgaradi: boshqa tabdan qaytganda qayta so'raladi
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  const changeMonth = (nextMonth) => {
    setMonth(nextMonth);
    onDateChange(null);
    onSlotChange(null);
  };

  const changeDate = (nextDate) => {
    onSlotChange(null);
    onDateChange(nextDate);
  };

  return (
    <div className="space-y-5">
      <Calendar
        month={month}
        onMonthChange={changeMonth}
        value={date}
        onChange={changeDate}
        days={daysQuery.data?.days || {}}
        loading={daysQuery.isPending}
      />

      {daysQuery.isError && <ErrorState onRetry={daysQuery.refetch} />}

      {date && (
        <div>
          <h3 className="mb-2 font-medium text-gray-900">{formatDateUz(date)}</h3>

          {slotsQuery.isPending ? (
            <SlotGridSkeleton />
          ) : slotsQuery.isError ? (
            <ErrorState onRetry={slotsQuery.refetch} />
          ) : slotsQuery.data.slots.length === 0 ? (
            <EmptyState
              icon={CalendarX}
              title="Bu kunda bo'sh vaqt yo'q"
              description={slotsQuery.data.reason || 'Boshqa kunni tanlang.'}
            />
          ) : (
            <SlotGrid
              slots={slotsQuery.data.slots}
              value={slot?.startMin}
              onChange={onSlotChange}
            />
          )}
        </div>
      )}
    </div>
  );
}

export default SlotPicker;
