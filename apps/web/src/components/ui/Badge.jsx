import { cn } from '../../lib/cn';

const tones = {
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  brand: 'bg-brand-50 text-brand-700 ring-brand-200',
};

/** Yozuv statuslari uchun o'zbekcha yorliqlar */
export const BOOKING_STATUS_LABEL = {
  awaiting_payment: { text: 'To\u2019lov kutilmoqda', tone: 'slate' },
  pending: { text: 'Kutilmoqda', tone: 'amber' },
  confirmed: { text: 'Tasdiqlangan', tone: 'emerald' },
  completed: { text: 'Yakunlangan', tone: 'slate' },
  cancelled: { text: 'Bekor qilingan', tone: 'rose' },
  no_show: { text: 'Kelmadi', tone: 'rose' },
};

export function Badge({ tone = 'slate', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const item = BOOKING_STATUS_LABEL[status] || { text: status, tone: 'slate' };
  return <Badge tone={item.tone}>{item.text}</Badge>;
}

export default Badge;
