import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning all sample data from Supabase...');

  // Xóa toàn bộ dữ liệu mẫu trong các bảng theo thứ tự quan hệ
  await prisma.attendance.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.announcement.deleteMany();

  console.log('✨ Đã xóa toàn bộ dữ liệu mẫu! Tất cả 6 bảng hiện đã hoàn toàn sạch sẽ, sẵn sàng để nhập dữ liệu thực tế.');
}

main()
  .catch((e) => {
    console.error('❌ Lỗi khi dọn dẹp DB:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
