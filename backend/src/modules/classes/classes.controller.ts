import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Classes (Quản lý Lớp học)')
@Controller('api/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách tất cả các lớp học' })
  @ApiQuery({ name: 'session', required: false, enum: ['SANG', 'TOI'], description: 'Lọc theo ca học Sáng / Tối' })
  @ApiQuery({ name: 'academicYear', required: false, description: 'Lọc theo niên khóa (VD: 2026 - 2027)' })
  findAll(@Query('session') session?: string, @Query('academicYear') academicYear?: string) {
    return this.classesService.findAll(session, academicYear);
  }

  @Get('academic-years')
  @ApiOperation({ summary: 'Lấy danh sách tất cả các niên khóa có trong hệ thống' })
  getAcademicYears() {
    return this.classesService.getAcademicYears();
  }

  @Post('promote-academic-year')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Khởi tạo niên khóa mới và tự động xét lên lớp cho học sinh (Chỉ Admin)' })
  promoteAcademicYear(@Body() body: { fromYear: string; toYear: string }) {
    return this.classesService.promoteAcademicYear(body.fromYear, body.toYear);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy thông tin chi tiết 1 lớp học kèm danh sách học sinh & điểm' })
  findOne(@Param('id') id: string) {
    return this.classesService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo mới lớp học (Chỉ Admin)' })
  create(@Body() createClassDto: CreateClassDto) {
    return this.classesService.create(createClassDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật thông tin lớp học (Chỉ Admin)' })
  update(@Param('id') id: string, @Body() updateClassDto: Partial<CreateClassDto>) {
    return this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa lớp học (Chỉ Admin)' })
  remove(@Param('id') id: string) {
    return this.classesService.remove(id);
  }
}
