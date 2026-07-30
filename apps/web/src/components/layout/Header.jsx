import { Link, NavLink } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';

import { Container } from './Container';
import { Logo } from './Logo';
import { Button } from '../ui';
import { useAuth } from '../../hooks/useAuth';

const links = [
  { to: '/salonlar', label: 'Salonlar' },
  { to: '/mutaxassislar', label: 'Mutaxassislar' },
  { to: '/qidiruv', label: 'Qidiruv' },
];

/** Rolga qarab shaxsiy kabinet havolasi */
function cabinetLink(role) {
  if (role === 'owner') return { to: '/kabinet', label: 'Kabinet' };
  if (role === 'admin') return { to: '/admin', label: 'Admin' };
  return { to: '/profil', label: 'Profil' };
}

export function Header() {
  const { isAuthenticated, user, logout } = useAuth();
  const cabinet = cabinetLink(user?.role);

  return (
    <header className="sticky top-0 z-40 border-b border-brand-100 bg-white/90 backdrop-blur">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `rounded-xl px-3 py-2 text-sm font-medium transition ${
                  isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-50'
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to={cabinet.to}
                className="hidden items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 sm:flex"
              >
                <UserIcon className="h-4 w-4" />
                {cabinet.label}
              </Link>
              <Button variant="ghost" size="sm" onClick={logout} aria-label="Chiqish">
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Chiqish</span>
              </Button>
            </>
          ) : (
            <>
              <Link to="/kirish">
                <Button variant="ghost" size="sm">
                  Kirish
                </Button>
              </Link>
              <Link to="/royxatdan-otish">
                <Button size="sm">Ro&apos;yxatdan o&apos;tish</Button>
              </Link>
            </>
          )}
        </div>
      </Container>
    </header>
  );
}

export default Header;
