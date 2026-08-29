import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { StudentStatus } from '@prisma/client';

export class CreateStudentDto {
  @ApiProperty({ example: 'Maria', description: 'Tên Thánh' })
  @IsNotEmpty({ message: 'Tên Thánh không được để trống' })
  holyName: string;

  @ApiProperty({ example: 'Nguyễn Mai Lan', description: 'Họ và tên' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'Nữ', enum: ['Nam', 'Nữ'] })
  @IsNotEmpty({ message: 'Giới tính không được để trống' })
  gender: string;

  @ApiProperty({ example: '2016-05-14', description: 'Ngày sinh (YYYY-MM-DD)' })
  @IsNotEmpty({ message: 'Ngày sinh không được để trống' })
  dob: string;

  @ApiProperty({ example: '2016-06-10', required: false })
  @IsOptional()
  baptismDate?: string;

  @ApiProperty({ example: 'GX Sơn Lộc', required: false })
  @IsOptional()
  baptismPlace?: string;

  @ApiProperty({ example: '2024-06-02', required: false })
  @IsOptional()
  eucharistDate?: string;

  @ApiProperty({ example: null, required: false })
  @IsOptional()
  confirmationDate?: string;

  @ApiProperty({ example: 'cls-kt1', description: 'ID lớp học' })
  @IsNotEmpty({ message: 'Lớp học không được để trống' })
  classId: string;

  @ApiProperty({ example: 'Giuse Nguyễn Văn Hùng' })
  @IsNotEmpty({ message: 'Tên phụ huynh không được để trống' })
  parentName: string;

  @ApiProperty({ example: '0912 345 678' })
  @IsNotEmpty({ message: 'Số điện thoại phụ huynh không được để trống' })
  parentPhone: string;

  @ApiProperty({ example: 'Đang học', required: false })
  @IsOptional()
  status?: any;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=150', required: false })
  @IsOptional()
  avatar?: string;

  @ApiProperty({ example: 'Học tập chăm chỉ, hát lễ tốt', required: false })
  @IsOptional()
  notes?: string;
}
