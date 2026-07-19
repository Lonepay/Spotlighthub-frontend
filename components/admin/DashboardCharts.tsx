'use client';

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';
import { Card, CardContent } from '@/components/ui/card';
import { PieChart as PieIcon, TrendingUp, Trophy } from 'lucide-react';

const DONUT_COLORS = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#f97316'];

function ChartTooltip({ active, payload, label, formatter }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-elevated text-xs">
      {label && <p className="font-medium mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color || p.fill }}>
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

export function DashboardCharts({
  eventsByCategory,
  revenueTrends,
  topOrganizers,
}: {
  eventsByCategory: { category: string; count: number }[];
  revenueTrends: { date: string; revenue: number }[];
  topOrganizers: { id: number; name: string; events_count: number }[];
}) {
  const formatNaira = (value: number) =>
    new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(value);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Events by Category</h2>
            <PieIcon className="w-5 h-5 text-muted-foreground" />
          </div>
          {eventsByCategory.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No events yet.</p>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={eventsByCategory}
                    dataKey="count"
                    nameKey="category"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {eventsByCategory.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Revenue (Last 30 Days)</h2>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </div>
          {revenueTrends.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No revenue in this window yet.</p>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueTrends} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₦${v >= 1000 ? `${Math.round(v / 1000)}k` : v}`} width={48} />
                  <Tooltip content={<ChartTooltip formatter={formatNaira} />} />
                  <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg">Top Organizers by Events Created</h2>
            <Trophy className="w-5 h-5 text-muted-foreground" />
          </div>
          {topOrganizers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-16">No organizers yet.</p>
          ) : (
            <div className="w-full h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topOrganizers} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-20} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} width={32} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="events_count" name="Events" radius={[6, 6, 0, 0]}>
                    {topOrganizers.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
