import { Avatar } from '@/components/ui/avatar';
import {
  ChevronRightIcon,
  CommentIcon,
  LikeIcon,
  MoreHorizontalIcon,
  ShareIcon,
} from '@/components/ui/icon';

export interface PostPreviewData {
  author: string;
  community?: string;
  timestamp: string;
  title?: string;
  caption: string;
  thumbnailUrl?: string;
  links: string[];
  preview?: { domain: string; title: string };
}

/** Preview bài đăng (Figma 94:4141 "Post"). */
export function PostPreview({ data }: { data: PostPreviewData }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-overlay bg-surface">
      {/* Title row */}
      <div className="flex items-start gap-2 px-4 pt-3">
        <Avatar
          fallback={data.author.charAt(0)}
          size={32}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-center gap-1 text-sm">
            <span className="truncate font-semibold text-text-primary">{data.author}</span>
            {data.community ? (
              <>
                <ChevronRightIcon className="size-4 shrink-0 text-text-muted" />
                <span className="truncate font-semibold text-text-primary">{data.community}</span>
              </>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-text-muted text-xs">
            <span className="rounded-full bg-[#d9e5fc] px-1.5 py-0.5 font-medium text-link">
              Moderator
            </span>
            <span aria-hidden>•</span>
            <span>{data.timestamp}</span>
          </div>
        </div>
        <button
          type="button"
          aria-label="Thêm"
          className="grid size-6 place-items-center rounded-md text-text-primary hover:bg-surface-alt"
        >
          <MoreHorizontalIcon className="size-5" />
        </button>
      </div>

      {/* Text + links */}
      <div className="flex flex-col gap-3 px-4 py-2">
        {data.title ? <p className="font-medium text-md text-text-primary">{data.title}</p> : null}
        {/* Nội dung bài viết (caption đầy đủ) */}
        {data.caption ? (
          <p className="whitespace-pre-wrap text-sm text-text-primary">{data.caption}</p>
        ) : null}
        <div className="flex flex-col gap-0.5 text-sm">
          {data.links.map((href) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-link hover:underline"
            >
              {href}
            </a>
          ))}
        </div>

        {data.preview ? (
          <div className="overflow-hidden rounded-lg border border-border">
            {data.thumbnailUrl ? (
              // biome-ignore lint/performance/noImgElement: URL fbcdn có token ký/hết hạn, không hợp next/image.
              <img
                src={data.thumbnailUrl}
                alt=""
                className="h-40 w-full object-cover"
              />
            ) : (
              <div
                className="h-28 w-full bg-surface-alt"
                aria-hidden
              />
            )}
            <div className="flex flex-col gap-0.5 border-border border-t p-3">
              <p className="truncate text-text-secondary text-xs">{data.preview.domain}</p>
              {data.preview.title ? (
                <p className="truncate font-semibold text-sm text-text-primary">
                  {data.preview.title}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* Engagement bar */}
      <div className="mt-1 flex items-center gap-3 border-border border-t px-4 py-3 font-semibold text-sm text-text-muted">
        <span className="flex items-center gap-1">
          <LikeIcon className="size-5" /> Like
        </span>
        <span className="flex items-center gap-1">
          <CommentIcon className="size-5" /> Comment
        </span>
        <span className="ml-auto">
          <ShareIcon className="size-5" />
        </span>
      </div>
    </div>
  );
}
