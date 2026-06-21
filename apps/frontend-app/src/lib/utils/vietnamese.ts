// Dấu kết hợp (combining diacritical marks) U+0300–U+036F.
const COMBINING = /[̀-ͯ]/g;

/**
 * "Fold" chuỗi cho tìm kiếm tiếng Việt: bỏ dấu thanh/mũ + hạ thường + đ→d.
 *   "Phương Mai" → "phuong mai", "Hồ Chí Minh" → "ho chi minh"
 *
 * GIỮ NGUYÊN ĐỘ DÀI (1 code-unit ↔ 1 code-unit) để map index khi highlight:
 * chuẩn hoá NFC trước (mỗi chữ Việt = 1 code point), rồi fold từng ký tự.
 */
export function foldVi(input: string): string {
  let out = '';
  for (const ch of input.normalize('NFC')) {
    if (ch === 'đ' || ch === 'Đ') {
      out += ch === 'đ' ? 'd' : 'D';
      continue;
    }
    // tách dấu kết hợp khỏi ký tự đơn → lấy chữ gốc; giữ ký tự nếu không tách được.
    const base = ch.normalize('NFD').replace(COMBINING, '');
    out += base.length > 0 ? base : ch;
  }
  return out.toLowerCase();
}
