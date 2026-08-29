const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { assignedClass: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  console.log(`\n======================================================`);
  console.log(`📌 TỔNG CỘNG CÓ ${users.length} TÀI KHOẢN TRONG HỆ THỐNG`);
  console.log(`======================================================\n`);

  const exportData = users.map((u, idx) => ({
    'STT': idx + 1,
    'Vai Trò': u.role === 'ADMIN' ? 'Ban Giáo Lý (Admin)' : 'Giáo Lý Viên (GLV)',
    'Tên Thánh': u.holyName || '',
    'Họ và Tên': u.fullName,
    'Email Đăng Nhập': u.email,
    'Mật Khẩu Mặc Định': u.rawPassword || (u.role === 'ADMIN' ? 'admin123' : 'glv123'),
    'Lớp Phụ Trách': u.assignedClass ? u.assignedClass.name : 'Tất cả các lớp (Quản trị)',
    'Số Điện Thoại': u.phone || '',
  }));

  // Tạo bảng Markdown
  console.table(exportData);

  // Tạo file Excel
  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 26 },
    { wch: 32 },
    { wch: 20 },
    { wch: 26 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Tài Khoản');

  const rootExcelPath = path.join(__dirname, '..', 'Danh_Sach_Tai_Khoan_Giao_Ly_Son_Loc.xlsx');
  XLSX.writeFile(wb, rootExcelPath);

  console.log(`\n✅ ĐÃ XUẤT THÀNH CÔNG RA FILE EXCEL: ${rootExcelPath}\n`);
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
