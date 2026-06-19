'use client';

import { useEffect, useMemo } from 'react';
import { DetailDrawer, FloatingVideo } from '@/features/content-detail';
import { ContentSection } from '@/features/dashboard/components/content-section';
import { Greeting } from '@/features/dashboard/components/greeting';
import { StatsBar } from '@/features/dashboard/components/stats-bar';
import { useHydrateContent } from '@/features/dashboard/hooks/use-content-list';
import { deriveStats } from '@/features/dashboard/stats';
import { useColumnStore } from '@/stores/column-store';
import { useContentStore } from '@/stores/content-store';
import { useImportStore } from '@/stores/import-store';

/** Dashboard (Figma 108:5749): rỗng → Greeting; có dữ liệu → stats + bảng. */
export function DashboardPage() {
  useHydrateContent(); // nạp dữ liệu đã lưu từ IndexedDB (1 lần)
  // Nạp cấu hình ẩn/hiện cột từ localStorage sau khi mount (tránh đọc trong initializer → lệch SSR).
  useEffect(() => {
    useColumnStore.getState().hydrate();
  }, []);
  const hydrated = useContentStore((s) => s.hydrated);
  const rows = useContentStore((s) => s.rows);
  const importing = useImportStore((s) => s.status === 'loading');
  const stats = useMemo(() => deriveStats(rows), [rows]);
  const hasData = rows.length > 0 || importing;

  // Chờ đọc xong IndexedDB rồi mới hiện UI (tránh nháy Greeting → bảng).
  if (!hydrated) {
    return (
      <main className="mx-auto flex w-full max-w-[1440px] flex-1 items-center justify-center px-6 py-24">
        <div className="flex flex-col items-center gap-3 text-text-muted">
          <span className="size-8 animate-spin rounded-full border-2 border-border border-t-ink" />
          <p className="text-sm">Đang tải dữ liệu...</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto flex min-h-0 w-full max-w-[1440px] flex-1 flex-col gap-6 px-6 py-6">
        {hasData ? (
          <>
            <StatsBar stats={stats} />
            <ContentSection />
          </>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <Greeting />
          </div>
        )}
      </main>

      {/* Chi tiết + mini player video (state dùng chung qua useDetailStore). */}
      <DetailDrawer />
      <FloatingVideo />
    </>
  );
}
