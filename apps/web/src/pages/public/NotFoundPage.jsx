import { Link } from 'react-router-dom';
import { Container } from '../../components/layout/Container';
import { Button } from '../../components/ui';

export default function NotFoundPage() {
  return (
    <Container className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <p className="text-5xl font-bold text-brand-200">404</p>
      <h1 className="mt-4 text-xl font-semibold text-gray-900">Bunday sahifa yo&apos;q</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Havola eskirgan yoki manzil noto&apos;g&apos;ri yozilgan bo&apos;lishi mumkin.
      </p>
      <Link to="/" className="mt-6">
        <Button>Bosh sahifaga qaytish</Button>
      </Link>
    </Container>
  );
}
