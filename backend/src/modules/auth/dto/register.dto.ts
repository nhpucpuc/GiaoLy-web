import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';

export class RegisterDto {
  @ApiProperty({ example: 'tuyetmai hoặc tuyetmai@gxsonloc.vn', description: 'Tài khoản / Email đăng ký' })
  @IsString({ message: 'Tài khoản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Thị Tuyết Mai', description: 'Họ và tên' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'Maria', description: 'Tên Thánh', required: false })
  @IsOptional()
  holyName?: string;

  @ApiProperty({ enum: UserRole, default: UserRole.PARENT, description: 'Vai trò (ADMIN, CATECHIST, PARENT)' })
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: '0912345678', required: false })
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'cls-kt1', description: 'ID lớp phụ trách nếu là GLV', required: false })
  @IsOptional()
  assignedClassId?: string;
}
