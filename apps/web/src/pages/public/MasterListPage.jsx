import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { UserSearch } from 'lucide-react';

import { catalogApi, catalogKeys } from '../../api/catalog.api';
import { Container } from '../../components/layout/Container';
import { usePageMeta } from '../../hooks/usePageMeta';
import { FilterPanel } from '../../components/catalog/FilterPanel';
import { Pagination } from '../../components/catalog/Pagination';
import { MasterCard, MasterCardSkeleton } from '../../components/catalog/MasterCard';
import { Button, EmptyState, ErrorState } from '../../components/ui';
import { useFilterParams } from '../../hooks/useFilterParams';

const PER_PAGE = 12;

export function MasterListPage() {
  const [filters, patch, reset] = useFilterParams();

  usePageMeta({
    title: 'Mutaxassislar',
    description: "Go'zallik mutaxassislari: tajriba, xizmatlar va bo'sh vaqtlar.",
  });

  const params = {
    category: filters.category,
    city: filters.city,
    district: filters.district,
    salon: filters.salon,
    q: filters.q,
    page: Number(filters.page) || 1,
    limit: PER_PAGE,
  };

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: catalogKeys.masters(params),
    queryFn: () => catalogApi.masters(params),
    placeholderData: keepPreviousData,
  });

  const masters = data?.items ?? [];
  const meta = data?.meta;

  return (
    <Container className="py-6 sm:py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 sm:text-2xl">Mutaxassislar</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isPending
              ? 'Yuklanmoqda…'
              : meta?.total
                ? `${meta.total} ta mutaxassis`
                : 'Mutaxassis topilmadi'}
          </p>
        </div>

        <FilterPanel
          value={filters}
          onChange={patch}
          onReset={reset}
          showSort={false}
          activeCount={['city', 'district', 'q'].filter((k) => filters[k]).length}
        />
      </div>

      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-6">
        <div className="hidden lg:block">
          <FilterPanel value={filters} onChange={patch} onReset={reset} showSort={false} />
        </div>

        <div>
          {isError ? (
            <ErrorState onRetry={refetch} />
          ) : isPending ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <MasterCardSkeleton key={i} />
              ))}
            </div>
          ) : masters.length === 0 ? (
            <EmptyState
              icon={UserSearch}
              title="Mutaxassis topilmadi"
              description="Boshqa tumanni tanlab ko'ring."
              action={
                <Button variant="secondary" onClick={reset}>
                  Filtrni tozalash
                </Button>
              }
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {masters.map((master) => (
                  <MasterCard key={master.id} master={master} />
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

export default MasterListPage;
