'use client';

import { AlertTriangleIcon, PauseIcon, RefreshIcon, StopIcon } from '@/components/ui/icon';
import { useImportStore } from '@/stores/import-store';

/** Thanh loading thay filter bar khi đang crawl (Figma 123:24242). */
export function ProcessingBar() {
  const total = useImportStore((s) => s.total);
  const progress = useImportStore((s) => s.progress);
  const hasErrors = useImportStore((s) => s.hasErrors);
  const stop = useImportStore((s) => s.stop);
  const pct = Math.round(progress);

  return (
    <div className="flex items-center gap-6 rounded-xl border border-border bg-surface px-4 py-3">
      {hasErrors ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[rgba(255,158,1,0.18)] px-1.5 py-0.5 font-medium text-[#45371b] text-xs">
          <AlertTriangleIcon className="size-3" />
          Partial errors
        </span>
      ) : null}

      <p className="shrink-0 font-medium text-sm text-text-neutral">
        Analyzing {total} URLs... <span className="text-text-muted">• đang xử lý</span>
      </p>

      <div className="flex flex-1 items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[rgba(1,1,1,0.06)]">
          <div
            className="h-full rounded-full bg-ink transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="shrink-0 text-ink text-sm">{pct}%</span>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <BarButton
          icon={<PauseIcon className="size-5" />}
          label="Pause"
          disabled
        />
        <BarButton
          icon={<StopIcon className="size-5" />}
          label="Stop"
          onClick={stop}
        />
        <BarButton
          icon={<RefreshIcon className="size-5" />}
          label="Re-run failed"
          disabled
        />
      </div>
    </div>
  );
}

function BarButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-0.5 rounded-md border border-border-subtle bg-surface px-3 font-semibold text-ink text-sm shadow-action hover:bg-surface-alt disabled:opacity-40"
    >
      <span className="flex size-5 items-center justify-center">{icon}</span>
      <span className="px-1">{label}</span>
    </button>
  );
}
