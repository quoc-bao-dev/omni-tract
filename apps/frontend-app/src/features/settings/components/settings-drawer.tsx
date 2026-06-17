'use client';

import type { ExportFormat } from '@omni/sdk';
import { useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { GripVerticalIcon } from '@/components/ui/icon';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';

type ColumnKey =
  | 'url'
  | 'author'
  | 'caption'
  | 'format'
  | 'postedOn'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'views'
  | 'save'
  | 'play'
  | 'status';

interface ColumnSetting {
  key: ColumnKey;
  label: string;
  enabled: boolean;
}

export type { ExportFormat };

export interface SettingsValue {
  columns: ColumnSetting[];
  exportFormat: ExportFormat;
}

const DEFAULT_COLUMNS: ColumnSetting[] = [
  { key: 'url', label: 'URL', enabled: true },
  { key: 'author', label: 'Author/Page', enabled: true },
  { key: 'caption', label: 'Caption', enabled: true },
  { key: 'format', label: 'Format', enabled: true },
  { key: 'postedOn', label: 'Posted on', enabled: true },
  { key: 'likes', label: 'Likes', enabled: true },
  { key: 'comments', label: 'Comments', enabled: true },
  { key: 'shares', label: 'Shares', enabled: true },
  { key: 'views', label: 'Views', enabled: true },
  { key: 'save', label: 'Save', enabled: true },
  { key: 'play', label: 'Play', enabled: false },
  { key: 'status', label: 'Status', enabled: true },
];

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

/** Drawer Settings (Figma 85:2625): Columns (toggle) + Export file as (radio). */
export function SettingsDrawer({ open, onClose, onSave }: SettingsDrawerProps) {
  const [columns, setColumns] = useState<ColumnSetting[]>(DEFAULT_COLUMNS);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('xlsx');

  function toggleColumn(key: ColumnKey) {
    setColumns((prev) => prev.map((c) => (c.key === key ? { ...c, enabled: !c.enabled } : c)));
  }

  function handleSave() {
    onSave?.({ columns, exportFormat });
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
        {/* Columns */}
        <section className="rounded-xl border border-border-overlay bg-surface p-4">
          <h3 className="font-semibold text-ink text-md">Columns</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {columns.map((col) => (
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
                  checked={col.enabled}
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
