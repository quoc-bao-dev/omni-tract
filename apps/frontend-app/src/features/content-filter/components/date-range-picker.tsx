'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarIcon, ChevronRightIcon, CloseIcon } from '@/components/ui/icon';
import {
  type DateRange,
  formatRange,
  isSameDay,
  parseRange,
} from '@/features/content-filter/date-range';
import { cn } from '@/lib/utils/cn';

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/** 42 ô (6 tuần) bắt đầu từ thứ Hai của tuần chứa ngày 1. */
function buildGrid(view: Date): Date[] {
  const first = startOfMonth(view);
  const offset = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
  const base = new Date(first.getFullYear(), first.getMonth(), 1 - offset);
  return Array.from(
    { length: 42 },
    (_, i) => new Date(base.getFullYear(), base.getMonth(), base.getDate() + i),
  );
}

function inRange(day: Date, { start, end }: DateRange): boolean {
  if (!start || !end) return false;
  const t = day.getTime();
  return t >= start.getTime() && t <= end.getTime();
}

interface DateRangePickerProps {
  value: string;
  onChange: (value: string) => void;
}

/** Date range picker (Posted on) — panel lịch mở trong luồng, chọn 2 lần (start → end). */
export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const range = useMemo(() => parseRange(value), [value]);
  const { start, end } = range;

  // Click ra ngoài picker → đóng lịch.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Tháng đang hiển thị. Khởi tạo lười → không đụng new Date() lúc SSR (panel chỉ render khi mở).
  const [view, setView] = useState<Date>(() => startOfMonth(start ?? new Date()));

  // Phụ thuộc theo TIMESTAMP (số) thay vì object Date — tránh effect chạy lại mỗi lần
  // value đổi (vd chọn end ở tháng khác) làm lịch nhảy ngược về tháng start.
  const startTime = start ? start.getTime() : null;
  // Mở lịch / đổi start → nhảy về tháng của start (hoặc hôm nay).
  useEffect(() => {
    if (open) setView(startOfMonth(startTime !== null ? new Date(startTime) : new Date()));
  }, [open, startTime]);

  const grid = useMemo(() => buildGrid(view), [view]);
  const today = useMemo(() => new Date(), []);

  function pick(day: Date) {
    // Chưa có start, hoặc đã đủ start+end → bắt đầu range mới.
    if (!start || end) {
      onChange(formatRange(day, null));
      return;
    }
    // Đã có start, đang chờ end → hoàn tất (tự đảo nếu chọn ngày trước start).
    const [a, b] = day.getTime() < start.getTime() ? [day, start] : [start, day];
    onChange(formatRange(a, b));
  }

  return (
    <div
      ref={rootRef}
      className="relative"
    >
      {/* Ô hiển thị — bấm để mở/đóng lịch. */}
      <div className="flex h-10 w-full items-center gap-2 rounded-md bg-input px-3 shadow-input">
        <button
          type="button"
          aria-label="Chọn khoảng ngày"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center text-left"
        >
          <span
            className={cn(
              'flex-1 truncate font-medium text-sm',
              value ? 'text-ink' : 'text-placeholder',
            )}
          >
            {value || 'dd/mm/yyyy - dd/mm/yyyy'}
          </span>
        </button>
        {value ? (
          <button
            type="button"
            aria-label="Xoá ngày"
            onClick={() => onChange('')}
            className="grid size-5 shrink-0 place-items-center rounded text-text-muted hover:text-ink"
          >
            <CloseIcon className="size-4" />
          </button>
        ) : (
          <CalendarIcon className="size-5 shrink-0 text-text-secondary" />
        )}
      </div>

      {open ? (
        <div className="absolute top-full right-0 left-0 z-50 mt-1 rounded-md border border-border bg-surface p-3 shadow-menu">
          {/* Điều hướng tháng */}
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              aria-label="Tháng trước"
              onClick={() => setView((v) => addMonths(v, -1))}
              className="grid size-7 place-items-center rounded-md text-text-secondary hover:bg-surface-alt hover:text-ink"
            >
              <ChevronRightIcon className="size-4 rotate-180" />
            </button>
            <span className="font-semibold text-ink text-sm">
              {MONTHS[view.getMonth()]} {view.getFullYear()}
            </span>
            <button
              type="button"
              aria-label="Tháng sau"
              onClick={() => setView((v) => addMonths(v, 1))}
              className="grid size-7 place-items-center rounded-md text-text-secondary hover:bg-surface-alt hover:text-ink"
            >
              <ChevronRightIcon className="size-4" />
            </button>
          </div>

          {/* Thứ trong tuần */}
          <div className="grid grid-cols-7 text-center font-medium text-[11px] text-text-muted">
            {WEEKDAYS.map((w) => (
              <span
                key={w}
                className="py-1"
              >
                {w}
              </span>
            ))}
          </div>

          {/* Lưới ngày */}
          <div className="grid grid-cols-7">
            {grid.map((day) => {
              const inMonth = day.getMonth() === view.getMonth();
              const isStart = start ? isSameDay(day, start) : false;
              const isEnd = end ? isSameDay(day, end) : false;
              const isEdge = isStart || isEnd;
              const between = inRange(day, range) && !isEdge;
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pick(day)}
                  className={cn(
                    'flex h-9 items-center justify-center text-sm transition-colors',
                    inMonth ? 'text-ink' : 'text-text-muted',
                    between && 'bg-surface-alt',
                    // bo góc 2 đầu mút của dải
                    isStart && 'rounded-l-md',
                    isEnd && 'rounded-r-md',
                    isEdge
                      ? 'rounded-md bg-ink font-semibold text-on-ink'
                      : 'hover:bg-surface-alt hover:text-ink',
                    isToday && !isEdge && 'font-semibold text-link',
                  )}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Hành động: xoá lựa chọn / đóng lịch. */}
          <div className="mt-2 flex items-center justify-end gap-2 border-border-overlay border-t pt-2">
            <button
              type="button"
              onClick={() => onChange('')}
              className="h-8 rounded-md px-3 font-semibold text-text-secondary text-xs hover:bg-surface-alt hover:text-ink"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-8 rounded-md bg-ink px-4 font-semibold text-on-ink text-xs shadow-action hover:opacity-90"
            >
              Apply
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
