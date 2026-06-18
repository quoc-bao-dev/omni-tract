import type { Metrics, PostType } from '@omni/sdk';
import { countField, findObject, firstNumber, walkObjects } from './fb-json';

export interface ParsedPost {
  type: PostType;
  postedAt?: string;
  title?: string;
  /** Nội dung text bài viết (caption/body đầy đủ). */
  text?: string;
  /** Ảnh trong bài (URL CDN). */
  images: string[];
  metrics: Metrics;
}

/**
 * Trích metric/type/postedAt từ JSON permalink FB (doc_id 8180153265427288).
 * Field path đã xác nhận từ response thật (comet_ufi_summary_and_actions_renderer.feedback):
 *   reaction_count.count · share_count.count · comment_rendering_instance.comments.total_count · video_view_count
 */
export function parsePost(data: unknown): ParsedPost {
  const node = (data as { data?: { node?: unknown } })?.data?.node;
  if (node == null) {
    throw new Error('FB post: data.node null — post riêng tư/đã xoá hoặc cần đổi IP (proxy).');
  }

  const feedback = findFeedback(data);
  const views = countField(feedback, 'video_view_count');

  const metrics: Metrics = {
    likes: countField(feedback, 'reaction_count'),
    comments: commentCount(feedback),
    shares: countField(feedback, 'share_count'),
    // FB KHÔNG trả public view/play count khi không đăng nhập (field có nhưng null).
    views,
    saves: null, // FB không expose save count công khai
    plays: countField(feedback, 'play_count'),
  };

  const created = firstNumber(data, 'creation_time');

  return {
    type: views !== null ? 'video' : 'text',
    postedAt: created ? new Date(created * 1000).toISOString() : undefined,
    title: extractTitle(data),
    text: longestText(data),
    images: collectImages(data),
    metrics,
  };
}

/** feedback của summary renderer mang đủ reaction_count + share_count. */
function findFeedback(data: unknown): Record<string, unknown> | undefined {
  return (
    findObject(data, (o) => 'reaction_count' in o && 'share_count' in o) ??
    findObject(data, (o) => 'reaction_count' in o) ??
    findObject(data, (o) => 'comment_rendering_instance' in o)
  );
}

function commentCount(feedback?: Record<string, unknown>): number | null {
  const cri = feedback?.comment_rendering_instance as
    | { comments?: { total_count?: unknown } }
    | undefined;
  const total = cri?.comments?.total_count;
  return typeof total === 'number' ? total : null;
}

/** Nội dung bài viết = chuỗi `text` dài nhất trong cây (chính là body/caption). */
function longestText(data: unknown): string | undefined {
  let best: string | undefined;
  for (const o of walkObjects(data)) {
    const t = o.text;
    if (typeof t === 'string' && t.length > (best?.length ?? 0)) best = t;
  }
  return best;
}

/** Tiêu đề ngắn (vd title card link) nếu có — khác với `text` (nội dung đầy đủ). */
function extractTitle(data: unknown): string | undefined {
  const o = findObject(data, (x) => {
    const t = x.title_with_entities as { text?: unknown } | undefined;
    return typeof t?.text === 'string' && t.text.length > 0;
  });
  return (o?.title_with_entities as { text?: string } | undefined)?.text;
}

/** Ảnh trong bài: gom `image.uri` trên CDN scontent (loại trừ avatar/emoji). */
function collectImages(data: unknown): string[] {
  const urls = new Set<string>();
  (function walk(n: unknown) {
    if (!n || typeof n !== 'object') return;
    if (Array.isArray(n)) {
      for (const x of n) walk(x);
      return;
    }
    for (const [k, v] of Object.entries(n as Record<string, unknown>)) {
      if (k === 'image' && v && typeof v === 'object') {
        const uri = (v as { uri?: unknown }).uri;
        if (typeof uri === 'string' && /scontent/.test(uri)) urls.add(uri);
      }
      walk(v);
    }
  })(data);
  return [...urls];
}
