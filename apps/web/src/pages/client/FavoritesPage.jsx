import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

import { Container } from '../../components/layout/Container';
import { SalonCard } from '../../components/catalog/SalonCard';
import { Button, EmptyState } from '../../components/ui';
import { useFavoritesStore } from '../../store/favoritesStore';

export function FavoritesPage() {
  const items = useFavoritesStore((state) => state.items);

  return (
    <Container className="py-6">
      <h1 className="mb-4 text-xl font-semibold text-gray-900">Sevimlilar</h1>

      {items.length === 0 ? (
        <EmptyState
          icon={Heart}
          title="Sevimlilar bo'sh"
          description="Yoqqan salonni kartochkasidagi yurak belgisi bilan saqlang."
          action={
            <Link to="/salonlar">
              <Button>Salonlarni ko&apos;rish</Button>
            </Link>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-gray-500">
            Sevimlilar shu brauzerda saqlanadi — boshqa qurilmada ko&apos;rinmaydi.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
            {items.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        </>
      )}
    </Container>
  );
}

export default FavoritesPage;
