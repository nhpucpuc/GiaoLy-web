import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';

function mapCategory(cat: string): any {
  if (!cat) return 'KHAI_TAM';
  if (cat.includes('Khai Tâm') || cat === 'KHAI_TAM') return 'KHAI_TAM';
  if (cat.includes('Xưng Tội') || cat === 'XUNG_TOI') return 'XUNG_TOI';
  if (cat.includes('Rước Lễ') || cat === 'RUOC_LE') return 'RUOC_LE';
  if (cat.includes('Thêm Sức') || cat === 'THEM_SUC') return 'THEM_SUC';
  if (cat.includes('Bao Đồng') || cat === 'BAO_DONG') return 'BAO_DONG';
  if (cat.includes('Vào Đời') || cat === 'VAO_DOI') return 'VAO_DOI';
  return 'KHAI_TAM';
}

function mapSession(s: string): any {
  if (!s) return 'SANG';
  if (typeof s === 'string' && (s.toLowerCase().includes('tối') || s.toUpperCase() === 'TOI')) return 'TOI';
  return 'SANG';
}

function formatCategory(cat: string): string {
  switch (cat) {
    case 'KHAI_TAM': return 'Khai Tâm';
    case 'XUNG_TOI': return 'Xưng Tội';
    case 'RUOC_LE': return 'Rước Lễ';
    case 'THEM_SUC': return 'Thêm Sức';
    case 'BAO_DONG': return 'Bao Đồng';
    case 'VAO_DOI': return 'Vào Đời';
    default: return cat;
  }
}

function formatSession(s: string): string {
  return s === 'TOI' ? 'Tối' : 'Sáng';
}

function formatCatechistName(holyName?: string | null, fullName?: string | null): string {
  const holy = (holyName || '').trim();
  const full = (fullName || '').trim();
  if (!holy || holy === 'Giáo Lý Viên') return full;
  if (!full) return holy;
  if (holy === full) return full;
  if (full.toLowerCase().startsWith(holy.toLowerCase())) return full;
  return `${holy} ${full}`;
}

@Injectable()
export class ClassesService {
  constructor(private prisma: PrismaService) {}

  async findAll(session?: string, academicYear?: string) {
    const where: any = {};
    if (session) {
      where.session = session.toUpperCase() === 'TOI' || session.toLowerCase().includes('tối') ? 'TOI' : 'SANG';
    }
    if (academicYear) {
      where.academicYear = academicYear;
    }

    const classes = await this.prisma.classRoom.findMany({
      where,
      include: {
        _count: {
          select: { students: true },
        },
        leaderUser: {
          where: { role: 'CATECHIST' },
          select: { id: true, fullName: true, holyName: true, phone: true },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return classes.map((c) => {
      const glvs = (c.leaderUser || []).map((u) => formatCatechistName(u.holyName, u.fullName));
      const assists = Array.from(
        new Set([...(c.catechistAssists || []), ...glvs.slice(1)])
      ).filter((name) => name && name !== (glvs[0] || c.catechistLeader));

      return {
        ...c,
        catechistLeader: glvs[0] || c.catechistLeader || 'Chưa phân công',
        catechistAssists: assists,
        category: formatCategory(c.category),
        session: formatSession(c.session),
        studentCount: c._count.students,
      };
    });
  }

  async getAcademicYears() {
    const fromClasses = await this.prisma.classRoom.findMany({
      select: { academicYear: true },
      distinct: ['academicYear'],
    });
    const fromGrades = await this.prisma.gradeRecord.findMany({
      select: { academicYear: true },
      distinct: ['academicYear'],
    });

    const years = Array.from(
      new Set([...fromClasses.map((c) => c.academicYear), ...fromGrades.map((g) => g.academicYear)])
    ).filter(Boolean).sort();

    if (!years.includes('2026 - 2027')) {
      years.unshift('2026 - 2027');
    }
    return years;
  }

  // Tự động phân cấp lớp kế tiếp
  getNextClassName(currentName: string): { nextName: string | null; isGraduated: boolean } {
    const trimmed = currentName.trim();

    const progressionMap: Record<string, string> = {
      'Khai Tâm 1A': 'Khai Tâm 2A',
      'Khai Tâm 1B': 'Khai Tâm 2B',
      'Khai Tâm Chiều T2,4,5': 'Khai Tâm 2A',
      'Khai Tâm 2A': 'XƯNG TỘI 1A',
      'Khai Tâm 2B': 'XƯNG TỘI 1B',
      'XƯNG TỘI 1A': 'XƯNG TỘI 2A',
      'XƯNG TỘI 1B': 'XƯNG TỘI 2B',
      'XƯNG TỘI 2A': 'THÊM SỨC 1A',
      'XƯNG TỘI 2B': 'THÊM SỨC 1B',
      'THÊM SỨC 1A': 'THÊM SỨC 2A',
      'THÊM SỨC 1B': 'THÊM SỨC 2B',
      'THÊM SỨC 2A': 'THÊM SỨC 3A',
      'THÊM SỨC 2B': 'THÊM SỨC 3B',
      'THÊM SỨC 3A': 'BAO ĐỒNG 1A',
      'THÊM SỨC 3B': 'BAO ĐỒNG 1B',
      'BAO ĐỒNG 1A': 'BAO ĐỒNG 2A',
      'BAO ĐỒNG 1B': 'BAO ĐỒNG 2B',
      'BAO ĐỒNG 2A': 'BAO ĐỒNG 3A',
      'BAO ĐỒNG 2B': 'BAO ĐỒNG 3B',
      'BAO ĐỒNG 3A': 'VÀO ĐỜI 1',
      'BAO ĐỒNG 3B': 'VÀO ĐỜI 1',
      'VÀO ĐỜI 1': 'VÀO ĐỜI 2',
    };

    if (trimmed.toUpperCase() === 'VÀO ĐỜI 2' || trimmed.toUpperCase() === 'VAO DOI 2') {
      return { nextName: null, isGraduated: true };
    }

    const next = progressionMap[trimmed];
    return { nextName: next || null, isGraduated: false };
  }

  // Xét Lên Lớp & Khởi Tạo Niên Khóa Mới
  async promoteAcademicYear(fromYear: string, toYear: string) {
    if (!fromYear || !toYear || fromYear === toYear) {
      throw new Error('Niên khóa nguồn và niên khóa đích không hợp lệ!');
    }

    // 1. Lấy tất cả các lớp của niên khóa nguồn
    const sourceClasses = await this.prisma.classRoom.findMany({
      where: { academicYear: fromYear },
      include: {
        students: {
          include: {
            grades: {
              where: { academicYear: fromYear },
            },
          },
        },
      },
    });

    if (sourceClasses.length === 0) {
      throw new NotFoundException(`Không tìm thấy lớp học nào trong niên khóa ${fromYear}`);
    }

    // 2. Tạo hoặc lấy danh sách các lớp cho niên khóa đích
    const targetClassesMap = new Map<string, any>();
    let createdClassCount = 0;

    for (const srcCls of sourceClasses) {
      let targetCls = await this.prisma.classRoom.findFirst({
        where: { name: srcCls.name, academicYear: toYear },
      });

      if (!targetCls) {
        targetCls = await this.prisma.classRoom.create({
          data: {
            name: srcCls.name,
            category: srcCls.category,
            catechistLeader: srcCls.catechistLeader,
            catechistAssists: srcCls.catechistAssists,
            roomNumber: srcCls.roomNumber,
            academicYear: toYear,
            schedule: srcCls.schedule,
            session: srcCls.session,
            description: `Niên khóa ${toYear}`,
          },
        });
        createdClassCount++;
      }
      targetClassesMap.set(targetCls.name, targetCls);
    }

    // 3. Phân bổ học sinh lên lớp mới
    let promotedCount = 0;
    let graduatedCount = 0;
    let retainedCount = 0;

    const now = new Date();

    for (const srcCls of sourceClasses) {
      for (const student of srcCls.students) {
        const studentGrade = student.grades[0];
        const isPassed = studentGrade?.result !== 'Chưa đạt'; // Mặc định nếu chưa có kết quả hoặc lên lớp

        if (!isPassed) {
          // Chưa đạt: Giữ lại lớp cũ ở năm học mới
          const sameLevelTargetCls = targetClassesMap.get(srcCls.name);
          if (sameLevelTargetCls) {
            await this.prisma.student.update({
              where: { id: student.id },
              data: { classId: sameLevelTargetCls.id },
            });
            await this.prisma.gradeRecord.upsert({
              where: {
                studentId_classId_academicYear: {
                  studentId: student.id,
                  classId: sameLevelTargetCls.id,
                  academicYear: toYear,
                },
              },
              create: {
                studentId: student.id,
                classId: sameLevelTargetCls.id,
                academicYear: toYear,
                createdAt: now,
                updatedAt: now,
              },
              update: {},
            });
            retainedCount++;
          }
          continue;
        }

        // Đạt điều kiện: Tiến hành chuyển lên lớp tiếp theo
        const { nextName, isGraduated } = this.getNextClassName(srcCls.name);

        if (isGraduated) {
          // Tốt nghiệp Vào Đời 2
          await this.prisma.student.update({
            where: { id: student.id },
            data: { status: 'CHUYEN_XU' }, // Trạng thái đã hoàn tất chương trình
          });
          graduatedCount++;
        } else if (nextName) {
          const nextTargetCls = targetClassesMap.get(nextName);
          if (nextTargetCls) {
            await this.prisma.student.update({
              where: { id: student.id },
              data: { classId: nextTargetCls.id },
            });

            await this.prisma.gradeRecord.upsert({
              where: {
                studentId_classId_academicYear: {
                  studentId: student.id,
                  classId: nextTargetCls.id,
                  academicYear: toYear,
                },
              },
              create: {
                studentId: student.id,
                classId: nextTargetCls.id,
                academicYear: toYear,
                createdAt: now,
                updatedAt: now,
              },
              update: {},
            });

            promotedCount++;
          }
        }
      }
    }

    return {
      message: `Khởi tạo niên khóa ${toYear} và xét lên lớp hoàn tất!`,
      fromYear,
      toYear,
      newClassesCreated: createdClassCount,
      promotedCount,
      graduatedCount,
      retainedCount,
    };
  }

  async findOne(id: string) {
    const classRoom = await this.prisma.classRoom.findUnique({
      where: { id },
      include: {
        leaderUser: {
          where: { role: 'CATECHIST' },
          select: { id: true, fullName: true, holyName: true, phone: true },
          orderBy: { createdAt: 'asc' },
        },
        students: {
          orderBy: { fullName: 'asc' },
          include: {
            grades: {
              where: { classId: id },
            },
          },
        },
      },
    });

    if (!classRoom) {
      throw new NotFoundException(`Không tìm thấy lớp học có ID ${id}`);
    }

    const glvs = (classRoom.leaderUser || []).map((u) => formatCatechistName(u.holyName, u.fullName));
    const assists = Array.from(
      new Set([...(classRoom.catechistAssists || []), ...glvs.slice(1)])
    ).filter((name) => name && name !== (glvs[0] || classRoom.catechistLeader));

    return {
      ...classRoom,
      catechistLeader: glvs[0] || classRoom.catechistLeader || 'Chưa phân công',
      catechistAssists: assists,
      category: formatCategory(classRoom.category),
      session: formatSession(classRoom.session),
      studentCount: classRoom.students.length,
    };
  }

  async create(createClassDto: CreateClassDto) {
    return this.prisma.classRoom.create({
      data: {
        name: createClassDto.name,
        category: mapCategory(createClassDto.category),
        catechistLeader: createClassDto.catechistLeader,
        catechistAssists: createClassDto.catechistAssists || [],
        roomNumber: createClassDto.roomNumber || 'Phòng 101',
        academicYear: createClassDto.academicYear || '2025 - 2026',
        schedule: createClassDto.schedule || 'Chúa Nhật | 07:30 - 08:45',
        session: mapSession(createClassDto.session),
        description: createClassDto.description,
      },
    });
  }

  async update(id: string, updateClassDto: Partial<CreateClassDto>) {
    const data: any = { ...updateClassDto };
    if (updateClassDto.category) {
      data.category = mapCategory(updateClassDto.category);
    }
    if (updateClassDto.session) {
      data.session = mapSession(updateClassDto.session);
    }

    return this.prisma.classRoom.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.classRoom.delete({
      where: { id },
    });
  }
}
