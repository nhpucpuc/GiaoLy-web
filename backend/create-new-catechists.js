const { PrismaClient, UserRole } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');

const prisma = new PrismaClient();

const newCatechists = [
  { fullName: 'Hà Thị Biết', username: 'hathibiet' },
  { fullName: 'Nguyễn Thị Oanh', username: 'nguyenthioanh' },
  { fullName: 'Trần Phương Uyên', username: 'tranphuonguyen' },
  { fullName: 'Trần Thị Lụa', username: 'tranthilua' },
  { fullName: 'Phạm Châu Sơn', username: 'phamchauson' },
  { fullName: 'Nguyễn Tuấn Kiệt', username: 'nguyentuankiet' },
];

async function main() {
  console.log('🚀 Đang tạo tài khoản cho 6 Giáo Lý Viên mới...');

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('glv123', salt);

  for (const c of newCatechists) {
    const user = await prisma.user.upsert({
      where: { email: c.username },
      update: {
        fullName: c.fullName,
        password: hashedPassword,
        rawPassword: 'glv123',
        role: UserRole.CATECHIST,
      },
      create: {
        email: c.username,
        fullName: c.fullName,
        password: hashedPassword,
        rawPassword: 'glv123',
        role: UserRole.CATECHIST,
      },
    });
    console.log(`✅ Đã tạo/cập nhật: ${user.fullName} -> Tên đăng nhập: "${user.email}" (Mật khẩu: glv123)`);
  }

  // Xuất lại file Excel mới nhất
  const users = await prisma.user.findMany({
    include: { assignedClass: true },
    orderBy: [{ role: 'asc' }, { fullName: 'asc' }],
  });

  console.log(`\n======================================================`);
  console.log(`📌 TỔNG CỘNG HIỆN CÓ: ${users.length} TÀI KHOẢN TRONG HỆ THỐNG`);
  console.log(`======================================================\n`);

  const exportData = users.map((u, idx) => ({
    'STT': idx + 1,
    'Vai Trò': u.role === 'ADMIN' ? 'Ban Giáo Lý (Admin)' : 'Giáo Lý Viên (GLV)',
    'Tên Thánh': u.holyName || '',
    'Họ và Tên': u.fullName,
    'Tên Đăng Nhập': u.email,
    'Mật Khẩu': u.rawPassword || (u.role === 'ADMIN' ? 'admin123' : 'glv123'),
    'Lớp Phụ Trách': u.assignedClass ? u.assignedClass.name : (u.role === 'ADMIN' ? 'Tất cả các lớp (Quản trị)' : 'Chưa phân công lớp'),
    'Số Điện Thoại': u.phone || '',
  }));

  console.table(exportData);

  const ws = XLSX.utils.json_to_sheet(exportData);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 22 },
    { wch: 14 },
    { wch: 26 },
    { wch: 26 },
    { wch: 16 },
    { wch: 26 },
    { wch: 16 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Tài Khoản');

  const rootExcelPath = path.join(__dirname, '..', 'Danh_Sach_Tai_Khoan_Giao_Ly_Son_Loc.xlsx');
  XLSX.writeFile(wb, rootExcelPath);

  const desktopPath = path.join(process.env.USERPROFILE || 'C:\\Users\\LENOVO', 'Desktop', 'Danh_Sach_Tai_Khoan_Giao_Ly_Son_Loc.xlsx');
  fs.copyFileSync(rootExcelPath, desktopPath);

  console.log(`\n📁 File Excel mới nhất đã được cập nhật tại:\n- ${desktopPath}\n`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
