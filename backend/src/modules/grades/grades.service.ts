import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchUpdateGradeDto, SingleStudentGradeDto } from './dto/batch-update-grade.dto';

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // Helper: Tính toán điểm trung bình & hạnh kiểm chuẩn GLV
  calculateGrade(g: SingleStudentGradeDto) {
    let hk1_tb: number | null = null;
    if (g.hk1_tx1 != null && g.hk1_tx2 != null && g.hk1_thi != null) {
      const tb_tx1 = (Number(g.hk1_tx1) + Number(g.hk1_tx2)) / 2;
      hk1_tb = Number(((tb_tx1 + Number(g.hk1_thi)) / 2).toFixed(1));
    }

    let hk2_tb: number | null = null;
    if (g.hk2_tx1 != null && g.hk2_tx2 != null && g.hk2_thi != null) {
      const tb_tx2 = (Number(g.hk2_tx1) + Number(g.hk2_tx2)) / 2;
      hk2_tb = Number(((tb_tx2 + Number(g.hk2_thi)) / 2).toFixed(1));
    }

    let tb_cn: number | null = null;
    if (hk1_tb != null && hk2_tb != null) {
      tb_cn = Number(((hk1_tb + hk2_tb) / 2).toFixed(1));
    }

    let result = '—';
    let conduct = 'Khá';
    if (tb_cn != null) {
      result = tb_cn >= 5.0 ? 'Lên lớp' : 'Chưa đạt';
      if (tb_cn >= 9.0) conduct = 'Xuất sắc';
      else if (tb_cn >= 8.0) conduct = 'Giỏi';
      else if (tb_cn >= 6.5) conduct = 'Khá';
      else if (tb_cn >= 5.0) conduct = 'Trung bình';
      else conduct = 'Cần cố gắng';
    }

    return { hk1_tb, hk2_tb, tb_cn, result, conduct };
  }

  async getGradesByClass(classId: string) {
    const cls = await this.prisma.classRoom.findUnique({ where: { id: classId } });
    const academicYear = cls?.academicYear || '2026 - 2027';

    const grades = await this.prisma.gradeRecord.findMany({
      where: {
        classId,
        academicYear,
      },
      include: {
        student: {
          select: {
            id: true,
            holyName: true,
            fullName: true,
            gender: true,
            avatar: true,
          },
        },
      },
      orderBy: { student: { fullName: 'asc' } },
    });

    return grades;
  }

  async getStudentTranscript(studentId: string) {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
      include: {
        class: true,
      },
    });

    if (!student) {
      throw new NotFoundException(`Không tìm thấy học sinh có ID ${studentId}`);
    }

    const records = await this.prisma.gradeRecord.findMany({
      where: { studentId },
      include: {
        class: {
          select: { id: true, name: true, category: true, roomNumber: true },
        },
      },
      orderBy: { academicYear: 'asc' },
    });

    return {
      student,
      transcript: records.map((r) => ({
        ...r,
        className: r.class?.name || 'Chưa rõ',
      })),
    };
  }

  async batchUpdate(batchDto: BatchUpdateGradeDto) {
    const { classId, grades } = batchDto;

    const cls = await this.prisma.classRoom.findUnique({ where: { id: classId } });
    const academicYear = cls?.academicYear || '2026 - 2027';

    // 1. Tính toán điểm cho tất cả học sinh được gửi lên
    const calculatedList = grades.map((g) => {
      const calc = this.calculateGrade(g);
      return {
        ...g,
        ...calc,
      };
    });

    // 2. Tính xếp hạng HK1
    const sortedHK1 = [...calculatedList]
      .filter((x) => x.hk1_tb != null)
      .sort((a, b) => (b.hk1_tb || 0) - (a.hk1_tb || 0));
    const hk1RankMap = new Map<string, number>();
    sortedHK1.forEach((item, idx) => hk1RankMap.set(item.studentId, idx + 1));

    // 3. Tính xếp hạng HK2
    const sortedHK2 = [...calculatedList]
      .filter((x) => x.hk2_tb != null)
      .sort((a, b) => (b.hk2_tb || 0) - (a.hk2_tb || 0));
    const hk2RankMap = new Map<string, number>();
    sortedHK2.forEach((item, idx) => hk2RankMap.set(item.studentId, idx + 1));

    // 4. Tính xếp hạng Cả Năm
    const sortedCN = [...calculatedList]
      .filter((x) => x.tb_cn != null)
      .sort((a, b) => (b.tb_cn || 0) - (a.tb_cn || 0));
    const cnRankMap = new Map<string, number>();
    sortedCN.forEach((item, idx) => cnRankMap.set(item.studentId, idx + 1));

    const now = new Date();

    // 5. Lưu vào Database (Upsert từng bản ghi theo academicYear chính xác)
    const updatePromises = calculatedList.map((item) => {
      const hk1_rank = hk1RankMap.get(item.studentId) || null;
      const hk2_rank = hk2RankMap.get(item.studentId) || null;
      const cn_rank = cnRankMap.get(item.studentId) || null;

      return this.prisma.gradeRecord.upsert({
        where: {
          studentId_classId_academicYear: {
            studentId: item.studentId,
            classId: classId,
            academicYear: academicYear,
          },
        },
        create: {
          studentId: item.studentId,
          classId: classId,
          academicYear: academicYear,
          hk1_tx1: item.hk1_tx1 != null ? Number(item.hk1_tx1) : null,
          hk1_tx2: item.hk1_tx2 != null ? Number(item.hk1_tx2) : null,
          hk1_thi: item.hk1_thi != null ? Number(item.hk1_thi) : null,
          hk1_tb: item.hk1_tb,
          hk1_rank,
          hk2_tx1: item.hk2_tx1 != null ? Number(item.hk2_tx1) : null,
          hk2_tx2: item.hk2_tx2 != null ? Number(item.hk2_tx2) : null,
          hk2_thi: item.hk2_thi != null ? Number(item.hk2_thi) : null,
          hk2_tb: item.hk2_tb,
          hk2_rank,
          tb_cn: item.tb_cn,
          cn_rank,
          result: item.result,
          conduct: item.conduct,
          notes: item.notes,
          createdAt: now,
          updatedAt: now,
        },
        update: {
          hk1_tx1: item.hk1_tx1 != null ? Number(item.hk1_tx1) : null,
          hk1_tx2: item.hk1_tx2 != null ? Number(item.hk1_tx2) : null,
          hk1_thi: item.hk1_thi != null ? Number(item.hk1_thi) : null,
          hk1_tb: item.hk1_tb,
          hk1_rank,
          hk2_tx1: item.hk2_tx1 != null ? Number(item.hk2_tx1) : null,
          hk2_tx2: item.hk2_tx2 != null ? Number(item.hk2_tx2) : null,
          hk2_thi: item.hk2_thi != null ? Number(item.hk2_thi) : null,
          hk2_tb: item.hk2_tb,
          hk2_rank,
          tb_cn: item.tb_cn,
          cn_rank,
          result: item.result,
          conduct: item.conduct,
          notes: item.notes,
          updatedAt: now,
        },
      });
    });

    await Promise.all(updatePromises);

    return {
      message: 'Cập nhật bảng điểm thành công!',
      count: calculatedList.length,
    };
  }
}
