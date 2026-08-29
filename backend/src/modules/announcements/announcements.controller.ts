import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Announcements (Thông báo xứ đoàn)')
@Controller('api/announcements')
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thông báo giáo xứ' })
  @ApiQuery({ name: 'audience', required: false, description: 'Lọc theo đối tượng (Tất cả, Phụ Huynh, Giáo Lý Viên, Ban Giáo Lý)' })
  findAll(@Query('audience') audience?: string) {
    return this.announcementsService.findAll(audience);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Tạo thông báo mới (Chỉ Admin)' })
  create(
    @Body()
    data: {
      title: string;
      content: string;
      author: string;
      targetAudience: string;
      type: string;
      date: string;
    },
  ) {
    return this.announcementsService.create(data);
  }
}
