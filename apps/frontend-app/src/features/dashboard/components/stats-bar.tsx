import { MetricCard } from '@/features/dashboard/components/metric-card';
import type { DashboardStat } from '@/features/dashboard/types';

/** Hàng 5 stat card (Figma 134:35881 "stats"). */
export function StatsBar({ stats }: { stats: DashboardStat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <MetricCard
          key={s.key}
          label={s.label}
          value={s.value}
        />
      ))}
    </div>
  );
}
