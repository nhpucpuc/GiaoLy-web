import { Controller, Get, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { GradesService } from './grades.service';
import { BatchUpdateGradeDto } from './dto/batch-update-grade.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Grades (Bảng điểm & Xếp hạng)')
@Controller('api/grades')
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Get('class/:classId')
  @ApiOperation({ summary: 'Lấy bảng điểm của cả lớp (HK1, HK2, TB Cả năm, Xếp hạng)' })
  getGradesByClass(@Param('classId') classId: string) {
    return this.gradesService.getGradesByClass(classId);
  }

  @Get('student/:studentId/transcript')
  @ApiOperation({ summary: 'Lấy toàn bộ học bạ lịch sử các năm học của 1 học sinh' })
  getStudentTranscript(@Param('studentId') studentId: string) {
    return this.gradesService.getStudentTranscript(studentId);
  }

  @Put('batch-update')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lưu bảng điểm hàng loạt theo công thức chuẩn (Admin hoặc GLV)' })
  batchUpdate(@Body() batchDto: BatchUpdateGradeDto) {
    return this.gradesService.batchUpdate(batchDto);
  }
}
