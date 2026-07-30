import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Label + input + xato xabari.
 * Xato bo'lsa `aria-invalid` va `aria-describedby` qo'yiladi —
 * skrin rider foydalanuvchisi ham nima xato ekanini eshitadi.
 */
export const Input = forwardRef(function Input(
  { label, error, hint, className, id, required, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-rose-600">*</span>}
        </label>
      )}

      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : hint ? hintId : undefined}
        className={cn(
          'block h-11 w-full rounded-xl border bg-white px-3.5 text-gray-900 transition',
          'placeholder:text-gray-400',
          'focus:outline-none focus:ring-2 focus:ring-brand-500/30',
          'disabled:cursor-not-allowed disabled:bg-gray-50',
          error
            ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/30'
            : 'border-gray-200 focus:border-brand-500',
          className,
        )}
        {...props}
      />

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="mt-1.5 text-sm text-gray-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
