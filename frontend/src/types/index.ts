export type UserRole = 'public' | 'admin' | 'catechist' | 'parent';

export interface User {
  id: string;
  name: string;
  holyName?: string;
  role: UserRole;
  email: string;
  rawPassword?: string;
  phone?: string;
  avatar?: string;
  assignedClassId?: string;
  childStudentId?: string; // For parent
}

export type ClassCategory = 'Khai Tâm' | 'Xưng Tội' | 'Rước Lễ' | 'Thêm Sức' | 'Bao Đồng' | 'Vào Đời';

export interface ClassRoom {
  id: string;
  name: string;
  category: ClassCategory;
  catechistLeader: string; // Tên GLV phụ trách chính
  catechistAssists?: string[]; // Danh sách GLV phụ tá
  roomNumber: string;
  academicYear: string;
  studentCount: number;
  schedule: string;
  session?: 'Sáng' | 'Tối';
  description?: string;
}

export interface Student {
  id: string;
  code?: string; // Mã học sinh 5 chữ số: 10001, 10002...
  holyName: string; // Tên Thánh (Maria, Giuse, Phêrô, Têrêsa...)
  fullName: string;
  gender: 'Nam' | 'Nữ';
  dob: string;
  pob?: string; // Nơi sinh
  parishSubdivision?: string; // Giáo khu
  address: string;
  baptismDate?: string;
  baptismPlace?: string;
  eucharistDate?: string;
  eucharistPlace?: string;
  confirmationDate?: string;
  confirmationPlace?: string;
  solemnCommunionDate?: string;
  solemnCommunionPlace?: string;
  classId: string;
  className?: string;
  parentName: string;
  parentPhone: string;
  fatherHolyName?: string;
  fatherName?: string;
  fatherPhone?: string;
  motherHolyName?: string;
  motherName?: string;
  motherPhone?: string;
  status: 'Đang học' | 'Nghỉ học' | 'Chuyển xứ' | string;
  avatar?: string;
  notes?: string;
}

export type ConductType = 'Xuất sắc' | 'Giỏi' | 'Khá' | 'Trung bình' | 'Cần cố gắng';

export interface GradeRecord {
  id: string;
  studentId: string;
  classId: string;
  academicYear?: string;
  hk1_tx1?: number | null;
  hk1_tx2?: number | null;
  hk1_thi?: number | null;
  hk1_tb?: number | null;
  hk1_rank?: number | null;
  hk2_tx1?: number | null;
  hk2_tx2?: number | null;
  hk2_thi?: number | null;
  hk2_tb?: number | null;
  hk2_rank?: number | null;
  tb_cn?: number | null;
  cn_rank?: number | null;
  result?: string | null;
  conduct?: string | null;
  notes?: string | null;
  lastUpdated?: string;
  // Legacy optional fields for backward compatibility
  oralScore?: number;
  test15m?: number;
  test45m?: number;
  semesterExam?: number;
  attendanceScore?: number;
  finalScore?: number;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  type: 'Lễ Chúa Nhật' | 'Giờ Giáo Lý';
  status: 'Có mặt' | 'Vắng có phép' | 'Vắng không phép';
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
  targetAudience: 'Tất cả' | 'Ban Giáo Lý' | 'Giáo Lý Viên' | 'Phụ Huynh';
  type: 'event' | 'notice' | 'exam' | 'urgent';
}
