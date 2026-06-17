import { Bell, Search, ChevronRight } from 'lucide-react';

interface TopBarProps {
  crumbs: string[];
}

export default function TopBar({ crumbs }: TopBarProps) {
  return (
    <header
      className="h-[60px] shrink-0 flex items-center px-8 gap-6"
      style={{
        background: '#111111',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Breadcrumbs */}
      <div className="flex items-center gap-1.5 text-[13px] flex-1">
        {crumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={12} style={{ color: '#555555' }} />}
            <span style={{ color: i === crumbs.length - 1 ? '#FFFFFF' : '#888888' }}>
              {crumb}
            </span>
          </span>
        ))}
      </div>

      {/* Search */}
      <div
        className="flex items-center gap-2 px-3 h-9 flex-1 max-w-xs"
        style={{
          background: '#171717',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Search size={14} style={{ color: '#888888' }} />
        <input
          type="text"
          placeholder="Buscar...  ⌘K"
          className="bg-transparent text-[13px] outline-none flex-1 placeholder:text-[#555555]"
          style={{ color: '#FFFFFF' }}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          className="relative flex items-center justify-center w-9 h-9 transition-colors hover:bg-[#1E1E1E]"
          style={{ border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label="Notificações"
        >
          <Bell size={16} style={{ color: '#888888' }} />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5"
            style={{ background: '#4ade80' }}
          />
        </button>

        <div
          className="w-9 h-9 flex items-center justify-center text-[13px] font-semibold select-none"
          style={{ background: '#1E1E1E', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          AD
        </div>
      </div>
    </header>
  );
}
