import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, currentMonth, todayStr } from '@gozal/shared/utils/time';
import { WEEK_LABELS_UZ, buildMonthGrid, formatMonthUz } from '@gozal/shared/utils/calendar';

import { cn } from '../../lib/cn';
import { Skeleton } from '../ui';

/**
 * @param {Record<string, {available: boolean, slotCount?: number, reason?: string}>} days
 */
export function Calendar({ month, onMonthChange, value, onChange, days = {}, loading = false }) {
  const cells = buildMonthGrid(month);
  const today = todayStr();
  const canGoBack = month > currentMonth();

  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-3 shadow-sm sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, -1))}
          disabled={!canGoBack}
          aria-label="Oldingi oy"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 transition hover:bg-brand-50 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <span className="font-medium text-gray-900">{formatMonthUz(month)}</span>

        <button
          type="button"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="Keyingi oy"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-brand-700 transition hover:bg-brand-50"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs text-gray-400">
        {WEEK_LABELS_UZ.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Skeleton key={i} className="h-11" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((date, i) => {
            if (!date) return <span key={`empty-${i}`} />;

            const info = days[date];
            const disabled = !info?.available;
            const isSelected = date === value;
            const isToday = date === today;

            return (
              <button
                key={date}
                type="button"
                disabled={disabled}
                onClick={() => onChange(date)}
                title={disabled ? info?.reason || undefined : undefined}
                className={cn(
                  'flex h-11 flex-col items-center justify-center rounded-xl text-sm transition',
                  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
                  isSelected
                    ? 'bg-brand-600 font-semibold text-white'
                    : disabled
                      ? 'cursor-not-allowed text-gray-300'
                      : 'text-gray-800 hover:bg-brand-50',
                  isToday && !isSelected && 'ring-1 ring-brand-300',
                )}
              >
                {Number(date.slice(8, 10))}
                {/* Bo'sh joy ko'pligi ko'rinib tursin — mijoz kunni tanlashda adashmaydi */}
                {!disabled && info?.slotCount > 0 && (
                  <span
                    className={cn(
                      'mt-0.5 h-1 w-1 rounded-full',
                      isSelected ? 'bg-white' : 'bg-brand-400',
                    )}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Calendar;
