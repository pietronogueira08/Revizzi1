import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: { date: string; value: number }[];
}

interface TooltipPayload {
  active?: boolean;
  payload?: Array<{ value?: number }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipPayload) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="px-3 py-2 text-[13px]"
      style={{
        background: '#171717',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#FFFFFF',
      }}
    >
      <div style={{ color: '#888888', fontSize: 11, marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: '"Bebas Neue", Impact, sans-serif', fontSize: 18 }}>
        R$ {payload[0].value?.toLocaleString('pt-BR')}
      </div>
    </div>
  );
}

export default function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data} margin={{ top: 8, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity={0}    />
          </linearGradient>
        </defs>

        <CartesianGrid
          strokeDasharray="0"
          stroke="rgba(255,255,255,0.05)"
          vertical={false}
        />

        <XAxis
          dataKey="date"
          tick={{ fill: '#555555', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
        />

        <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }} />

        <Area
          type="monotone"
          dataKey="value"
          stroke="#FFFFFF"
          strokeWidth={1.5}
          fill="url(#areaGrad)"
          dot={false}
          activeDot={{ r: 3, fill: '#FFFFFF', strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
