'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WeeklyTrend } from '@shared/types';
import { formatCurrency } from '@/lib/utils';

interface IncomeExpenseChartProps {
  data: WeeklyTrend[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.fill }}>
            {p.name}: {formatCurrency(p.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function IncomeExpenseChart({ data }: IncomeExpenseChartProps) {
  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        No data for this period
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: `W${d.weekNumber}`,
    Income: d.income,
    Expenses: d.expenses,
  }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `$${v}`}
          width={40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="Income" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={32} />
        <Bar dataKey="Expenses" fill="#f43f5e" radius={[6, 6, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
