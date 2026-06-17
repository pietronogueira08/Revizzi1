import type { OrderStatus } from '../../data/mock';

const cfg: Record<OrderStatus, { bg: string; color: string }> = {
  Entregue:  { bg: 'rgba(74, 222, 128, 0.1)',  color: '#4ade80' },
  Pendente:  { bg: 'rgba(250, 204, 21, 0.1)',   color: '#facc15' },
  Cancelado: { bg: 'rgba(248, 113, 113, 0.1)',  color: '#f87171' },
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const { bg, color } = cfg[status];
  return (
    <span
      className="inline-block px-2 py-0.5 text-[11px] uppercase tracking-wider font-medium"
      style={{ background: bg, color }}
    >
      {status}
    </span>
  );
}
