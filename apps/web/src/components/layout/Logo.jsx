import { Link } from 'react-router-dom';

export function Logo({ to = '/' }) {
  return (
    <Link to={to} className="flex items-center gap-2" aria-label="Go'zal Ayol — bosh sahifa">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
          <path d="M12 20c-3.2-2.3-5.8-4.5-5.8-7.3a3.3 3.3 0 0 1 5.8-2.2 3.3 3.3 0 0 1 5.8 2.2c0 2.8-2.6 5-5.8 7.3z" />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-brand-700">Go&apos;zal Ayol</span>
    </Link>
  );
}

export default Logo;
