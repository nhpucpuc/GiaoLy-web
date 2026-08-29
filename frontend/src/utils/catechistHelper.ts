import { ClassRoom } from '../types';

/**
 * Format tên Giáo Lý Viên kết hợp Tên Thánh và Họ Tên mà không bị trùng lặp tiền tố.
 */
export function formatCatechistName(holyName?: string | null, fullName?: string | null): string {
  const holy = (holyName || '').trim();
  const full = (fullName || '').trim();

  if (!holy || holy === 'Giáo Lý Viên') return full;
  if (!full) return holy;
  if (holy === full) return full;
  if (full.toLowerCase().startsWith(holy.toLowerCase())) return full;
  if (holy.toLowerCase().includes(full.toLowerCase())) return holy;

  return `${holy} ${full}`;
}

/**
 * Lấy danh sách dạng mảng các Giáo Lý Viên phụ trách lớp (dùng cho hiển thị từng dòng)
 */
export function getFullCatechistNamesList(
  cls?: ClassRoom | null,
  allCatechists?: any[]
): string[] {
  if (!cls) return [];

  const names: string[] = [];

  // 1. Lấy từ danh sách tài khoản GLV được gán lớp nếu có
  if (allCatechists && allCatechists.length > 0) {
    const assigned = allCatechists.filter(
      (g) => g.assignedClassId === cls.id || (g.assignedClass && g.assignedClass.id === cls.id)
    );
    assigned.forEach((g) => {
      const formatted = formatCatechistName(g.holyName, g.fullName);
      if (formatted && !names.includes(formatted)) {
        names.push(formatted);
      }
    });
  }

  // 2. Lấy từ catechistLeader
  if (cls.catechistLeader && cls.catechistLeader !== 'Chưa phân công') {
    const parts = cls.catechistLeader.split(',').map((s) => s.trim()).filter(Boolean);
    parts.forEach((p) => {
      const cleanName = p.replace(/\s+/g, ' ').trim();
      if (!names.includes(cleanName)) names.push(cleanName);
    });
  }

  // 3. Lấy từ catechistAssists
  if (Array.isArray(cls.catechistAssists)) {
    cls.catechistAssists.forEach((assist) => {
      if (assist && typeof assist === 'string') {
        const parts = assist.split(',').map((s) => s.trim()).filter(Boolean);
        parts.forEach((p) => {
          const cleanName = p.replace(/\s+/g, ' ').trim();
          if (!names.includes(cleanName)) names.push(cleanName);
        });
      }
    });
  }

  return names;
}

/**
 * Lấy chuỗi danh sách đầy đủ tên các Giáo Lý Viên phụ trách lớp (cả GLV trưởng và GLV phụ tá)
 * Tự động hợp nhất từ danh mục tài khoản GLV và thông tin lưu trữ của lớp học.
 */
export function getFullCatechistNames(
  cls?: ClassRoom | null,
  allCatechists?: any[]
): string {
  if (!cls) return 'Chưa phân công';
  const list = getFullCatechistNamesList(cls, allCatechists);
  if (list.length === 0) {
    return cls.catechistLeader || 'Chưa phân công';
  }
  return list.join(', ');
}
