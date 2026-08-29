import { PrismaClient, UserRole, ClassCategory, SessionType, StudentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting Database Seeding...');

  // 1. Dọn sạch DB cũ (nếu có)
  await prisma.attendance.deleteMany();
  await prisma.gradeRecord.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  await prisma.classRoom.deleteMany();
  await prisma.announcement.deleteMany();

  // 2. Tạo danh sách các Lớp Giáo Lý (Ca Sáng & Ca Tối) TRƯỚC để có ID cho User và Student
  const classesData = [
    {
      id: 'cls-kt1',
      name: 'Khai Tâm 1A',
      category: ClassCategory.KHAI_TAM,
      catechistLeader: 'Maria Nguyễn Thị Tuyết Mai',
      catechistAssists: ['Giuse Trần Văn Bình'],
      roomNumber: 'Phòng 101 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
      session: SessionType.SANG,
      description: 'Lớp vỡ lòng tiếp cận đức tin cơ bản và cầu nguyện thiếu nhi.',
    },
    {
      id: 'cls-kt2',
      name: 'Khai Tâm 2B',
      category: ClassCategory.KHAI_TAM,
      catechistLeader: 'Phêrô Lê Minh Đức',
      catechistAssists: ['Anna Hoàng Thu Trang'],
      roomNumber: 'Phòng 102 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
      session: SessionType.SANG,
      description: 'Chuẩn bị bước sang khối Rước Lễ Xưng Tội.',
    },
    {
      id: 'cls-rl1',
      name: 'Rước Lễ 1',
      category: ClassCategory.RUOC_LE,
      catechistLeader: 'Gioan Baotixita Đỗ Quang Huy',
      catechistAssists: ['Maria Đinh Cẩm Tú'],
      roomNumber: 'Phòng 201 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
      session: SessionType.SANG,
      description: 'Học hỏi Bí tích Hòa Giải và Bí tích Thánh Thể.',
    },
    {
      id: 'cls-rl2',
      name: 'Rước Lễ 2 (Xưng Tội Lần Đầu)',
      category: ClassCategory.RUOC_LE,
      catechistLeader: 'Têrêsa Phạm Ngọc Ánh',
      catechistAssists: ['Giuse Đặng Văn Hùng'],
      roomNumber: 'Phòng 202 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 18:30 - 19:45 (Tối)',
      session: SessionType.TOI,
      description: 'Lớp chuẩn bị Rước Lễ lần đầu vào dịp Lễ Mình Máu Thánh Chúa.',
    },
    {
      id: 'cls-ts1',
      name: 'Thêm Sức 1',
      category: ClassCategory.THEM_SUC,
      catechistLeader: 'Phaolô Vũ Mạnh Hùng',
      catechistAssists: ['Maria Lê Thu Hà'],
      roomNumber: 'Phòng 301 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
      session: SessionType.SANG,
      description: 'Học hỏi ơn Chúa Thánh Thần và trách nhiệm Kitô hữu.',
    },
    {
      id: 'cls-ts2',
      name: 'Thêm Sức 2',
      category: ClassCategory.THEM_SUC,
      catechistLeader: 'Anrê Nguyễn Đình Trọng',
      catechistAssists: ['Catarina Trần Mỹ Dung'],
      roomNumber: 'Phòng 302 - Nhà Mục Vụ',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 18:30 - 19:45 (Tối)',
      session: SessionType.TOI,
      description: 'Chuẩn bị lãnh nhận Bí tích Thêm Sức từ Đức Giám Mục.',
    },
    {
      id: 'cls-bd1',
      name: 'Bao Đồng 1',
      category: ClassCategory.BAO_DONG,
      catechistLeader: 'Giuse Hoàng Văn Thái',
      catechistAssists: ['Maria Nguyễn Bích Trâm'],
      roomNumber: 'Phòng Hội Trường B',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 19:00 - 20:15 (Tối)',
      session: SessionType.TOI,
      description: 'Sống đạo giữa đời và tìm hiểu Thánh Kinh nâng cao.',
    },
    {
      id: 'cls-vd1',
      name: 'Vào Đời - Giới Trẻ',
      category: ClassCategory.VAO_DOI,
      catechistLeader: 'Phêrô Nguyễn Thành Nam',
      catechistAssists: [],
      roomNumber: 'Phòng Hội Trường C',
      academicYear: '2025 - 2026',
      schedule: 'Chúa Nhật | 19:30 - 21:00 (Tối)',
      session: SessionType.TOI,
      description: 'Định hướng nghề nghiệp, hôn nhân Công giáo và phục vụ giáo xứ.',
    },
  ];

  for (const c of classesData) {
    await prisma.classRoom.create({ data: c });
  }
  console.log(`✅ Created ${classesData.length} ClassRooms`);

  // 3. Tạo Mật khẩu mặc định
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('admin123', salt);
  const glvPass = await bcrypt.hash('glv123', salt);
  const parentPass = await bcrypt.hash('parent123', salt);

  // 4. Tạo các Users mẫu (Admin, GLV, Phụ Huynh)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin.giaoly@gxsonloc.vn',
      password: adminPass,
      rawPassword: 'admin123',
      fullName: 'Trần Thị Diễm Nga',
      holyName: 'Maria',
      role: UserRole.ADMIN,
      phone: '0901 234 567',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    },
  });

  const glvUser = await prisma.user.create({
    data: {
      email: 'tuyetmai.glv@gxsonloc.vn',
      password: glvPass,
      fullName: 'Nguyễn Thị Tuyết Mai',
      holyName: 'Maria',
      role: UserRole.CATECHIST,
      phone: '0912 888 777',
      assignedClassId: 'cls-kt1',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
    },
  });

  const parentUser = await prisma.user.create({
    data: {
      email: 'hung.nguyen@gmail.com',
      password: parentPass,
      fullName: 'Nguyễn Văn Hùng',
      holyName: 'Giuse',
      role: UserRole.PARENT,
      phone: '0912 345 678',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  console.log('✅ Created Demo Users (Admin, GLV, Parent)');

  // 5. Tạo Học Sinh mẫu cho lớp Khai Tâm 1A & Thêm Sức 1
  const studentsData = [
    {
      id: 'std-001',
      code: 'STD001',
      holyName: 'Maria',
      fullName: 'Nguyễn Mai Lan',
      gender: 'Nữ',
      dob: '2016-05-14',
      baptismDate: '2016-06-10',
      baptismPlace: 'GX Sơn Lộc',
      eucharistDate: '2024-06-02',
      classId: 'cls-kt1',
      parentName: 'Giuse Nguyễn Văn Hùng',
      parentPhone: '0912 345 678',
      address: 'Số 12, Ngõ 45 Đường Sơn Tây, Sơn Lộc',
      status: StudentStatus.DANG_HOC,
      parentId: parentUser.id,
      avatar: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150',
      notes: 'Học tập chăm chỉ, hát lễ tốt',
    },
    {
      id: 'std-002',
      code: 'STD002',
      holyName: 'Giuse',
      fullName: 'Trần Minh Hoàng',
      gender: 'Nam',
      dob: '2016-08-20',
      baptismDate: '2016-09-15',
      baptismPlace: 'GX Sơn Lộc',
      classId: 'cls-kt1',
      parentName: 'Phêrô Trần Văn Tuấn',
      parentPhone: '0988 123 456',
      address: 'Khu 3, Phường Trung Hưng, Sơn Tây',
      status: StudentStatus.DANG_HOC,
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      notes: 'Năng nổ phát biểu bài',
    },
    {
      id: 'std-003',
      code: 'STD003',
      holyName: 'Têrêsa',
      fullName: 'Lê Ngọc Thảo',
      gender: 'Nữ',
      dob: '2016-03-12',
      baptismDate: '2016-04-05',
      baptismPlace: 'GX Sơn Lộc',
      classId: 'cls-kt1',
      parentName: 'Maria Vũ Thị Hoa',
      parentPhone: '0904 888 999',
      address: 'Xóm 2, Thôn Vị Thủy, Sơn Lộc',
      status: StudentStatus.DANG_HOC,
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
      notes: 'Chuyên cần đi lễ Chúa Nhật rất đều',
    },
    {
      id: 'std-004',
      code: 'STD004',
      holyName: 'Phêrô',
      fullName: 'Phạm Đức Anh',
      gender: 'Nam',
      dob: '2016-11-05',
      baptismDate: '2016-12-01',
      baptismPlace: 'GX Sơn Lộc',
      classId: 'cls-kt1',
      parentName: 'Đaminh Phạm Văn Lực',
      parentPhone: '0973 456 789',
      address: 'Số 89 Quang Trung, Sơn Tây',
      status: StudentStatus.DANG_HOC,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      notes: 'Thành viên đội Lễ sinh xứ đoàn',
    },
    {
      id: 'std-005',
      code: 'STD005',
      holyName: 'Anna',
      fullName: 'Đỗ Thùy Linh',
      gender: 'Nữ',
      dob: '2016-07-22',
      baptismDate: '2016-08-18',
      baptismPlace: 'GX Sơn Lộc',
      classId: 'cls-kt1',
      parentName: 'Giuse Đỗ Văn Cường',
      parentPhone: '0936 112 233',
      address: 'Tổ 5, Phường Lê Lợi, Sơn Tây',
      status: StudentStatus.DANG_HOC,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      notes: 'Tiếp thu bài nhanh',
    },
    {
      id: 'std-006',
      code: 'STD006',
      holyName: 'Gioan',
      fullName: 'Hoàng Quốc Bảo',
      gender: 'Nam',
      dob: '2016-09-18',
      baptismDate: '2016-10-10',
      baptismPlace: 'GX Sơn Lộc',
      classId: 'cls-kt1',
      parentName: 'Phaolô Hoàng Văn Nam',
      parentPhone: '0915 678 901',
      address: 'Khu Đô thị Phú Thịnh, Sơn Tây',
      status: StudentStatus.DANG_HOC,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      notes: 'Cần chú ý trật tự trong giờ học',
    },
  ];

  for (const s of studentsData) {
    await prisma.student.create({ data: s });
  }
  console.log(`✅ Created ${studentsData.length} Students`);

  // 6. Tạo Bảng Điểm chuẩn cho các em
  const gradesData = [
    { studentId: 'std-001', classId: 'cls-kt1', hk1_tx1: 8.5, hk1_tx2: 9.0, hk1_thi: 9.0, hk1_tb: 8.9, hk1_rank: 2, hk2_tx1: 8.5, hk2_tx2: 9.0, hk2_thi: 9.0, hk2_tb: 8.9, hk2_rank: 2, tb_cn: 8.9, cn_rank: 2, result: 'Lên lớp', conduct: 'Giỏi', notes: 'Nắm vững giáo lý căn bản, đi lễ siêng năng và lễ phép.' },
    { studentId: 'std-002', classId: 'cls-kt1', hk1_tx1: 8.0, hk1_tx2: 8.0, hk1_thi: 8.5, hk1_tb: 8.3, hk1_rank: 4, hk2_tx1: 8.0, hk2_tx2: 8.5, hk2_thi: 8.0, hk2_tb: 8.1, hk2_rank: 4, tb_cn: 8.2, cn_rank: 4, result: 'Lên lớp', conduct: 'Giỏi', notes: 'Hăng hái phát biểu, tiếp thu tốt các bài học Kinh Thánh.' },
    { studentId: 'std-003', classId: 'cls-kt1', hk1_tx1: 9.0, hk1_tx2: 9.5, hk1_thi: 9.5, hk1_tb: 9.4, hk1_rank: 1, hk2_tx1: 9.0, hk2_tx2: 9.5, hk2_thi: 9.5, hk2_tb: 9.4, hk2_rank: 1, tb_cn: 9.4, cn_rank: 1, result: 'Lên lớp', conduct: 'Xuất sắc', notes: 'Rất chăm ngoan, thuộc kinh hạt đầy đủ.' },
    { studentId: 'std-004', classId: 'cls-kt1', hk1_tx1: 7.5, hk1_tx2: 8.0, hk1_thi: 8.0, hk1_tb: 7.9, hk1_rank: 5, hk2_tx1: 8.0, hk2_tx2: 8.0, hk2_thi: 8.5, hk2_tb: 8.3, hk2_rank: 3, tb_cn: 8.1, cn_rank: 5, result: 'Lên lớp', conduct: 'Khá', notes: 'Có tinh thần phục vụ bàn thờ.' },
    { studentId: 'std-005', classId: 'cls-kt1', hk1_tx1: 8.0, hk1_tx2: 8.5, hk1_thi: 8.5, hk1_tb: 8.4, hk1_rank: 3, hk2_tx1: 8.5, hk2_tx2: 8.5, hk2_thi: 8.5, hk2_tb: 8.5, hk2_rank: 3, tb_cn: 8.5, cn_rank: 3, result: 'Lên lớp', conduct: 'Giỏi', notes: 'Học đều, ngoan ngoãn vâng lời các thầy cô GLV.' },
    { studentId: 'std-006', classId: 'cls-kt1', hk1_tx1: 7.0, hk1_tx2: 7.5, hk1_thi: 7.5, hk1_tb: 7.4, hk1_rank: 6, hk2_tx1: 7.0, hk2_tx2: 7.5, hk2_thi: 7.5, hk2_tb: 7.4, hk2_rank: 6, tb_cn: 7.4, cn_rank: 6, result: 'Lên lớp', conduct: 'Khá', notes: 'Cần chú ý tập trung lắng nghe hơn trong giờ học.' },
  ];

  for (const g of gradesData) {
    await prisma.gradeRecord.create({ data: g });
  }
  console.log(`✅ Created GradeRecords`);

  // 7. Tạo Lịch sử Chuyên cần
  const attData = [
    { studentId: 'std-001', date: '2026-08-24', type: 'LE_CHUA_NHAT' as any, status: 'CO_MAT' as any },
    { studentId: 'std-001', date: '2026-08-24', type: 'GIO_GIAO_LY' as any, status: 'CO_MAT' as any },
    { studentId: 'std-001', date: '2026-08-17', type: 'LE_CHUA_NHAT' as any, status: 'CO_MAT' as any },
    { studentId: 'std-001', date: '2026-08-10', type: 'GIO_GIAO_LY' as any, status: 'VANG_CO_PHEP' as any, notes: 'Gia đình về quê' },
  ];

  for (const a of attData) {
    await prisma.attendance.create({ data: a });
  }

  // 8. Tạo Thông Báo
  const announcements = [
    {
      title: 'Thông báo Khai giảng Niên khóa Giáo lý 2025 - 2026',
      content: 'Ban Giáo Lý Giáo Xứ Sơn Lộc trân trọng thông báo Thánh Lễ Khai Giảng niên khóa mới sẽ diễn ra vào lúc 07:00 Chúa Nhật ngày 07/09/2025. Kính mời quý phụ huynh và các em thiếu nhi tham dự đông đủ.',
      author: 'Trưởng ban Giáo Lý',
      targetAudience: 'Tất cả',
      type: 'event',
      date: '2026-08-22',
    },
    {
      title: 'Lịch thi kết thúc Học Kỳ I các khối Khai Tâm và Rước Lễ',
      content: 'Các lớp thuộc khối Khai Tâm và Rước Lễ sẽ tiến hành kiểm tra giáo lý vấn đáp vào Chúa Nhật ngày 14/12/2025. Quý phụ huynh vui lòng nhắc nhở con em ôn tập kinh hạt và giáo lý theo sổ tay.',
      author: 'Ban Học Vụ',
      targetAudience: 'Phụ Huynh',
      type: 'exam',
      date: '2026-08-20',
    },
  ];

  for (const anc of announcements) {
    await prisma.announcement.create({ data: anc });
  }

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
