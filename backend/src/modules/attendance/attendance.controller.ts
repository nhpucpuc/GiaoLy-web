import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AttendanceService, StudentAbsenceBatchDto } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AttendanceStatus } from '@prisma/client';

@ApiTags('Attendance (Chuyên cần & Ngày nghỉ Giáo Lý)')
@Controller('api/attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('student/:studentId')
  @ApiOperation({ summary: 'Lấy lịch sử chuyên cần của 1 học sinh' })
  getByStudent(@Param('studentId') studentId: string) {
    return this.attendanceService.getByStudent(studentId);
  }

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lấy toàn bộ chuyên cần & ngày nghỉ của cả lớp' })
  getByClass(@Param('classId') classId: string) {
    return this.attendanceService.getByClass(classId);
  }

  @Post('mark')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Điểm danh chuyên cần (Admin hoặc GLV)' })
  markAttendance(
    @Body()
    data: {
      studentId: string;
      date: string;
      status?: AttendanceStatus;
      notes?: string;
    },
  ) {
    return this.attendanceService.markAttendance(data);
  }

  @Put('batch-sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đồng bộ lưu toàn bộ số ngày nghỉ & chi tiết ngày nghỉ cả lớp' })
  batchSync(
    @Body()
    data: {
      classId: string;
      students: StudentAbsenceBatchDto[];
    },
  ) {
    return this.attendanceService.batchSyncClassAttendance(data);
  }
}
