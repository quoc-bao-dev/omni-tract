/** Tiện ích duyệt cây JSON sâu của FB GraphQL (shape lồng sâu, field hay đổi tên). */

type Obj = Record<string, unknown>;

/** Duyệt mọi object (bỏ qua array container) trong cây, DFS. */
export function* walkObjects(node: unknown): Generator<Obj> {
  if (node === null || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) yield* walkObjects(item);
    return;
  }
  const obj = node as Obj;
  yield obj;
  for (const value of Object.values(obj)) yield* walkObjects(value);
}

/** Object đầu tiên thoả predicate. */
export function findObject(root: unknown, pred: (o: Obj) => boolean): Obj | undefined {
  for (const o of walkObjects(root)) {
    if (pred(o)) return o;
  }
  return undefined;
}

/** Đọc `count` từ field dạng `{ count: number }` (hoặc number trực tiếp). null nếu không có. */
export function countField(obj: Obj | undefined, key: string): number | null {
  const v = obj?.[key];
  if (v && typeof v === 'object' && typeof (v as Obj).count === 'number') {
    return (v as Obj).count as number;
  }
  return typeof v === 'number' ? v : null;
}

/** Giá trị number đầu tiên ứng với `key` ở bất kỳ độ sâu nào. */
export function firstNumber(root: unknown, key: string): number | undefined {
  const o = findObject(root, (x) => typeof x[key] === 'number');
  return o ? (o[key] as number) : undefined;
}
