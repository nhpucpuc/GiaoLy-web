import * as XLSX from 'xlsx';
import { Student, ClassRoom } from '../types';

export function exportClassRosterToExcel(
  classRoom: ClassRoom | null | undefined,
  students: Student[],
  _catechistName: string = ''
) {
  if (!students || students.length === 0) {
    alert('Không có học sinh nào trong lớp để xuất Excel!');
    return;
  }

  const className = classRoom?.name || 'Lớp Giáo Lý';
  const academicYear = classRoom?.academicYear || '2026 - 2027';

  // 1. Tạo dữ liệu các dòng
  const rows = students.map((s, idx) => ({
    'STT': idx + 1,
    'Mã Học Sinh': s.code || s.id,
    'Tên Thánh': s.holyName || '',
    'Họ và Tên': s.fullName || '',
    'Giới Tính': s.gender || '',
    'Ngày Sinh': s.dob || '',
    'Nơi Sinh': s.pob || '',
    'Chỗ Ở Hiện Tại': s.address || '',
    'Giáo Khu': s.parishSubdivision || '',
    'SĐT Phụ Huynh': s.parentPhone || '',
    'Họ Tên Phụ Huynh': s.parentName || '',
    'Tên Thánh & Tên Cha': s.fatherName ? `${s.fatherHolyName ? s.fatherHolyName + ' ' : ''}${s.fatherName}` : '',
    'SĐT Cha': s.fatherPhone || '',
    'Tên Thánh & Tên Mẹ': s.motherName ? `${s.motherHolyName ? s.motherHolyName + ' ' : ''}${s.motherName}` : '',
    'SĐT Mẹ': s.motherPhone || '',
    'Ngày Rửa Tội': s.baptismDate || '',
    'Nơi Rửa Tội': s.baptismPlace || '',
    'Ngày Rước Lễ': s.eucharistDate || '',
    'Nơi Rước Lễ': s.eucharistPlace || '',
    'Ngày Thêm Sức': s.confirmationDate || '',
    'Nơi Thêm Sức': s.confirmationPlace || '',
    'Ngày Tuyên Hứa': s.solemnCommunionDate || '',
    'Nơi Tuyên Hứa': s.solemnCommunionPlace || '',
    'Ghi Chú': s.notes || '',
  }));

  // 2. Tạo Worksheet
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // 3. Thiết lập độ rộng cột (Column Widths)
  worksheet['!cols'] = [
    { wch: 6 },  // STT
    { wch: 12 }, // Mã
    { wch: 14 }, // Tên Thánh
    { wch: 22 }, // Họ và Tên
    { wch: 10 }, // Giới Tính
    { wch: 13 }, // Ngày Sinh
    { wch: 16 }, // Nơi Sinh
    { wch: 35 }, // Chỗ Ở Hiện Tại
    { wch: 16 }, // Giáo Khu
    { wch: 14 }, // SĐT
    { wch: 22 }, // Phụ Huynh
    { wch: 22 }, // Cha
    { wch: 13 }, // SĐT Cha
    { wch: 22 }, // Mẹ
    { wch: 13 }, // SĐT Mẹ
    { wch: 14 }, // Rửa Tội
    { wch: 18 }, // Nơi Rửa Tội
    { wch: 14 }, // Rước Lễ
    { wch: 18 }, // Nơi Rước Lễ
    { wch: 14 }, // Thêm Sức
    { wch: 18 }, // Nơi Thêm Sức
    { wch: 14 }, // Tuyên Hứa
    { wch: 18 }, // Nơi Tuyên Hứa
    { wch: 25 }, // Ghi Chú
  ];

  // 4. Tạo Workbook và xuất file
  const workbook = XLSX.utils.book_new();
  const cleanSheetName = className.replace(/[:\\/?*[\]]/g, '').slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);

  const cleanFileName = `Ly_Lich_${className.replace(/\s+/g, '_')}_${academicYear.replace(/\s+/g, '')}.xlsx`;
  XLSX.writeFile(workbook, cleanFileName);
}
