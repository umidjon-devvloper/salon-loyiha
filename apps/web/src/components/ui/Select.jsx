import { forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../lib/cn';

export const Select = forwardRef(function Select(
  { label, error, options = [], placeholder, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const selectId = id || generatedId;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          ref={ref}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'block h-11 w-full appearance-none rounded-xl border bg-white pl-3.5 pr-10 text-gray-900',
            'transition focus:outline-none focus:ring-2 focus:ring-brand-500/30',
            error ? 'border-rose-400' : 'border-gray-200 focus:border-brand-500',
            className,
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-gray-400" />
      </div>

      {error && <p className="mt-1.5 text-sm text-rose-600">{error}</p>}
    </div>
  );
});

export default Select;
