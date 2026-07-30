import { cn } from '../../lib/cn';

/**
 * Bo'sh ekran — kayfiyat emas, yo'nalish beradi:
 * nima yo'qligini aytadi va keyingi qadamni taklif qiladi.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-12 text-center', className)}>
      {Icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50">
          <Icon className="h-7 w-7 text-brand-500" />
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-sm text-gray-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default EmptyState;
