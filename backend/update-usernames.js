const { PrismaClient } = require('@prisma/client');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

async function main() {
  // Ensure Admin is admin.giaoly@gxsonloc.vn
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data: { email: 'admin.giaoly@gxsonloc.vn' },
  });

  const users = await prisma.user.findMany({
    include: { assignedClass: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  console.log(`\n======================================================`);
  console.log(`📌 TỔNG CỘNG ${users.length} TÀI KHOẢN HỆ THỐNG`);
  console.log(`======================================================\n`);

  const exportData = users.map((u, idx) => ({
    'STT': idx + 1,
    'Vai Trò': u.role === 'ADMIN' ? 'Ban Giáo Lý (Admin)' : 'Giáo Lý Viên (GLV)',
    'Tên Thánh': u.holyName || '',
    'Họ và Tên': u.fullName,
    'Tên Đăng Nhập': u.email,
    'Mật Khẩu Mặc Định': u.rawPassword || (u.role === 'ADMIN' ? 'admin123' : 'glv123'),
    'Lớp Phụ Trách': u.assignedClass ? u.assignedClass.name : 'Tất cả các lớp (Quản trị)',
    'Số Điện Thoại': u.phone || '',
  }));

  console.table(exportData);

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 26 },
    { wch: 28 },
    { wch: 20 },
    { wch: 26 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Tài Khoản');

  const rootExcelPath = path.join(__dirname, '..', 'Danh_Sach_Tai_Khoan_Giao_Ly_Son_Loc.xlsx');
  XLSX.writeFile(wb, rootExcelPath);

  const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\LENOVO', 'Desktop', 'Danh_Sach_Tai_Khoan_Giao_Ly_Son_Loc.xlsx');
  fs.copyFileSync(rootExcelPath, desktopPath);

  console.log(`\n📁 File Excel đã được cập nhật tại:\n- ${desktopPath}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
