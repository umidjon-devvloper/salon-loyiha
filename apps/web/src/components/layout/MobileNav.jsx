import { NavLink } from 'react-router-dom';
import { Home, Search, Heart, CalendarCheck, User } from 'lucide-react';

const items = [
  { to: '/', label: 'Bosh sahifa', icon: Home, end: true },
  { to: '/qidiruv', label: 'Qidiruv', icon: Search },
  { to: '/profil/sevimlilar', label: 'Sevimlilar', icon: Heart },
  { to: '/profil/yozuvlarim', label: 'Yozuvlar', icon: CalendarCheck },
  { to: '/profil', label: 'Profil', icon: User, end: true },
];

/** Faqat mobilda. Foydalanuvchilarning 85%+ telefondan kiradi */
export function MobileNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-brand-100 bg-white sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Asosiy navigatsiya"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 py-2 text-[11px] transition ${
                  isActive ? 'text-brand-600' : 'text-gray-500'
                }`
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default MobileNav;
