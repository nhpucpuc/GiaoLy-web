import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';

function mapStudentStatus(st?: string): any {
  if (!st) return 'DANG_HOC';
  if (st.includes('Nghỉ') || st === 'NGHI_HOC') return 'NGHI_HOC';
  if (st.includes('Chuyển') || st === 'CHUYEN_XU') return 'CHUYEN_XU';
  return 'DANG_HOC';
}

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(classId?: string, search?: string) {
    const where: any = {};
    if (classId) {
      where.classId = classId;
    }
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { holyName: { contains: search, mode: 'insensitive' } },
        { parentPhone: { contains: search } },
      ];
    }

    return this.prisma.student.findMany({
      where,
      include: {
        class: {
          select: { id: true, name: true, category: true },
        },
        grades: true,
      },
      orderBy: { fullName: 'asc' },
    });
  }

  async findOne(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      include: {
        class: true,
        grades: true,
        attendance: {
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Không tìm thấy học sinh có ID ${id}`);
    }

    return student;
  }

  async create(createStudentDto: any) {
    // 1. Tự động sinh mã học sinh 5 chữ số duy nhất (10001, 10002...)
    let code = createStudentDto.code;
    if (!code) {
      const latestStudent = await this.prisma.student.findFirst({
        where: { code: { not: null } },
        orderBy: { code: 'desc' },
        select: { code: true },
      });

      let nextNum = 10001;
      if (latestStudent && latestStudent.code && !isNaN(parseInt(latestStudent.code))) {
        nextNum = parseInt(latestStudent.code, 10) + 1;
      }
      code = String(nextNum).padStart(5, '0');
    }

    const data: any = {
      code,
      holyName: createStudentDto.holyName || 'Giuse',
      fullName: createStudentDto.fullName,
      gender: createStudentDto.gender || 'Nam',
      dob: createStudentDto.dob || '2016-01-01',
      pob: createStudentDto.pob || null,
      address: createStudentDto.address || 'Giáo xứ Sơn Lộc',
      parishSubdivision: createStudentDto.parishSubdivision || null,
      classId: createStudentDto.classId,
      parentName: createStudentDto.parentName || 'Phụ huynh học sinh',
      parentPhone: createStudentDto.parentPhone || '',
      fatherHolyName: createStudentDto.fatherHolyName || null,
      fatherName: createStudentDto.fatherName || null,
      fatherPhone: createStudentDto.fatherPhone || null,
      motherHolyName: createStudentDto.motherHolyName || null,
      motherName: createStudentDto.motherName || null,
      motherPhone: createStudentDto.motherPhone || null,
      baptismDate: createStudentDto.baptismDate || null,
      baptismPlace: createStudentDto.baptismPlace || null,
      eucharistDate: createStudentDto.eucharistDate || null,
      eucharistPlace: createStudentDto.eucharistPlace || null,
      confirmationDate: createStudentDto.confirmationDate || null,
      confirmationPlace: createStudentDto.confirmationPlace || null,
      solemnCommunionDate: createStudentDto.solemnCommunionDate || null,
      solemnCommunionPlace: createStudentDto.solemnCommunionPlace || null,
      status: mapStudentStatus(createStudentDto.status),
      avatar: createStudentDto.avatar || null,
      notes: createStudentDto.notes || null,
    };

    const student = await this.prisma.student.create({
      data,
    });

    // Tạo bản ghi điểm khởi tạo
    await this.prisma.gradeRecord.create({
      data: {
        studentId: student.id,
        classId: student.classId,
        academicYear: '2026 - 2027',
        hk1_tx1: null,
        hk1_tx2: null,
        hk1_thi: null,
        hk2_tx1: null,
        hk2_tx2: null,
        hk2_thi: null,
        tb_cn: null,
      },
    });

    return student;
  }

  async update(id: string, updateStudentDto: any) {
    await this.findOne(id);
    const data: any = { ...updateStudentDto };
    if (updateStudentDto.status) {
      data.status = mapStudentStatus(updateStudentDto.status);
    }
    // Remove relation objects if passed
    delete data.class;
    delete data.grades;
    delete data.attendance;
    delete data.className;

    return this.prisma.student.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.gradeRecord.deleteMany({ where: { studentId: id } });
    await this.prisma.attendance.deleteMany({ where: { studentId: id } });
    return this.prisma.student.delete({
      where: { id },
    });
  }
}
