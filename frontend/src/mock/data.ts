import { ClassRoom, Student, GradeRecord, AttendanceRecord, Announcement, User } from '../types';

export const INITIAL_CLASSES: ClassRoom[] = [
  {
    id: 'cls-kt1',
    name: 'Khai Tâm 1A',
    category: 'Khai Tâm',
    catechistLeader: 'Maria Nguyễn Thị Tuyết Mai',
    catechistAssists: ['Giuse Trần Văn Bình'],
    roomNumber: 'Phòng 101 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 28,
    schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
    session: 'Sáng',
    description: 'Lớp vỡ lòng tiếp cận đức tin cơ bản và cầu nguyện thiếu nhi.'
  },
  {
    id: 'cls-kt2',
    name: 'Khai Tâm 2B',
    category: 'Khai Tâm',
    catechistLeader: 'Phêrô Lê Minh Đức',
    catechistAssists: ['Anna Hoàng Thu Trang'],
    roomNumber: 'Phòng 102 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 26,
    schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
    session: 'Sáng',
    description: 'Chuẩn bị bước sang khối Rước Lễ Xưng Tội.'
  },
  {
    id: 'cls-rl1',
    name: 'Rước Lễ 1',
    category: 'Rước Lễ',
    catechistLeader: 'Gioan Baotixita Đỗ Quang Huy',
    catechistAssists: ['Maria Đinh Cẩm Tú'],
    roomNumber: 'Phòng 201 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 32,
    schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
    session: 'Sáng',
    description: 'Học hỏi Bí tích Hòa Giải và Bí tích Thánh Thể.'
  },
  {
    id: 'cls-rl2',
    name: 'Rước Lễ 2 (Xưng Tội Lần Đầu)',
    category: 'Rước Lễ',
    catechistLeader: 'Têrêsa Phạm Ngọc Ánh',
    catechistAssists: ['Giuse Đặng Văn Hùng'],
    roomNumber: 'Phòng 202 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 30,
    schedule: 'Chúa Nhật | 18:30 - 19:45 (Tối)',
    session: 'Tối',
    description: 'Lớp chuẩn bị Rước Lễ lần đầu vào dịp Lễ Mình Máu Thánh Chúa.'
  },
  {
    id: 'cls-ts1',
    name: 'Thêm Sức 1',
    category: 'Thêm Sức',
    catechistLeader: 'Phaolô Vũ Mạnh Hùng',
    catechistAssists: ['Maria Lê Thu Hà'],
    roomNumber: 'Phòng 301 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 25,
    schedule: 'Chúa Nhật | 07:30 - 08:45 (Sáng)',
    session: 'Sáng',
    description: 'Học hỏi ơn Chúa Thánh Thần và trách nhiệm Kitô hữu.'
  },
  {
    id: 'cls-ts2',
    name: 'Thêm Sức 2',
    category: 'Thêm Sức',
    catechistLeader: 'Anrê Nguyễn Đình Trọng',
    catechistAssists: ['Catarina Trần Mỹ Dung'],
    roomNumber: 'Phòng 302 - Nhà Mục Vụ',
    academicYear: '2025 - 2026',
    studentCount: 27,
    schedule: 'Chúa Nhật | 18:30 - 19:45 (Tối)',
    session: 'Tối',
    description: 'Chuẩn bị lãnh nhận Bí tích Thêm Sức từ Đức Giám Mục.'
  },
  {
    id: 'cls-bd1',
    name: 'Bao Đồng 1',
    category: 'Bao Đồng',
    catechistLeader: 'Giuse Hoàng Văn Thái',
    catechistAssists: ['Maria Nguyễn Bích Trâm'],
    roomNumber: 'Phòng Hội Trường B',
    academicYear: '2025 - 2026',
    studentCount: 22,
    schedule: 'Chúa Nhật | 19:00 - 20:15 (Tối)',
    session: 'Tối',
    description: 'Sống đạo giữa đời và tìm hiểu Thánh Kinh nâng cao.'
  },
  {
    id: 'cls-vd1',
    name: 'Vào Đời - Giới Trẻ',
    category: 'Vào Đời',
    catechistLeader: 'Phêrô Nguyễn Thành Nam',
    roomNumber: 'Phòng Hội Trường C',
    academicYear: '2025 - 2026',
    studentCount: 19,
    schedule: 'Chúa Nhật | 19:30 - 21:00 (Tối)',
    session: 'Tối',
    description: 'Định hướng nghề nghiệp, hôn nhân Công giáo và phục vụ giáo xứ.'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-001',
    holyName: 'Maria',
    fullName: 'Nguyễn Mai Lan',
    gender: 'Nữ',
    dob: '2016-05-14',
    baptismDate: '2016-06-10',
    baptismPlace: 'GX Sơn Lộc',
    eucharistDate: '2024-06-02',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Giuse Nguyễn Văn Hùng',
    parentPhone: '0912 345 678',
    address: 'Số 12, Ngõ 45 Đường Sơn Tây, Sơn Lộc',
    status: 'Đang học',
    notes: 'Học tập chăm chỉ, hát lễ tốt'
  },
  {
    id: 'std-002',
    holyName: 'Giuse',
    fullName: 'Trần Minh Hoàng',
    gender: 'Nam',
    dob: '2016-08-20',
    baptismDate: '2016-09-15',
    baptismPlace: 'GX Sơn Lộc',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Phêrô Trần Văn Tuấn',
    parentPhone: '0988 123 456',
    address: 'Khu 3, Phường Trung Hưng, Sơn Tây',
    status: 'Đang học',
    notes: 'Năng nổ phát biểu bài'
  },
  {
    id: 'std-003',
    holyName: 'Têrêsa',
    fullName: 'Lê Ngọc Thảo',
    gender: 'Nữ',
    dob: '2016-03-12',
    baptismDate: '2016-04-05',
    baptismPlace: 'GX Sơn Lộc',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Maria Vũ Thị Hoa',
    parentPhone: '0904 888 999',
    address: 'Xóm 2, Thôn Vị Thủy, Sơn Lộc',
    status: 'Đang học',
    notes: 'Chuyên cần đi lễ Chúa Nhật rất đều'
  },
  {
    id: 'std-004',
    holyName: 'Phêrô',
    fullName: 'Phạm Đức Anh',
    gender: 'Nam',
    dob: '2016-11-05',
    baptismDate: '2016-12-01',
    baptismPlace: 'GX Sơn Lộc',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Đaminh Phạm Văn Lực',
    parentPhone: '0973 456 789',
    address: 'Số 89 Quang Trung, Sơn Tây',
    status: 'Đang học',
    notes: 'Thành viên đội Lễ sinh xứ đoàn'
  },
  {
    id: 'std-005',
    holyName: 'Anna',
    fullName: 'Đỗ Thùy Linh',
    gender: 'Nữ',
    dob: '2016-07-22',
    baptismDate: '2016-08-18',
    baptismPlace: 'GX Sơn Lộc',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Giuse Đỗ Văn Cường',
    parentPhone: '0936 112 233',
    address: 'Tổ 5, Phường Lê Lợi, Sơn Tây',
    status: 'Đang học',
    notes: 'Tiếp thu bài nhanh'
  },
  {
    id: 'std-006',
    holyName: 'Gioan',
    fullName: 'Hoàng Quốc Bảo',
    gender: 'Nam',
    dob: '2016-09-18',
    baptismDate: '2016-10-10',
    baptismPlace: 'GX Sơn Lộc',
    classId: 'cls-kt1',
    className: 'Khai Tâm 1A',
    parentName: 'Phaolô Hoàng Văn Nam',
    parentPhone: '0915 678 901',
    address: 'Khu Đô thị Phú Thịnh, Sơn Tây',
    status: 'Đang học',
    notes: 'Cần chú ý trật tự trong giờ học'
  },
  // Thêm học sinh cho lớp Thêm Sức 1
  {
    id: 'std-007',
    holyName: 'Phaolô',
    fullName: 'Nguyễn Tiến Dũng',
    gender: 'Nam',
    dob: '2012-02-10',
    baptismDate: '2012-03-01',
    eucharistDate: '2020-06-07',
    classId: 'cls-ts1',
    className: 'Thêm Sức 1',
    parentName: 'Giuse Nguyễn Văn Long',
    parentPhone: '0903 222 111',
    address: 'Khu tập thể Quân Đội, Sơn Lộc',
    status: 'Đang học',
    notes: 'Đội trưởng huynh trưởng phụ tá'
  },
  {
    id: 'std-008',
    holyName: 'Catarina',
    fullName: 'Đặng Thảo My',
    gender: 'Nữ',
    dob: '2012-09-15',
    baptismDate: '2012-10-05',
    eucharistDate: '2020-06-07',
    classId: 'cls-ts1',
    className: 'Thêm Sức 1',
    parentName: 'Maria Đặng Thu Hương',
    parentPhone: '0945 999 888',
    address: 'Xóm Chùa, Sơn Tây',
    status: 'Đang học',
    notes: 'Hát ca đoàn thiếu nhi'
  }
];

export const INITIAL_GRADES: GradeRecord[] = [
  {
    id: 'grd-001',
    studentId: 'std-001',
    classId: 'cls-kt1',
    oralScore: 9.0,
    test15m: 8.5,
    test45m: 9.0,
    semesterExam: 9.5,
    attendanceScore: 10.0,
    finalScore: 9.2,
    conduct: 'Xuất sắc',
    notes: 'Nắm vững giáo lý căn bản, đi lễ siêng năng và lễ phép.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-002',
    studentId: 'std-002',
    classId: 'cls-kt1',
    oralScore: 8.0,
    test15m: 7.5,
    test45m: 8.5,
    semesterExam: 8.0,
    attendanceScore: 9.0,
    finalScore: 8.1,
    conduct: 'Giỏi',
    notes: 'Hăng hái phát biểu, tiếp thu tốt các bài học Kinh Thánh.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-003',
    studentId: 'std-003',
    classId: 'cls-kt1',
    oralScore: 9.5,
    test15m: 9.0,
    test45m: 9.5,
    semesterExam: 9.0,
    attendanceScore: 10.0,
    finalScore: 9.3,
    conduct: 'Xuất sắc',
    notes: 'Rất chăm ngoan, thuộc kinh hạt đầy đủ.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-004',
    studentId: 'std-004',
    classId: 'cls-kt1',
    oralScore: 7.5,
    test15m: 8.0,
    test45m: 7.5,
    semesterExam: 8.0,
    attendanceScore: 9.5,
    finalScore: 7.9,
    conduct: 'Khá',
    notes: 'Có tinh thần phục vụ bàn thờ, cần rèn thêm phần giải nghĩa Lời Chúa.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-005',
    studentId: 'std-005',
    classId: 'cls-kt1',
    oralScore: 8.5,
    test15m: 8.5,
    test45m: 8.0,
    semesterExam: 8.5,
    attendanceScore: 9.0,
    finalScore: 8.4,
    conduct: 'Giỏi',
    notes: 'Học đều, ngoan ngoãn vâng lời các thầy cô GLV.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-006',
    studentId: 'std-006',
    classId: 'cls-kt1',
    oralScore: 7.0,
    test15m: 6.5,
    test45m: 7.0,
    semesterExam: 7.5,
    attendanceScore: 8.0,
    finalScore: 7.1,
    conduct: 'Khá',
    notes: 'Cần chú ý tập trung lắng nghe hơn trong giờ học.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-007',
    studentId: 'std-007',
    classId: 'cls-ts1',
    oralScore: 9.0,
    test15m: 9.0,
    test45m: 8.5,
    semesterExam: 9.0,
    attendanceScore: 10.0,
    finalScore: 8.9,
    conduct: 'Xuất sắc',
    notes: 'Gương mẫu, nhiệt tình dẫn dắt các em lớp nhỏ.',
    lastUpdated: '2026-08-20'
  },
  {
    id: 'grd-008',
    studentId: 'std-008',
    classId: 'cls-ts1',
    oralScore: 8.5,
    test15m: 8.0,
    test45m: 8.5,
    semesterExam: 8.5,
    attendanceScore: 9.5,
    finalScore: 8.5,
    conduct: 'Giỏi',
    notes: 'Đóng góp tích cực vào các hoạt động tông đồ xứ đoàn.',
    lastUpdated: '2026-08-20'
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [
  { id: 'att-1', studentId: 'std-001', date: '2026-08-24', type: 'Lễ Chúa Nhật', status: 'Có mặt' },
  { id: 'att-2', studentId: 'std-001', date: '2026-08-24', type: 'Giờ Giáo Lý', status: 'Có mặt' },
  { id: 'att-3', studentId: 'std-001', date: '2026-08-17', type: 'Lễ Chúa Nhật', status: 'Có mặt' },
  { id: 'att-4', studentId: 'std-001', date: '2026-08-17', type: 'Giờ Giáo Lý', status: 'Có mặt' },
  { id: 'att-5', studentId: 'std-001', date: '2026-08-10', type: 'Lễ Chúa Nhật', status: 'Có mặt' },
  { id: 'att-6', studentId: 'std-001', date: '2026-08-10', type: 'Giờ Giáo Lý', status: 'Vắng có phép', notes: 'Gia đình về quê' },
];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'anc-1',
    title: 'Thông báo Khai giảng Niên khóa Giáo lý 2025 - 2026',
    content: 'Ban Giáo Lý Giáo Xứ Sơn Lộc trân trọng thông báo Thánh Lễ Khai Giảng niên khóa mới sẽ diễn ra vào lúc 07:00 Chúa Nhật ngày 07/09/2025. Kính mời quý phụ huynh và các em thiếu nhi tham dự đông đủ.',
    date: '2026-08-22',
    author: 'Trưởng ban Giáo Lý',
    targetAudience: 'Tất cả',
    type: 'event'
  },
  {
    id: 'anc-2',
    title: 'Lịch thi kết thúc Học Kỳ I các khối Khai Tâm và Rước Lễ',
    content: 'Các lớp thuộc khối Khai Tâm và Rước Lễ sẽ tiến hành kiểm tra giáo lý vấn đáp vào Chúa Nhật ngày 14/12/2025. Quý phụ huynh vui lòng nhắc nhở con em ôn tập kinh hạt và giáo lý theo sổ tay.',
    date: '2026-08-20',
    author: 'Ban Học Vụ',
    targetAudience: 'Phụ Huynh',
    type: 'exam'
  },
  {
    id: 'anc-3',
    title: 'Họp định kỳ Giáo Lý Viên tháng 09/2025',
    content: 'Kính mời toàn thể quý Thầy Cô Giáo Lý Viên tham dự buổi họp mặt lúc 19:30 Thứ Bảy tại Phòng Hội Trường Nhà Mục Vụ để thông qua giáo trình và kế hoạch giảng dạy.',
    date: '2026-08-18',
    author: 'Ban Điều Hành',
    targetAudience: 'Giáo Lý Viên',
    type: 'notice'
  }
];

export const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'usr-admin',
    name: 'Trần Thị Diễm Nga',
    holyName: 'Maria',
    role: 'admin',
    email: 'admin.giaoly@gxsonloc.vn',
    phone: '0901 234 567'
  },
  catechist: {
    id: 'usr-catechist',
    name: 'Maria Nguyễn Thị Tuyết Mai',
    holyName: 'Maria',
    role: 'catechist',
    email: 'tuyetmai.glv@gxsonloc.vn',
    phone: '0912 888 777',
    assignedClassId: 'cls-kt1'
  },
  parent: {
    id: 'usr-parent',
    name: 'Giuse Nguyễn Văn Hùng',
    holyName: 'Giuse',
    role: 'parent',
    email: 'hung.nguyen@gmail.com',
    phone: '0912 345 678',
    childStudentId: 'std-001'
  }
};
