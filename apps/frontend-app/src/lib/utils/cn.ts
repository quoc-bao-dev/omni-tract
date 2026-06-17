/** Gộp className có điều kiện (bỏ giá trị falsy). */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
