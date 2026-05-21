'use client';

import '@/lib/i18n';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { CategoryBreakdown } from '@shared/types';
import { formatCurrency } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CategoryPieChartProps {
  data: CategoryBreakdown[];
}

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  const { t } = useTranslation('common');

  const translatedData = data.map((item) => ({
    ...item,
    translatedLabel: t(`categories.${item.categoryName}`, { defaultValue: item.label }),
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
          <p className="font-semibold">{d.icon} {d.translatedLabel}</p>
          <p className="text-muted-foreground">{formatCurrency(d.amount)}</p>
          <p className="text-muted-foreground">{d.percentage}%</p>
        </div>
      );
    }
    return null;
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
        {t('common.noData', { defaultValue: 'No expense data yet' })}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={translatedData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={95}
            paddingAngle={3}
            dataKey="amount"
            labelLine={false}
            label={CustomLabel}
          >
            {translatedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Category legend */}
      <div className="space-y-2">
        {translatedData.slice(0, 5).map((cat) => (
          <div key={cat.categoryId} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
              <span className="text-sm text-muted-foreground">{cat.icon} {cat.translatedLabel}</span>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold">{formatCurrency(cat.amount)}</span>
              <span className="text-xs text-muted-foreground ml-1">({cat.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
