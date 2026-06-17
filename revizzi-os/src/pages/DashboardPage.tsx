import { motion } from 'framer-motion';
import { kpis, revenueData, recentOrders } from '../data/mock';
import KpiCard from '../components/ui/KpiCard';
import RevenueChart from '../components/ui/RevenueChart';
import StatusBadge from '../components/ui/StatusBadge';

export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      {/* Page title */}
      <div className="mb-8 flex items-baseline justify-between">
        <h1
          className="text-5xl text-white tracking-widest uppercase"
          style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
        >
          Dashboard
        </h1>
        <span className="text-[13px]" style={{ color: '#888888' }}>
          Junho 2026
        </span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Revenue Chart */}
      <div
        className="mt-6 p-6"
        style={{
          background: '#171717',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2
              className="text-xl uppercase tracking-widest text-white"
              style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
            >
              Receita — 12 Meses
            </h2>
            <p className="text-[12px] mt-0.5" style={{ color: '#888888' }}>
              Jan – Dez 2026
            </p>
          </div>
          <span
            className="text-[11px] uppercase tracking-widest px-2 py-1"
            style={{ background: '#1E1E1E', color: '#888888', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Anual
          </span>
        </div>
        <RevenueChart data={revenueData} />
      </div>

      {/* Recent Orders */}
      <div
        className="mt-6"
        style={{
          background: '#171717',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
        >
          <h2
            className="text-xl uppercase tracking-widest text-white"
            style={{ fontFamily: '"Bebas Neue", Impact, sans-serif' }}
          >
            Pedidos Recentes
          </h2>
          <a
            href="/pedidos"
            className="text-[12px] uppercase tracking-wider transition-colors hover:text-white"
            style={{ color: '#888888' }}
          >
            Ver todos →
          </a>
        </div>

        <table className="w-full text-[13px]">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {['ID', 'Cliente', 'Data', 'Status', 'Total'].map((col) => (
                <th
                  key={col}
                  className="text-left px-6 py-3 font-medium uppercase tracking-widest text-[11px]"
                  style={{ color: '#555555' }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr
                key={order.id}
                className="transition-colors hover:bg-[#1E1E1E] cursor-default"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
              >
                <td className="px-6 py-3 font-mono" style={{ color: '#888888' }}>
                  {order.id}
                </td>
                <td className="px-6 py-3 text-white">{order.client}</td>
                <td className="px-6 py-3" style={{ color: '#888888' }}>{order.date}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="px-6 py-3 font-medium text-white">{order.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
