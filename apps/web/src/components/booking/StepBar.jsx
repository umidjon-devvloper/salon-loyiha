import { Check } from 'lucide-react';

import { cn } from '../../lib/cn';

const STEPS = ['Xizmat', 'Mutaxassis', 'Vaqt', 'Tasdiq'];

/** Qadamlar chizig'i: qayerdaligi va qancha qolgani ko'rinib tursin */
export function StepBar({ step, steps = STEPS, onBack }) {
  return (
    <ol className="mb-6 flex items-center gap-2">
      {steps.map((label, i) => {
        const index = i + 1;
        const done = index < step;
        const active = index === step;

        return (
          <li key={label} className="flex flex-1 items-center gap-2">
            <button
              type="button"
              disabled={!done || !onBack}
              onClick={() => done && onBack?.(index)}
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition',
                done && 'bg-brand-100 text-brand-700 hover:bg-brand-200',
                active && 'bg-brand-600 text-white',
                !done && !active && 'bg-gray-100 text-gray-400',
              )}
              aria-label={`${index}-qadam: ${label}`}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : index}
            </button>

            <span
              className={cn(
                'hidden text-sm sm:inline',
                active ? 'font-medium text-gray-900' : 'text-gray-500',
              )}
            >
              {label}
            </span>

            {i < steps.length - 1 && <span className="h-px flex-1 bg-gray-200" />}
          </li>
        );
      })}
    </ol>
  );
}

export default StepBar;
