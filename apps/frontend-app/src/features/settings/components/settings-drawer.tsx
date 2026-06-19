'use client';

import type { ExportFormat } from '@omni/sdk';
import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { GripVerticalIcon } from '@/components/ui/icon';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import {
  COLUMN_META,
  type ColumnKey,
  type ColumnVisibility,
  useColumnStore,
} from '@/stores/column-store';
import { useToastStore } from '@/stores/toast-store';

export type { ExportFormat };

export interface SettingsValue {
  columns: ColumnVisibility;
  exportFormat: ExportFormat;
}

/** Số cột tối thiểu phải hiển thị (không cho ẩn hết). */
const MIN_VISIBLE_COLUMNS = 4;

const EXPORT_OPTIONS: { value: ExportFormat; label: string }[] = [
  { value: 'xlsx', label: '.xlsx' },
  { value: 'csv', label: '.csv' },
  { value: 'pdf', label: '.pdf' },
];

interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  onSave?: (value: SettingsValue) => void;
}

/** Drawer Settings (Figma 85:2625): Columns (toggle ẩn/hiện) + Export file as (radio). */
export function SettingsDrawer({ open, onClose, onSave }: SettingsDrawerProps) {
  const visible = useColumnStore((s) => s.visible);
  const setVisible = useColumnStore((s) => s.setVisible);

  // Draft cục bộ — chỉ áp dụng khi bấm Save. Đồng bộ lại từ store mỗi lần mở.
  const [draft, setDraft] = useState<ColumnVisibility>(visible);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');
  useEffect(() => {
    if (open) setDraft(visible);
  }, [open, visible]);

  function toggleColumn(key: ColumnKey) {
    // Chặn ẩn quá nhiều: phải còn ít nhất MIN_VISIBLE_COLUMNS cột.
    if (draft[key]) {
      const remaining = Object.values(draft).filter(Boolean).length - 1;
      if (remaining < MIN_VISIBLE_COLUMNS) {
        useToastStore
          .getState()
          .show(
            { tone: 'error', message: `Phải hiển thị ít nhất ${MIN_VISIBLE_COLUMNS} cột` },
            3000,
          );
        return;
      }
    }
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handleSave() {
    setVisible(draft);
    onSave?.({ columns: draft, exportFormat });
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Settings"
      width={400}
      header={<h2 className="font-semibold text-ink text-xl tracking-tight">Settings</h2>}
      footer={
        <button
          type="button"
          onClick={handleSave}
          className="flex h-10 w-full items-center justify-center rounded-md bg-ink px-3 font-semibold text-on-ink text-sm shadow-action transition-opacity hover:opacity-90"
        >
          Save
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Columns — bật/tắt hiển thị cột trên bảng */}
        <section className="rounded-xl border border-border-overlay bg-surface p-4">
          <h3 className="font-semibold text-ink text-md">Columns</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {COLUMN_META.map((col) => (
              <li
                key={col.key}
                className="flex items-center gap-3 rounded-xl border border-border-overlay bg-surface-alt p-3"
              >
                <GripVerticalIcon
                  className="size-6 shrink-0 cursor-grab text-text-muted"
                  aria-hidden
                />
                <span className="flex-1 font-medium text-ink text-md">{col.label}</span>
                <Switch
                  aria-label={`Cột ${col.label}`}
                  checked={draft[col.key]}
                  onChange={() => toggleColumn(col.key)}
                />
              </li>
            ))}
          </ul>
        </section>

        {/* Export file as */}
        <section className="rounded-xl border border-border-overlay bg-surface p-4">
          <h3 className="font-semibold text-ink text-md">Export file as</h3>
          <RadioGroup
            name="export-format"
            className="mt-4"
            value={exportFormat}
            options={EXPORT_OPTIONS}
            onChange={setExportFormat}
          />
        </section>
      </div>
    </Drawer>
  );
}
