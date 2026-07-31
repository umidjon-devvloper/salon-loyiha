import { Link } from 'react-router-dom';

import { CategoryIcon } from './CategoryIcon';
import { Skeleton } from '../ui';

/** Mobilda 3 ustun — maketdagidek */
export function CategoryGrid({ categories = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
      {categories.map((category) => (
        <Link
          key={category.slug}
          to={`/kategoriya/${category.slug}`}
          className="flex flex-col items-center gap-2 rounded-2xl border border-brand-100 bg-white p-3 text-center shadow-sm transition hover:border-brand-300 hover:bg-brand-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50">
            <CategoryIcon name={category.icon} className="h-5 w-5 text-brand-500" />
          </span>
          <span className="line-clamp-2 text-xs font-medium leading-tight text-gray-700">
            {category.name}
          </span>
          {category.salonCount > 0 && (
            <span className="text-[11px] text-gray-400">{category.salonCount} ta</span>
          )}
        </Link>
      ))}
    </div>
  );
}

export default CategoryGrid;
