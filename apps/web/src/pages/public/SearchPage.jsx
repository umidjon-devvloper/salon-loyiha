import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SearchX } from 'lucide-react';
import { formatServicePrice } from '@gozal/shared/utils/format';
import { formatDurationUz } from '@gozal/shared/utils/time';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { SalonCard, SalonCardSkeleton } from '../../components/catalog/SalonCard';
import { MasterCard } from '../../components/catalog/MasterCard';
import { EmptyState, ErrorState } from '../../components/ui';
import { useDebounce } from '../../hooks/useDebounce';

/**
 * Yozayotganda qidiradi (350 ms debounce), lekin natija URL'da qoladi —
 * havolani ulashish mumkin.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const [term, setTerm] = useState(params.get('q') || '');
  const debounced = useDebounce(term, 350);

  useEffect(() => {
    const next = new URLSearchParams();
    if (debounced.trim()) next.set('q', debounced.trim());
    setParams(next, { replace: true });
  }, [debounced, setParams]);

  const q = debounced.trim();

  // Qidiruv natijalari indekslanmasin — cheksiz ko'p va qiymatsiz sahifalar
  usePageMeta({ title: q ? `"${q}" bo'yicha qidiruv` : 'Qidiruv', noIndex: true });
  const enabled = q.length >= 2;

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: catalogKeys.search({ q, limit: 6 }),
    queryFn: () => catalogApi.search({ q, limit: 6 }),
    enabled,
  });

  const nothingFound = enabled && !isPending && data && data.total === 0;

  return (
    <Container className="py-6 sm:py-8">
      <h1 className="mb-4 text-xl font-semibold text-gray-900 sm:text-2xl">Qidiruv</h1>

      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Xizmat, salon yoki mutaxassis"
          aria-label="Qidiruv"
          autoFocus
          className="h-12 w-full rounded-2xl border border-brand-100 bg-white pl-11 pr-4 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
        />
      </div>

      {!enabled && (
        <EmptyState
          icon={Search}
          title="Nimani qidiryapsiz?"
          description="Kamida 2 ta belgi kiriting — salon nomi, mutaxassis ismi yoki xizmat."
        />
      )}

      {isError && <ErrorState onRetry={refetch} />}

      {enabled && isPending && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <SalonCardSkeleton key={i} />
          ))}
        </div>
      )}

      {nothingFound && (
        <EmptyState
          icon={SearchX}
          title={`"${q}" bo'yicha hech narsa topilmadi`}
          description="Boshqacha yozib ko'ring yoki katalogni ko'zdan kechiring."
        />
      )}

      {enabled && data && data.total > 0 && (
        <div className="space-y-8">
          {data.salons.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-gray-900">Salonlar</h2>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {data.salons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>
            </section>
          )}

          {data.masters.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-gray-900">Mutaxassislar</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {data.masters.map((master) => (
                  <MasterCard key={master.id} master={master} />
                ))}
              </div>
            </section>
          )}

          {data.services.length > 0 && (
            <section>
              <h2 className="mb-3 font-semibold text-gray-900">Xizmatlar</h2>
              <ul className="divide-y divide-brand-50 overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
                {data.services.map((service) => (
                  <li key={service.id}>
                    <Link
                      to={service.salon ? `/salon/${service.salon.slug}` : '/salonlar'}
                      className="flex items-center justify-between gap-3 p-3 transition hover:bg-brand-50 sm:p-4"
                    >
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-gray-900">
                          {service.name}
                        </span>
                        <span className="block truncate text-sm text-gray-500">
                          {service.salon?.name} · {formatDurationUz(service.durationMin)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-semibold text-brand-700">
                        {formatServicePrice(service)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </Container>
  );
}

export default SearchPage;
