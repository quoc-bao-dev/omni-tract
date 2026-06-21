'use client';

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ExportFormat } from '@omni/sdk';
import { useEffect, useState } from 'react';
import { Drawer } from '@/components/ui/drawer';
import { GripVerticalIcon } from '@/components/ui/icon';
import { RadioGroup } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { ExportFieldsModal } from '@/features/settings/components/export-fields-modal';
import { cn } from '@/lib/utils/cn';
import {
  COLUMN_LABEL,
  type ColumnKey,
  type ColumnVisibility,
  FROZEN_COLUMNS,
  useColumnStore,
} from '@/stores/column-store';
import { useExportStore } from '@/stores/export-store';
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

/** Drawer Settings (Figma 85:2625): Columns (toggle ẩn/hiện + kéo đổi thứ tự) + Export file as. */
export function SettingsDrawer({ open, onClose, onSave }: SettingsDrawerProps) {
  const visible = useColumnStore((s) => s.visible);
  const setVisible = useColumnStore((s) => s.setVisible);
  const storeOrder = useColumnStore((s) => s.order);
  const setStoreOrder = useColumnStore((s) => s.setOrder);
  const storeFormat = useExportStore((s) => s.format);
  const setStoreFormat = useExportStore((s) => s.setFormat);

  // Draft cục bộ — chỉ áp dụng khi bấm Save. Đồng bộ lại từ store mỗi lần mở.
  const [draft, setDraft] = useState<ColumnVisibility>(visible);
  const [colOrder, setColOrder] = useState<ColumnKey[]>(storeOrder);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(storeFormat);
  const [fieldsModalOpen, setFieldsModalOpen] = useState(false);
  useEffect(() => {
    if (open) {
      setDraft(visible);
      setColOrder(storeOrder);
      setExportFormat(storeFormat);
    }
  }, [open, visible, storeOrder, storeFormat]);

  const sensors = useSensors(
    // distance 6px → click vào Switch không vô tình bắt đầu kéo.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setColOrder((prev) => {
      const from = prev.indexOf(active.id as ColumnKey);
      const to = prev.indexOf(over.id as ColumnKey);
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  }

  function handleSave() {
    setVisible(draft);
    setStoreOrder(colOrder);
    setStoreFormat(exportFormat);
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
        {/* Columns — bật/tắt hiển thị + kéo đổi thứ tự (cột đóng băng giữ cố định ở trên) */}
        <section className="rounded-xl border border-border-overlay bg-surface p-4">
          <h3 className="font-semibold text-ink text-md">Columns</h3>
          <ul className="mt-4 flex flex-col gap-2">
            {/* Cột đóng băng trái (URL, Author) — KHÔNG kéo được */}
            {FROZEN_COLUMNS.map((key) => (
              <li
                key={key}
                className="flex items-center gap-3 rounded-xl border border-border-overlay bg-surface-alt p-3"
              >
                <GripVerticalIcon
                  className="size-6 shrink-0 text-text-muted opacity-30"
                  aria-hidden
                />
                <span className="flex-1 font-medium text-ink text-md">{COLUMN_LABEL[key]}</span>
                <Switch
                  aria-label={`Cột ${COLUMN_LABEL[key]}`}
                  checked={draft[key]}
                  onChange={() => toggleColumn(key)}
                />
              </li>
            ))}

            {/* Cột kéo đổi thứ tự */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={colOrder}
                strategy={verticalListSortingStrategy}
              >
                {colOrder.map((key) => (
                  <SortableColumnRow
                    key={key}
                    id={key}
                    label={COLUMN_LABEL[key]}
                    checked={draft[key]}
                    onToggle={() => toggleColumn(key)}
                  />
                ))}
              </SortableContext>
            </DndContext>
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
          <button
            type="button"
            onClick={() => setFieldsModalOpen(true)}
            className="mt-4 h-10 w-full rounded-md border border-border-subtle bg-surface px-3 font-semibold text-ink text-sm shadow-action hover:bg-surface-alt"
          >
            Configure export fields
          </button>
        </section>
      </div>

      <ExportFieldsModal
        open={fieldsModalOpen}
        onClose={() => setFieldsModalOpen(false)}
      />
    </Drawer>
  );
}

/** 1 dòng cột kéo-thả được (sortable) trong Settings. */
function SortableColumnRow({
  id,
  label,
  checked,
  onToggle,
}: {
  id: ColumnKey;
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border-overlay bg-surface-alt p-3',
        isDragging && 'relative z-10 opacity-90 shadow-menu',
      )}
    >
      <button
        type="button"
        aria-label={`Kéo để sắp xếp ${label}`}
        className="shrink-0 cursor-grab touch-none text-text-muted active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVerticalIcon
          className="size-6"
          aria-hidden
        />
      </button>
      <span className="flex-1 font-medium text-ink text-md">{label}</span>
      <Switch
        aria-label={`Cột ${label}`}
        checked={checked}
        onChange={onToggle}
      />
    </li>
  );
}
