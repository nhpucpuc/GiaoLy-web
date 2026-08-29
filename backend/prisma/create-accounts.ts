import { PrismaClient, UserRole, ClassCategory, SessionType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating 2 Official Accounts (Admin & GLV)...');

  // 1. Tạo 1 lớp học mẫu cho GLV phụ trách (nếu chưa có)
  const defaultClass = await prisma.classRoom.upsert({
    where: { id: 'cls-kt1' },
    update: {},
    create: {
      id: 'cls-kt1',
      name: 'Khai Tâm 1A',
      category: ClassCategory.KHAI_TAM,
      catechistLeader: 'Maria Nguyễn Thị Tuyết Mai',
      catechistAssists: [],
      roomNumber: 'Phòng 101 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
      session: SessionType.SANG,
      description: 'Lớp vỡ lòng tiếp cận đức tin cơ bản.',
    },
  });

  const salt = await bcrypt.genSalt(10);

  // 2. Tạo tài khoản Admin
  const adminPass = await bcrypt.hash('admin123', salt);
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin.giaoly@gxsonloc.vn' },
    update: { password: adminPass, role: UserRole.ADMIN, fullName: 'Trần Thị Diễm Nga', holyName: 'Maria' },
    create: {
      email: 'admin.giaoly@gxsonloc.vn',
      password: adminPass,
      rawPassword: 'admin123',
      fullName: 'Trần Thị Diễm Nga',
      holyName: 'Maria',
      role: UserRole.ADMIN,
      phone: '0901 234 567',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    },
  });
  console.log('✅ Admin Account Created:', adminUser.email, '(Password: admin123)');

  // 3. Tạo tài khoản Giáo Lý Viên (GLV)
  const glvPass = await bcrypt.hash('glv123', salt);
  const glvUser = await prisma.user.upsert({
    where: { email: 'tuyetmai.glv@gxsonloc.vn' },
    update: { password: glvPass, role: UserRole.CATECHIST, assignedClassId: defaultClass.id },
    create: {
      email: 'tuyetmai.glv@gxsonloc.vn',
      password: glvPass,
      fullName: 'Nguyễn Thị Tuyết Mai',
      holyName: 'Maria',
      role: UserRole.CATECHIST,
      phone: '0912 888 777',
      assignedClassId: defaultClass.id,
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    },
  });
  console.log('✅ Catechist (GLV) Account Created:', glvUser.email, '(Password: glv123)');

  console.log('🎉 2 Accounts are ready on Supabase PostgreSQL!');
}

main()
  .catch((e) => {
    console.error('❌ Failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
