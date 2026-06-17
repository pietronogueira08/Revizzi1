import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard',       path: '/'           },
  { icon: ShoppingCart,    label: 'Pedidos',          path: '/pedidos'    },
  { icon: Package,         label: 'Produtos',         path: '/produtos'   },
  { icon: Users,           label: 'Clientes',         path: '/clientes'   },
  { icon: Settings,        label: 'Configurações',    path: '/config'     },
];

export default function Sidebar() {
  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col"
      style={{ background: '#111111', borderRight: '1px solid rgba(255,255,255,0.08)' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-6 h-[60px] shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex flex-col leading-none">
          <span
            className="text-white text-xl tracking-widest uppercase"
            style={{ fontFamily: '"Bebas Neue", Impact, sans-serif', letterSpacing: '0.12em' }}
          >
            Revizzi OS
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em]" style={{ color: '#888888' }}>
            Admin Panel
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4">
        {navItems.map(({ icon: Icon, label, path }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-6 h-11 text-[14px] font-medium transition-colors relative select-none',
                isActive
                  ? 'text-white bg-[#1E1E1E]'
                  : 'text-[#888888] hover:text-white hover:bg-[#171717]',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-white"
                  />
                )}
                <Icon size={16} />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div
        className="px-6 py-4 text-[11px] uppercase tracking-widest"
        style={{ color: '#555555', borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        v1.0.0 — 2026
      </div>
    </aside>
  );
}
