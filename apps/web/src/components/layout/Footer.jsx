import { Link } from 'react-router-dom';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-brand-100 bg-brand-50/50">
      <Container className="flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-700">Go&apos;zal Ayol</p>
          <p className="mt-1 text-sm text-gray-500">
            Go&apos;zallik salonlariga onlayn navbat — 24/7
          </p>
        </div>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-600">
          <Link to="/biz-haqimizda" className="hover:text-brand-700">
            Biz haqimizda
          </Link>
          <Link to="/oferta" className="hover:text-brand-700">
            Ommaviy oferta
          </Link>
          <Link to="/maxfiylik" className="hover:text-brand-700">
            Maxfiylik siyosati
          </Link>
        </nav>
      </Container>
    </footer>
  );
}

export default Footer;
