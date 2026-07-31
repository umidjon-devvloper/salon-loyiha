import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';

import { Container } from '../../components/layout/Container';
import { Button, EmptyState } from '../../components/ui';

/**
 * ⚠️ VAQTINCHA. Band qilish wizardi 3-haftada shu route'ni egallaydi
 * (`/band-qilish/:masterId`). Bu sahifa faqat URL shaklini band qilib turadi —
 * katalogdagi "Band qilish" tugmasi 404 ga olib bormasin.
 */
export function BookingSoonPage() {
  const { masterId } = useParams();
  const [params] = useSearchParams();
  const services = (params.get('services') || '').split(',').filter(Boolean);

  return (
    <Container className="py-10">
      <EmptyState
        icon={CalendarClock}
        title="Band qilish oqimi tayyorlanmoqda"
        description={`Tanlangan xizmatlar: ${services.length} ta. Bo'sh vaqtni tanlash qadami keyingi bosqichda ulanadi.`}
        action={
          <Link to={`/mutaxassis/${masterId}`}>
            <Button variant="secondary">Mutaxassisga qaytish</Button>
          </Link>
        }
      />
    </Container>
  );
}

export default BookingSoonPage;
