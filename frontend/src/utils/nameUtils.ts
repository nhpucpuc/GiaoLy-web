/**
 * Tiện ích xử lý và sắp xếp tên người Việt Nam theo bảng chữ cái Alphabet
 * Chuẩn tiếng Việt: Ưu tiên so sánh Tên (từ cuối cùng), nếu trùng tên thì so sánh Họ và Tên đệm.
 */

export interface WithFullName {
  fullName: string;
  [key: string]: any;
}

/**
 * Tách họ tên tiếng Việt thành { firstName: Tên, restName: Họ và tên đệm }
 * Ví dụ:
 *  - "Nguyễn Văn An" -> { firstName: "An", restName: "Nguyễn Văn" }
 *  - "Trần Thị Mai Anh" -> { firstName: "Anh", restName: "Trần Thị Mai" }
 *  - "Bình" -> { firstName: "Bình", restName: "" }
 */
export function splitVietnameseName(fullName?: string): { firstName: string; restName: string } {
  if (!fullName) return { firstName: '', restName: '' };
  const trimmed = fullName.trim();
  const lastSpaceIdx = trimmed.lastIndexOf(' ');
  if (lastSpaceIdx === -1) {
    return { firstName: trimmed, restName: '' };
  }
  const firstName = trimmed.substring(lastSpaceIdx + 1).trim();
  const restName = trimmed.substring(0, lastSpaceIdx).trim();
  return { firstName, restName };
}

/**
 * So sánh 2 họ tên tiếng Việt theo chuẩn Alphabet:
 * 1. So sánh Tên (từ cuối cùng) trước bằng bảng mã tiếng Việt ('vi').
 * 2. Nếu cùng Tên, so sánh phần Họ và Tên đệm.
 * 3. Nếu vẫn giống nhau, so sánh nguyên chuỗi gốc.
 */
export function compareVietnameseNames(aName?: string, bName?: string): number {
  const nameA = aName ? aName.trim() : '';
  const nameB = bName ? bName.trim() : '';

  if (!nameA && !nameB) return 0;
  if (!nameA) return 1;
  if (!nameB) return -1;

  const splitA = splitVietnameseName(nameA);
  const splitB = splitVietnameseName(nameB);

  // 1. So sánh Tên trước
  const cmpFirst = splitA.firstName.localeCompare(splitB.firstName, 'vi', { sensitivity: 'base' });
  if (cmpFirst !== 0) return cmpFirst;

  // 2. Nếu tên trùng nhau, so sánh Họ & Đệm
  const cmpRest = splitA.restName.localeCompare(splitB.restName, 'vi', { sensitivity: 'base' });
  if (cmpRest !== 0) return cmpRest;

  // 3. Nếu vẫn trùng (ví dụ khác dấu hoa thường), so sánh cả chuỗi
  return nameA.localeCompare(nameB, 'vi');
}

/**
 * Sắp xếp mảng học sinh hoặc đối tượng có thuộc tính fullName theo Alphabet tính bằng Tên
 */
export function sortStudentsByVietnameseName<T extends { fullName: string }>(list: T[]): T[] {
  if (!Array.isArray(list)) return [];
  return [...list].sort((a, b) => compareVietnameseNames(a.fullName, b.fullName));
}
