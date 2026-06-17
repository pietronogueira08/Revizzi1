import { TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}

export default function KpiCard({ label, value, delta, up }: KpiCardProps) {
  return (
    <div
      className="flex flex-col gap-3 p-6 transition-colors hover:bg-[#1E1E1E]"
      style={{
        background: '#171717',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        className="text-[11px] uppercase tracking-[0.15em] font-medium"
        style={{ color: '#888888' }}
      >
        {label}
      </span>

      <span
        className="text-5xl leading-none text-white"
        style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
      >
        {value}
      </span>

      <div className="flex items-center gap-1.5">
        {up
          ? <TrendingUp size={12} style={{ color: '#4ade80' }} />
          : <TrendingDown size={12} style={{ color: '#f87171' }} />
        }
        <span
          className="text-[12px]"
          style={{ color: up ? '#4ade80' : '#f87171' }}
        >
          {delta} vs mês anterior
        </span>
      </div>
    </div>
  );
}
