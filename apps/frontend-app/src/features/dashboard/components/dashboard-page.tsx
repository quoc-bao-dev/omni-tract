import { ContentSection } from '@/features/dashboard/components/content-section';
import { StatsBar } from '@/features/dashboard/components/stats-bar';
import { MOCK_ROWS, MOCK_STATS } from '@/features/dashboard/fixtures';

/** Dashboard (Figma 108:5749): stats + bảng nội dung (kèm thanh filter khi có). */
export function DashboardPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] space-y-6 px-6 py-6">
      <StatsBar stats={MOCK_STATS} />
      <ContentSection rows={MOCK_ROWS} />
    </main>
  );
}
