/**
 * Logger tập trung — nơi DUY NHẤT được phép chạm `console`.
 *
 * - Chỉ log ở dev (`NODE_ENV !== 'production'`); production no-op → không rò log, không phình bundle log.
 * - Lint `suspicious/noConsole` bật ở toàn repo: dùng `logger.*` thay cho `console.*`.
 * - Trường hợp hi hữu cần `console` trực tiếp, ignore 1 dòng:
 *     // biome-ignore lint/suspicious/noConsole: <lý do>
 */
const isDev = process.env.NODE_ENV !== 'production';

type Level = 'debug' | 'info' | 'warn' | 'error';

function make(level: Level) {
  return (...args: unknown[]) => {
    if (!isDev) return;
    // biome-ignore lint/suspicious/noConsole: wrapper logger tập trung, chỉ chạy ở dev.
    console[level](...args);
  };
}

export const logger = {
  debug: make('debug'),
  info: make('info'),
  warn: make('warn'),
  error: make('error'),
};
