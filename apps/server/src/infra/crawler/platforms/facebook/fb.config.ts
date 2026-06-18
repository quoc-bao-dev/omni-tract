/**
 * Config tập trung cho FB crawler. doc_id/endpoint của FB có thể đổi theo thời gian
 * → cho phép override qua env mà không sửa code. Default = giá trị đang hoạt động.
 *
 * Dùng getter (đọc process.env lazy) để nhận giá trị từ .env do @nestjs/config nạp
 * lúc bootstrap — tránh đọc sớm ở thời điểm import module.
 */
export const fbConfig = {
  get graphqlUrl(): string {
    return process.env.FB_GRAPHQL_URL ?? 'https://www.facebook.com/api/graphql/';
  },
  docId: {
    /** URL post/profile → UUID (composer-preview). */
    get resolveUrl(): string {
      return process.env.FB_DOC_ID_RESOLVE ?? '36104137065899111';
    },
    /** storyID → meta post (permalink). */
    get post(): string {
      return process.env.FB_DOC_ID_POST ?? '8180153265427288';
    },
    /** videoID → story video + link (video_home). */
    get video(): string {
      return process.env.FB_DOC_ID_VIDEO ?? '26984026684624315';
    },
  },
} as const;
