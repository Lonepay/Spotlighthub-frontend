'use client';

import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';

const COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

function DonutTooltip({ active, payload, formatter }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-elevated text-xs">
      <p style={{ color: p.color || p.payload?.fill }}>
        {p.name}: {formatter ? formatter(p.value) : p.value}
      </p>
    </div>
  );
}

export function DonutBreakdown({
  data,
  emptyLabel = 'No data yet.',
  formatter,
  height = 260,
}: {
  data: { name: string; value: number }[];
  emptyLabel?: string;
  formatter?: (value: number) => string;
  height?: number;
}) {
  const filtered = data.filter((d) => d.value > 0);

  if (filtered.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-16">{emptyLabel}</p>;
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={filtered} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {filtered.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<DonutTooltip formatter={formatter} />} />
          <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
