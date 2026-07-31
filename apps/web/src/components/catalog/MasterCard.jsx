import { Link } from 'react-router-dom';
import { MapPin, Star } from 'lucide-react';

import { Skeleton } from '../ui';

function PhotoFallback({ name }) {
  return (
    <div className="flex h-full w-full items-center justify-center bg-brand-50">
      <span className="text-2xl font-semibold text-brand-400">{(name || '?')[0]}</span>
    </div>
  );
}

/** Tajribani o'zbekcha yozish: 0 yil o'rniga hech narsa ko'rsatilmaydi */
function experienceText(years) {
  if (!years) return null;
  return `${years} yil tajriba`;
}

export function MasterCard({ master }) {
  const experience = experienceText(master.experienceYears);

  return (
    <Link
      to={`/mutaxassis/${master.id}`}
      className="flex gap-3 rounded-2xl border border-brand-100 bg-white p-3 shadow-sm transition hover:border-brand-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 sm:p-4"
    >
      <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl">
        {master.photoThumb ? (
          <img
            src={master.photoThumb}
            alt={master.fullName}
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <PhotoFallback name={master.fullName} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="line-clamp-1 font-semibold text-gray-900">{master.fullName}</h3>

        {master.salon && (
          <p className="mt-0.5 line-clamp-1 text-sm text-gray-600">{master.salon.name}</p>
        )}

        {master.salon && (
          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="line-clamp-1">{master.salon.district}</span>
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-3 text-sm">
          {experience && <span className="text-gray-500">{experience}</span>}
          {master.rating > 0 && (
            <span className="flex items-center gap-1 text-gray-600">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              {master.rating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function MasterCardSkeleton() {
  return (
    <div className="flex gap-3 rounded-2xl border border-brand-100 bg-white p-4">
      <Skeleton className="h-20 w-20 shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}

export default MasterCard;
