/**
 * Tiện ích chuẩn hóa và hiển thị ngày tháng theo định dạng DD/MM/YYYY
 */

export interface DateParts {
  day: number;
  month: number;
  year: number;
}

/**
 * Phân tích chuỗi ngày bất kỳ (ISO, YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
 * thành { day, month, year }
 */
export function parseDateParts(val?: string | number | Date | null): DateParts | null {
  if (!val) return null;

  if (val instanceof Date) {
    if (isNaN(val.getTime())) return null;
    return {
      day: val.getDate(),
      month: val.getMonth() + 1,
      year: val.getFullYear(),
    };
  }

  if (typeof val === 'number') {
    // Xử lý Excel serial date nếu có
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return null;
    return {
      day: date.getUTCDate(),
      month: date.getUTCMonth() + 1,
      year: date.getUTCFullYear(),
    };
  }

  let str = String(val).trim();
  if (!str) return null;

  // Bỏ ký tự thừa như nháy đơn hoặc khoảng trắng
  str = str.replace(/^['"`\s]+/, '').replace(/['"`\s]+$/, '');

  // 1. YYYY-MM-DD (hoặc YYYY/MM/DD, YYYY.MM.DD)
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    const year = parseInt(ymdMatch[1], 10);
    const month = parseInt(ymdMatch[2], 10);
    const day = parseInt(ymdMatch[3], 10);
    return { day, month, year };
  }

  // 2. DD-MM-YYYY hoặc DD/MM/YYYY hoặc DD.MM.YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    let p1 = parseInt(dmyMatch[1], 10);
    let p2 = parseInt(dmyMatch[2], 10);
    const year = parseInt(dmyMatch[3], 10);

    let day: number, month: number;
    if (p1 <= 12 && p2 > 12) {
      // Trường hợp MM/DD/YYYY (VD: 01/27/2012)
      month = p1;
      day = p2;
    } else {
      day = p1;
      month = p2;
    }
    return { day, month, year };
  }

  // 3. ddmmyyyy (8 số liền nhau)
  const digitsMatch = str.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (digitsMatch) {
    return {
      day: parseInt(digitsMatch[1], 10),
      month: parseInt(digitsMatch[2], 10),
      year: parseInt(digitsMatch[3], 10),
    };
  }

  // 4. Chỉ có năm: YYYY
  if (/^\d{4}$/.test(str)) {
    return {
      day: 1,
      month: 1,
      year: parseInt(str, 10),
    };
  }

  return null;
}

/**
 * Chuẩn hóa mọi chuỗi ngày tháng (ISO, YYYY-MM-DD, DD/MM/YYYY, DD.MM.YYYY, DD-MM-YYYY)
 * về định dạng chuẩn duy nhất: DD/MM/YYYY (ví dụ: 06/09/2026)
 */
export function formatToDDMMYYYY(val?: string | number | Date | null): string {
  if (!val) return '';
  const parts = parseDateParts(val);
  if (!parts) {
    if (typeof val === 'string') return val.trim();
    return String(val);
  }
  const dd = String(parts.day).padStart(2, '0');
  const mm = String(parts.month).padStart(2, '0');
  const yyyy = parts.year;
  return `${dd}/${mm}/${yyyy}`;
}

/**
 * Tự động định dạng khi người dùng nhập ngày tháng vào ô input
 * Cho phép người dùng gõ dd/mm/yyyy, dd.mm.yyyy, dd-mm-yyyy hoặc ddmmyyyy và tự chuẩn hóa về dd/mm/yyyy
 */
export function normalizeDateInput(input: string): string {
  if (!input) return '';
  const clean = input.trim();
  return formatToDDMMYYYY(clean);
}

/**
 * Kiểm tra chuỗi có phải ngày hợp lệ định dạng DD/MM/YYYY hoặc DD-MM-YYYY không
 */
export function isValidDDMMYYYY(str: string): boolean {
  if (!str) return false;
  const parts = parseDateParts(str);
  if (!parts) return false;

  const { day, month, year } = parts;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  if (year < 1900 || year > 2100) return false;

  return true;
}

/**
 * So sánh 2 chuỗi ngày tháng theo thứ tự thời gian tăng dần (cũ -> mới)
 */
export function compareDDMMYYYY(dateA: string, dateB: string): number {
  const pA = parseDateParts(dateA);
  const pB = parseDateParts(dateB);
  if (!pA && !pB) return 0;
  if (!pA) return 1;
  if (!pB) return -1;
  const timeA = new Date(pA.year, pA.month - 1, pA.day).getTime();
  const timeB = new Date(pB.year, pB.month - 1, pB.day).getTime();
  return timeA - timeB;
}
