import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '../../lib/cn';

/** Ko'p sahifada hammasi ko'rsatilmaydi: 1 … 4 5 6 … 12 */
function pageList(page, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);

  const list = [1];
  const from = Math.max(2, page - 1);
  const to = Math.min(pages - 1, page + 1);

  if (from > 2) list.push('…');
  for (let i = from; i <= to; i++) list.push(i);
  if (to < pages - 1) list.push('…');

  list.push(pages);
  return list;
}

export function Pagination({ page, pages, onChange }) {
  if (!pages || pages <= 1) return null;

  const btn =
    'flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-sm transition disabled:cursor-not-allowed disabled:opacity-40';

  return (
    <nav className="mt-8 flex items-center justify-center gap-1.5" aria-label="Sahifalar">
      <button
        type="button"
        className={cn(btn, 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50')}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Oldingi sahifa"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pageList(page, pages).map((item, i) =>
        item === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-gray-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onChange(item)}
            aria-current={item === page ? 'page' : undefined}
            className={cn(
              btn,
              item === page
                ? 'border-brand-600 bg-brand-600 font-medium text-white'
                : 'border-brand-200 bg-white text-gray-700 hover:bg-brand-50',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        type="button"
        className={cn(btn, 'border-brand-200 bg-white text-brand-700 hover:bg-brand-50')}
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Keyingi sahifa"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}

export default Pagination;
