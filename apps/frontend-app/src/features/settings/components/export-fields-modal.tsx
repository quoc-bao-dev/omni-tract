'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Modal } from '@/components/ui/modal';
import { EXPORT_FIELDS, type ExportFieldKey } from '@/lib/export/fields';
import { type ExportFieldConfig, useExportFieldsStore } from '@/stores/export-fields-store';

interface ExportFieldsModalProps {
  open: boolean;
  onClose: () => void;
}

/** Modal cấu hình các trường (cột) sẽ có trong file export — gồm cả field backend không hiện trên UI. */
export function ExportFieldsModal({ open, onClose }: ExportFieldsModalProps) {
  const fields = useExportFieldsStore((s) => s.fields);
  const setFields = useExportFieldsStore((s) => s.setFields);
  const [draft, setDraft] = useState<ExportFieldConfig>(fields);

  // Đồng bộ draft mỗi lần mở.
  useEffect(() => {
    if (open) setDraft(fields);
  }, [open, fields]);

  const selectedCount = EXPORT_FIELDS.filter((f) => draft[f.key]).length;

  function toggle(key: ExportFieldKey) {
    setDraft((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function setAll(value: boolean) {
    setDraft(Object.fromEntries(EXPORT_FIELDS.map((f) => [f.key, value])) as ExportFieldConfig);
  }

  function handleSave() {
    setFields(draft);
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Export fields"
      footer={
        <>
          <Button
            variant="tertiary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={selectedCount === 0}
          >
            Save
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <p className="text-text-secondary text-xs">
            {selectedCount}/{EXPORT_FIELDS.length} trường được chọn
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAll(true)}
              className="font-semibold text-ink text-xs hover:underline"
            >
              Chọn tất cả
            </button>
            <button
              type="button"
              onClick={() => setAll(false)}
              className="font-semibold text-text-secondary text-xs hover:underline"
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto">
          {EXPORT_FIELDS.map((f) => (
            <li key={f.key}>
              <label
                htmlFor={`export-field-${f.key}`}
                className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-surface-alt"
              >
                <Checkbox
                  id={`export-field-${f.key}`}
                  checked={draft[f.key]}
                  onChange={() => toggle(f.key)}
                />
                <span className="flex-1 font-medium text-ink text-sm">{f.header}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  );
}
