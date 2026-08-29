import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin.giaoly@gxsonloc.vn hoặc caogiangphuongmai', description: 'Tài khoản / Email đăng nhập' })
  @IsString({ message: 'Tài khoản phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tài khoản không được để trống' })
  email: string;

  @ApiProperty({ example: 'admin123', description: 'Mật khẩu' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;
}
