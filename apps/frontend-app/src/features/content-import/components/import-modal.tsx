'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { parseUrlLines } from '@/lib/url/parse';

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  /** Gọi khi bấm Import với danh sách URL đã trim + dedup. */
  onImport?: (urls: string[]) => void;
}

const PLACEHOLDER = 'https://www.facebook.com/...\ntiktok.com/@user/video/...';

/** Modal Import URLs (Figma 108:4796). */
export function ImportModal({ open, onClose, onImport }: ImportModalProps) {
  const [text, setText] = useState('');
  const urls = useMemo(() => parseUrlLines(text), [text]);
  const count = urls.length;

  function handleImport() {
    if (count === 0) return;
    onImport?.(urls);
    setText('');
    onClose();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import URLs"
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
            onClick={handleImport}
            disabled={count === 0}
          >
            Import
          </Button>
        </>
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex items-center gap-1">
          <label
            htmlFor="import-urls"
            className="flex-1 text-ink text-xs"
          >
            URL list
          </label>
          {count > 0 ? (
            <span className="font-semibold text-ink text-xs">
              {count} {count === 1 ? 'URL' : 'URLs'}
            </span>
          ) : null}
        </div>

        <textarea
          id="import-urls"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={PLACEHOLDER}
          spellCheck={false}
          className="flex-1 resize-none rounded-xl bg-input px-4 py-3 font-medium text-ink text-sm shadow-input placeholder:text-text-muted focus-visible:outline-2 focus-visible:outline-ink focus-visible:-outline-offset-2"
        />
      </div>
    </Modal>
  );
}
