import { Link } from 'react-router-dom';
import { BadgeCheck, MapPin, Star } from 'lucide-react';
import { formatPrice } from '@gozal/shared/utils/format';

import { Badge, Skeleton } from '../ui';

/** Rasm yo'q bo'lsa — salon nomining birinchi harfi bilan pushti fon */
function CoverFallback({ name }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-brand-100 to-brand-200">
      <span className="text-3xl font-semibold text-brand-500">{(name || '?')[0]}</span>
    </div>
  );
}

export function SalonCard({ salon }) {
  return (
    <Link
      to={`/salon/${salon.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:border-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-50">
        {salon.coverThumb ? (
          <img
            src={salon.coverThumb}
            alt={salon.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <CoverFallback name={salon.name} />
        )}

        {salon.isTop && (
          <span className="absolute left-2 top-2 rounded-lg bg-brand-600 px-2 py-0.5 text-xs font-semibold text-white">
            TOP
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 font-semibold text-gray-900">{salon.name}</h3>
          {salon.isVerified && (
            <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-500" aria-label="Tasdiqlangan" />
          )}
        </div>

        <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
          <MapPin className="h-3.5 w-3.5 shrink-0" />
          <span className="line-clamp-1">
            {salon.district}, {salon.city}
          </span>
        </p>

        {salon.categories?.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {salon.categories.slice(0, 2).map((c) => (
              <Badge key={c.slug} tone="brand">
                {c.name}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-end justify-between gap-2 pt-1">
          <span className="text-sm font-semibold text-brand-700">
            {salon.minPrice > 0 ? `${formatPrice(salon.minPrice)}dan` : 'Narx kelishilgan'}
          </span>

          {salon.reviewCount > 0 && (
            <span className="flex items-center gap-1 text-sm text-gray-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {salon.rating.toFixed(1)}
              <span className="text-gray-400">({salon.reviewCount})</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function SalonCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white">
      <Skeleton className="aspect-[4/3] rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-4 w-1/3" />
      </div>
    </div>
  );
}

export default SalonCard;
