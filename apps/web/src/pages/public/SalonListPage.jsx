import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { SearchX } from 'lucide-react';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { FilterPanel } from '../../components/catalog/FilterPanel';
import { Pagination } from '../../components/catalog/Pagination';
import { SalonCard, SalonCardSkeleton } from '../../components/catalog/SalonCard';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { useFilterParams } from '../../hooks/useFilterParams';

const PER_PAGE = 12;

/** Faol filtrlar soni — mobil "Filtr" tugmasidagi belgi uchun */
function countActive(filters) {
  return ['city', 'district', 'minPrice', 'maxPrice', 'q'].filter((k) => filters[k]).length;
}

/**
 * Ikkita yo'l uchun bir sahifa: /salonlar va /kategoriya/:slug.
 * Farqi shundaki, kategoriya sahifasida kategoriya URL yo'lidan keladi
 * va filtr panelida o'zgartirilmaydi.
 */
export function SalonListPage() {
  const { slug } = useParams();
  const [filters, patch, reset] = useFilterParams({ sort: 'top' });

  const { data: categories = [] } = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: catalogApi.categories,
    staleTime: 5 * 60_000,
  });

  const category = slug || filters.category || '';
  const categoryName = categories.find((c) => c.slug === category)?.name;

  usePageMeta({
    title: categoryName || 'Salonlar',
    description: categoryName
      ? `${categoryName} xizmati bo'yicha salonlar va narxlar. Bo'sh vaqtni ko'rib, onlayn band qiling.`
      : "Go'zallik salonlari katalogi: narxlar, ish vaqti va bo'sh vaqtlar.",
  });

  const params = {
    category: category || undefined,
    city: filters.city,
    district: filters.district,
    minPrice: filters.minPrice,
    maxPrice: filters.maxPrice,
    q: filters.q,
    sort: filters.sort || 'top',
    page: Number(filters.page) || 1,
    limit: PER_PAGE,
  };

  const { data, isPending, isError, refetch, isFetching } = useQuery({
    queryKey: catalogKeys.salons(params),
    queryFn: () => catalogApi.salons(params),
    placeholderData: keepPreviousData,
  });

  const salons = data?.items ?? [];
  const meta = data?.meta;

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">
            {categoryName || 'Salonlar'}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {isPending
              ? 'Yuklanmoqda…'
              : meta?.total
                ? `${meta.total} ta salon topildi`
                : 'Salon topilmadi'}
          </p>
        </div>

        <FilterPanel
          value={filters}
          onChange={patch}
          onReset={reset}
          activeCount={countActive(filters)}
        />
      </div>

      {filters.q && (
        <div className="mb-4 flex items-center gap-2 text-sm">
          <span className="text-gray-500">Qidiruv:</span>
          <button
            type="button"
            onClick={() => patch({ q: '' })}
            className="rounded-lg bg-brand-50 px-2 py-1 font-medium text-brand-700 hover:bg-brand-100"
          >
            {filters.q} ✕
          </button>
        </div>
      )}

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <div className="hidden lg:block">
          <FilterPanel value={filters} onChange={patch} onReset={reset} />
        </div>

        <div aria-busy={isFetching}>
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isPending ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SalonCardSkeleton key={i} />
              ))}
            </div>
          ) : salons.length === 0 ? (
            <EmptyState
              icon={SearchX}
              title="Bunday salon topilmadi"
              description="Filtrni kengaytiring yoki boshqa tumanni tanlang."
              action={
                <Button variant="secondary" onClick={reset}>
                  Filtrni tozalash
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
                {salons.map((salon) => (
                  <SalonCard key={salon.id} salon={salon} />
                ))}
              </div>

              <Pagination
                page={meta.page}
                pages={meta.pages}
                onChange={(page) => {
                  patch({ page });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              />
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

export default SalonListPage;
