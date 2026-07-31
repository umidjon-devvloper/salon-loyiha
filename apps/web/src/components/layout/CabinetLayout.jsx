import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarDays,
  CalendarOff,
  Clock,
  LayoutDashboard,
  Scissors,
  Store,
  Users,
} from 'lucide-react';

import { Container } from './Container';
import { cn } from '../../lib/cn';

const LINKS = [
  { to: '/kabinet', label: 'Bosh sahifa', icon: LayoutDashboard, end: true },
  { to: '/kabinet/yozuvlar', label: 'Yozuvlar', icon: CalendarDays },
  { to: '/kabinet/jadval', label: 'Ish vaqti', icon: Clock },
  { to: '/kabinet/xizmatlar', label: 'Xizmatlar', icon: Scissors },
  { to: '/kabinet/mutaxassislar', label: 'Mutaxassislar', icon: Users },
  { to: '/kabinet/dam-olish', label: 'Dam olish', icon: CalendarOff },
  { to: '/kabinet/salon', label: 'Salon', icon: Store },
];

/**
 * Kabinet karkasi.
 * Desktopda yon menyu, mobilda gorizontal skroll qilinadigan tab qatori —
 * salon egalarining ko'pchiligi telefondan kiradi.
 */
export function CabinetLayout() {
  return (
    <Container className="py-4 sm:py-6">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <nav className="mb-4 lg:mb-0" aria-label="Kabinet menyusi">
          <ul className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-1 lg:mx-0 lg:sticky lg:top-20 lg:flex-col lg:px-0">
            {LINKS.map(({ to, label, icon: Icon, end }) => (
              <li key={to} className="shrink-0">
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition',
                      isActive
                        ? 'bg-brand-600 text-white'
                        : 'text-gray-600 hover:bg-brand-50 hover:text-brand-700',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </Container>
  );
}

export default CabinetLayout;
