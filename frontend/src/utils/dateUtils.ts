/**
 * Tiện ích chuẩn hóa và hiển thị ngày tháng theo định dạng DD-MM-YYYY
 */

/**
 * Chuẩn hóa mọi chuỗi ngày tháng (ISO, YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
 * về định dạng chuẩn duy nhất: DD-MM-YYYY
 */
export function formatToDDMMYYYY(val?: string | number | null): string {
  if (!val) return '';
  
  if (typeof val === 'number') {
    // Xử lý Excel serial date nếu có
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return String(val).trim();
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  let str = String(val).trim();
  if (!str) return '';

  // Bỏ ký tự thừa như nháy đơn hoặc khoảng trắng
  str = str.replace(/^['"`\s]+/, '').replace(/['"`\s]+$/, '');

  // 1. YYYY-MM-DD (hoặc YYYY/MM/DD, YYYY.MM.DD)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const yyyy = ymdMatch[1];
    const mm = ymdMatch[2].padStart(2, '0');
    const dd = ymdMatch[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  // 2. DD-MM-YYYY hoặc DD/MM/YYYY hoặc DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const yyyy = dmyMatch[3];

    let dd: string, mm: string;
    if (p1 <= 12 && p2 > 12) {
      // Trường hợp MM/DD/YYYY (VD: 01/27/2012)
      mm = String(p1).padStart(2, '0');
      dd = String(p2).padStart(2, '0');
    } else {
      dd = String(p1).padStart(2, '0');
      mm = String(p2).padStart(2, '0');
    }
    return `${dd}-${mm}-${yyyy}`;
  }

  // 3. Chỉ có năm: YYYY
  if (/^\d{4}$/.test(str)) {
    return `01-01-${str}`;
  }

  return str;
}

/**
 * Tự động định dạng khi người dùng nhập ngày tháng vào ô input
 * Cho phép người dùng gõ dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy hoặc ddmmyyyy và tự chuẩn hóa về dd-mm-yyyy
 */
export function normalizeDateInput(input: string): string {
  if (!input) return '';
  const clean = input.trim();
  return formatToDDMMYYYY(clean);
}

/**
 * Kiểm tra chuỗi có phải ngày hợp lệ định dạng DD-MM-YYYY không
 */
export function isValidDDMMYYYY(str: string): boolean {
  if (!str) return false;
  const match = str.match(/^(\d{2})-(\d{2})-(\d{4})$/);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  return true;
}
