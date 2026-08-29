import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceType, AttendanceStatus } from '@prisma/client';

export interface AbsenceItemDto {
  date: string;
  type?: AttendanceType;
  status: AttendanceStatus;
  notes?: string;
}

export interface StudentAbsenceBatchDto {
  studentId: string;
  absences: AbsenceItemDto[];
}

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  async getByStudent(studentId: string) {
    return this.prisma.attendance.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });
  }

  async getByClass(classId: string) {
    return this.prisma.attendance.findMany({
      where: {
        student: { classId },
      },
      include: {
        student: {
          select: {
            id: true,
            holyName: true,
            fullName: true,
            gender: true,
            code: true,
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async markAttendance(data: {
    studentId: string;
    date: string;
    type?: AttendanceType;
    status?: AttendanceStatus;
    notes?: string;
  }) {
    return this.prisma.attendance.create({
      data: {
        studentId: data.studentId,
        date: data.date,
        type: data.type || AttendanceType.LE_CHUA_NHAT,
        status: data.status || AttendanceStatus.VANG_CO_PHEP,
        notes: data.notes || '',
      },
    });
  }

  async batchSyncClassAttendance(data: {
    classId: string;
    students: StudentAbsenceBatchDto[];
  }) {
    const { classId, students } = data;

    // Lấy tất cả studentIds thuộc lớp này
    const studentIds = students.map((s) => s.studentId);

    // Xóa tất cả điểm danh cũ của các học sinh này để đồng bộ lại
    if (studentIds.length > 0) {
      await this.prisma.attendance.deleteMany({
        where: {
          studentId: { in: studentIds },
        },
      });
    }

    // Chuẩn bị danh sách bản ghi mới cần insert
    const recordsToInsert: {
      studentId: string;
      date: string;
      type: AttendanceType;
      status: AttendanceStatus;
      notes?: string;
    }[] = [];

    for (const student of students) {
      for (const abs of student.absences) {
        if (abs.date && abs.date.trim() !== '') {
          recordsToInsert.push({
            studentId: student.studentId,
            date: abs.date.trim(),
            type: abs.type || AttendanceType.LE_CHUA_NHAT,
            status: abs.status || AttendanceStatus.VANG_CO_PHEP,
            notes: abs.notes || '',
          });
        }
      }
    }

    if (recordsToInsert.length > 0) {
      await this.prisma.attendance.createMany({
        data: recordsToInsert,
      });
    }

    return {
      success: true,
      message: `Đã lưu thành công ${recordsToInsert.length} bản ghi ngày nghỉ cho ${students.length} học sinh!`,
      savedCount: recordsToInsert.length,
    };
  }
}
