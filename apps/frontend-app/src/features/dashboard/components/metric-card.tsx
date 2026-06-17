/** Metric item (Figma 134:35882): card trắng, border, shadow-xs, rounded-12, p-12. */
export function MetricCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-border bg-surface p-3 shadow-xs">
      <p className="font-medium text-sm text-text-secondary">{label}</p>
      <p className="font-semibold text-h3 text-text-primary">{value}</p>
    </div>
  );
}
