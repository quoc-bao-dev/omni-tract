'use client';

import { useMemo } from 'react';
import { ContentSection } from '@/features/dashboard/components/content-section';
import { Greeting } from '@/features/dashboard/components/greeting';
import { StatsBar } from '@/features/dashboard/components/stats-bar';
import { deriveStats } from '@/features/dashboard/stats';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';

/** Dashboard (Figma 108:5749): rỗng → Greeting; có dữ liệu → stats + bảng. */
export function DashboardPage() {
  const rows = useContentStore((s) => s.rows);
  const importing = useImportStore((s) => s.status === 'loading');
  const stats = useMemo(() => deriveStats(rows), [rows]);
  const hasData = rows.length > 0 || importing;

  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-6 py-6">
      {hasData ? (
        <>
          <StatsBar stats={stats} />
          <ContentSection />
        </>
      ) : (
        <Greeting />
      )}
    </main>
  );
}
