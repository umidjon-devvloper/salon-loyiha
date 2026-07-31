import { cn } from '../../lib/cn';
import { Skeleton } from '../ui';

/** Mobilda 3 ustun, desktopda 6 — barmoq bilan bosish uchun yetarli katta */
export function SlotGrid({ slots = [], value, onChange }) {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {slots.map((slot) => (
        <button
          key={slot.startMin}
          type="button"
          onClick={() => onChange(slot)}
          aria-pressed={value === slot.startMin}
          className={cn(
            'rounded-xl border py-2.5 text-sm font-medium transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600',
            value === slot.startMin
              ? 'border-brand-600 bg-brand-600 text-white'
              : 'border-brand-100 bg-white text-gray-700 hover:border-brand-400 hover:bg-brand-50',
          )}
        >
          {slot.start}
        </button>
      ))}
    </div>
  );
}

export function SlotGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <Skeleton key={i} className="h-10" />
      ))}
    </div>
  );
}

export default SlotGrid;
