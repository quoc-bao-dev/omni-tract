/**
 * Dump 3 bước GraphQL FB cho 1 URL → 3 file response + 1 file path các field view/count.
 *
 * Dùng:
 *   FB_GRAPHQL qua proxy đã cấu hình trong .env (KIOTPROXY_KEY / FB_PROXY_URL).
 *   node --env-file=.env -r ts-node/register/transpile-only scripts/dump-fb.ts "<url>" [outDir]
 *   # hoặc: pnpm dump:fb "<url>"
 *
 * Sinh ra trong <outDir> (mặc định debug/fb-<timestamp>/):
 *   1-resolve.json        — response bước 1 (composer-preview: URL → actor/post id)
 *   2-permalink.json      — response bước 2 (permalink: meta + engagement + video_view_count)
 *   3-video.json          — response bước 3 (video_home) — chỉ khi là post video
 *   view-count-paths.json — path mọi field tên ~ view/play/count (kèm step + value)
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fbConfig } from '../src/infra/crawler/platforms/facebook/fb.config';
import { postVariables } from '../src/infra/crawler/platforms/facebook/fetch-post';
import {
  fbGraphqlRaw,
  parseFbJsonChunks,
} from '../src/infra/crawler/platforms/facebook/graphql-client';
import { extractVideoTargetId } from '../src/infra/crawler/platforms/facebook/parse-post';
import {
  encodeStoryId,
  resolveStoryRef,
  resolveVariables,
} from '../src/infra/crawler/platforms/facebook/story-id';
import { extractVideoCounts, videoVariables } from '../src/infra/crawler/platforms/facebook/video';

interface FieldPath {
  step: 1 | 2 | 3;
  path: string;
  key: string;
  value: string | number | boolean | null;
}

// Field engagement/lượt xem cần tìm.
const INCLUDE_RE = /(view|play|viewer|watch|impression|reach|count)/i;
// Loại nhiễu player/streaming config (không phải metric).
const EXCLUDE_KEY_RE =
  /(oz_www|playback|shaka|scrubber|buffer|latency|segment|sampling|throttle|viewability|autoplay|polling|funnel|prefetch|bitrate)/i;

function isExcluded(path: string, key: string): boolean {
  return (
    path.includes('extensions.sr_payload') || path.includes('jsmods') || EXCLUDE_KEY_RE.test(key)
  );
}

/** Quét cây, gom field tên ~ view/play/count có value nguyên thuỷ (gồm cả null → thấy field bị FB ẩn). */
function scanFields(root: unknown, step: 1 | 2 | 3): FieldPath[] {
  const out: FieldPath[] = [];
  (function walk(node: unknown, path: string) {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach((v, i) => {
        walk(v, `${path}[${i}]`);
      });
      return;
    }
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      const p = path ? `${path}.${key}` : key;
      const primitive = value === null || typeof value !== 'object';
      if (primitive && INCLUDE_RE.test(key) && !isExcluded(p, key)) {
        out.push({ step, path: p, key, value: value as FieldPath['value'] });
      }
      walk(value, p);
    }
  })(root, '');
  return out;
}

async function dump(dir: string, name: string, data: unknown): Promise<void> {
  await writeFile(join(dir, name), JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Gọi 1 bước → ghi NGUYÊN response (raw, mọi chunk) + bản parse tất cả chunk, rồi scan field.
 *   <name>.raw.txt — văn bản thô y nguyên FB trả (kể cả nhiều dòng @stream)
 *   <name>.json    — mảng tất cả chunk đã parse (hoặc 1 object nếu chỉ có 1)
 * Trả về mảng chunk để bước sau trích id.
 */
async function fetchStep(
  outDir: string,
  step: 1 | 2 | 3,
  name: string,
  docId: string,
  variables: unknown,
  fields: FieldPath[],
): Promise<unknown[]> {
  const raw = await fbGraphqlRaw({ docId, variables });
  await writeFile(join(outDir, `${name}.raw.txt`), raw, 'utf8');
  const chunks = parseFbJsonChunks(raw);
  await dump(outDir, `${name}.json`, chunks.length === 1 ? chunks[0] : chunks);
  for (const c of chunks) fields.push(...scanFields(c, step));
  return chunks;
}

/** In ra stdout (dùng process.stdout thay console → không bị rule noConsole đụng tới). */
function out(msg: string): void {
  process.stdout.write(`${msg}\n`);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    out('Thiếu URL. Vd: pnpm dump:fb "https://www.facebook.com/share/v/XXXX/"');
    process.exit(1);
  }
  const outDir = process.argv[3] ?? join('debug', `fb-${Date.now()}`);
  await mkdir(outDir, { recursive: true });

  const fields: FieldPath[] = [];
  await fetchStep(outDir, 1, '1-resolve', fbConfig.docId.resolveUrl, resolveVariables(url), fields);

  // storyID (qua logic chuẩn của crawler)
  const ref = await resolveStoryRef(url);
  const storyID = encodeStoryId(ref);
  const step2 = await fetchStep(
    outDir,
    2,
    '2-permalink',
    fbConfig.docId.post,
    postVariables(storyID),
    fields,
  );

  // Bước 3: video_home (chỉ khi là post video) — response thường gồm NHIỀU chunk @stream
  const videoId = extractVideoTargetId(step2[0]);
  let counts: { views: number | null; plays: number | null } = { views: null, plays: null };
  if (videoId) {
    const step3 = await fetchStep(
      outDir,
      3,
      '3-video',
      fbConfig.docId.video,
      videoVariables(videoId),
      fields,
    );

    // Chunk @defer chứa info video chính (CometVideoHomeHeroUnitLeftBottomSection_video).
    const hero = step3.find(
      (c): c is { label: string } =>
        !!c &&
        typeof (c as { label?: unknown }).label === 'string' &&
        (c as { label: string }).label.includes('LeftBottomSection_video'),
    );
    if (hero) await dump(outDir, '3-video-hero.json', hero);

    // Map view/play: data.feedback.video_view_count_renderer.feedback.{video_view_count, play_count}
    counts = extractVideoCounts(step3);
  }

  // File path các field view/count
  const viewPlayFields = fields.filter((f) =>
    /(view|play|viewer|watch|impression|reach)/i.test(f.key),
  );
  const otherCountFields = fields.filter((f) => !viewPlayFields.includes(f));
  // Các field metric "thật" (lượt xem/lượt phát/tương tác) — lọc khỏi nhiễu can_viewer_*…
  const HIGHLIGHT_RE =
    /^(video_view_count(_renderer)?|view_count|play_count|video_play_count|post_view_count|reaction_count|share_count|total_count|loop_count|liveViewerCount|i18n_\w*count)$/;
  const highlights = fields.filter((f) => HIGHLIGHT_RE.test(f.key));
  const summary = {
    url,
    storyID,
    videoId: videoId ?? null,
    /** view/play map từ $.data.feedback.video_view_count_renderer.feedback.{video_view_count,play_count} */
    videoViewCount: counts.views,
    videoPlayCount: counts.plays,
    files: {
      step1: '1-resolve.json',
      step2: '2-permalink.json',
      step3: videoId ? '3-video.json' : null,
      videoHero: videoId ? '3-video-hero.json' : null,
    },
    /** Field metric đáng chú ý (view/play/engagement count). */
    highlights,
    viewPlayFields,
    otherCountFields,
  };
  await dump(outDir, 'view-count-paths.json', summary);

  out(`URL : ${url} → ${outDir}`);
  out(`videoViewCount = ${counts.views} · videoPlayCount = ${counts.plays}`);
  out('=== highlights (view/play/engagement count) ===');
  if (highlights.length === 0) out('(không tìm thấy field metric nào)');
  for (const f of highlights) out(`  [b${f.step}] ${f.key} = ${JSON.stringify(f.value)}`);
  out(`Chi tiết → ${join(outDir, 'view-count-paths.json')}`);
}

main().catch((e) => {
  process.stderr.write(`ERROR: ${(e as Error).message}\n`);
  process.exit(1);
});
