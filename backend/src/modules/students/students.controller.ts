import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Students (Quản lý Học sinh & Bí tích)')
@Controller('api/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách học sinh (có filter theo lớp hoặc tìm kiếm tên/SĐT)' })
  @ApiQuery({ name: 'classId', required: false, description: 'Lọc theo ID lớp học' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm theo Tên Thánh, Họ Tên hoặc SĐT Phụ Huynh' })
  findAll(@Query('classId') classId?: string, @Query('search') search?: string) {
    return this.studentsService.findAll(classId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết hồ sơ học sinh, học bạ, lịch sử chuyên cần & bí tích' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm mới học sinh vào lớp (Admin hoặc GLV)' })
  create(@Body() createStudentDto: CreateStudentDto) {
    return this.studentsService.create(createStudentDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin học sinh (Admin hoặc GLV)' })
  update(@Param('id') id: string, @Body() updateStudentDto: Partial<CreateStudentDto>) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'CATECHIST')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa học sinh khỏi hệ thống (Admin hoặc GLV)' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }
}
