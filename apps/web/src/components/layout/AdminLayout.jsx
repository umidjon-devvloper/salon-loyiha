import { NavLink, Outlet } from 'react-router-dom';
import { CalendarDays, LayoutDashboard, Settings, Store, Tags, Users } from 'lucide-react';

import { Container } from './Container';
import { cn } from '../../lib/cn';

const LINKS = [
  { to: '/admin', label: 'Statistika', icon: LayoutDashboard, end: true },
  { to: '/admin/salonlar', label: 'Salonlar', icon: Store },
  { to: '/admin/kategoriyalar', label: 'Kategoriyalar', icon: Tags },
  { to: '/admin/foydalanuvchilar', label: 'Foydalanuvchilar', icon: Users },
  { to: '/admin/yozuvlar', label: 'Yozuvlar', icon: CalendarDays },
  { to: '/admin/sozlamalar', label: 'Sozlamalar', icon: Settings },
];

export function AdminLayout() {
  return (
    <Container className="py-4 sm:py-6">
      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
        <nav className="mb-4 lg:mb-0" aria-label="Admin menyusi">
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
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
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

export default AdminLayout;
