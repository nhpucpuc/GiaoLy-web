/**
 * Backend Date normalization utility to standardize dates to DD-MM-YYYY format
 */

export function parseDateToDDMMYYYY(val?: string | number | null): string | null {
  if (!val) return null;

  if (typeof val === 'number') {
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return String(val).trim();
    const dd = String(date.getUTCDate()).padStart(2, '0');
    const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = date.getUTCFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  let str = String(val).trim();
  if (!str) return null;

  str = str.replace(/^['"`\s]+/, '').replace(/['"`\s]+$/, '');

  // Check if phone number accidentally in date
  if (/^0\d{9}$/.test(str)) {
    return null;
  }

  // YYYY-MM-DD
  let match = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (match) {
    const yyyy = match[1];
    const mm = match[2].padStart(2, '0');
    const dd = match[3].padStart(2, '0');
    return `${dd}-${mm}-${yyyy}`;
  }

  // DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  match = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (match) {
    let p1 = parseInt(match[1], 10);
    let p2 = parseInt(match[2], 10);
    const yyyy = match[3];

    let dd: string, mm: string;
    if (p1 <= 12 && p2 > 12) {
      mm = String(p1).padStart(2, '0');
      dd = String(p2).padStart(2, '0');
    } else {
      dd = String(p1).padStart(2, '0');
      mm = String(p2).padStart(2, '0');
    }
    return `${dd}-${mm}-${yyyy}`;
  }

  if (/^\d{4}$/.test(str)) {
    return `01-01-${str}`;
  }

  return str;
}
