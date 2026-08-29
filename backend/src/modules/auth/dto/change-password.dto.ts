import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'glv123', description: 'Mật khẩu hiện tại' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu hiện tại' })
  oldPassword: string;

  @ApiProperty({ example: 'newPassword123', description: 'Mật khẩu mới (tối thiểu 6 ký tự)' })
  @IsNotEmpty({ message: 'Vui lòng nhập mật khẩu mới' })
  @MinLength(6, { message: 'Mật khẩu mới phải có tối thiểu 6 ký tự' })
  newPassword: string;
}
