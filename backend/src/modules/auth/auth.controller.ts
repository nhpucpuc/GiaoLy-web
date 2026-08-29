import { Controller, Post, Put, Delete, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth (Xác thực & Phân quyền)')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống (Admin, GLV, Phụ Huynh)' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về JWT AccessToken' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký tài khoản thành công' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy thông tin tài khoản đang đăng nhập hiện tại' })
  @ApiResponse({ status: 200, description: 'Thông tin tài khoản' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập / Token hết hạn' })
  getProfile(@CurrentUser() user: any) {
    return this.authService.getProfile(user.id);
  }

  @Put('change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đổi mật khẩu cho tài khoản đang đăng nhập' })
  @ApiResponse({ status: 200, description: 'Đổi mật khẩu thành công' })
  @ApiResponse({ status: 400, description: 'Mật khẩu cũ không chính xác' })
  changePassword(
    @CurrentUser() user: any,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(user.id, changePasswordDto);
  }

  @Get('catechists')
  @ApiOperation({ summary: 'Lấy danh sách tất cả Giáo Lý Viên trong Giáo xứ' })
  @ApiResponse({ status: 200, description: 'Danh sách Giáo Lý Viên kèm lớp phụ trách' })
  getAllCatechists() {
    return this.authService.getAllCatechists();
  }

  @Post('catechists')
  @ApiOperation({ summary: 'Thêm mới Giáo Lý Viên vào hệ thống' })
  @ApiResponse({ status: 201, description: 'Tạo tài khoản Giáo Lý Viên thành công' })
  createCatechist(@Body() body: any) {
    return this.authService.createCatechist(body);
  }

  @Put('catechists/:id/assign-class')
  @ApiOperation({ summary: 'Phân công lớp giáo lý cho Giáo Lý Viên' })
  @ApiResponse({ status: 200, description: 'Phân công lớp thành công và đồng bộ tên GLV lên lớp học' })
  assignClass(
    @Param('id') id: string,
    @Body('classId') classId: string | null,
  ) {
    return this.authService.assignClassToCatechist(id, classId);
  }

  @Delete('catechists/:id')
  @ApiOperation({ summary: 'Xóa tài khoản Giáo Lý Viên' })
  @ApiResponse({ status: 200, description: 'Xóa Giáo Lý Viên thành công' })
  deleteCatechist(@Param('id') id: string) {
    return this.authService.deleteCatechist(id);
  }
}
