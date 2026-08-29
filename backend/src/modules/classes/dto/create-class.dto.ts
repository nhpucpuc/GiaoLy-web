import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsEnum, IsArray } from 'class-validator';
import { ClassCategory, SessionType } from '@prisma/client';

export class CreateClassDto {
  @ApiProperty({ example: 'Khai Tâm 1A', description: 'Tên lớp học' })
  @IsNotEmpty({ message: 'Tên lớp không được để trống' })
  name: string;

  @ApiProperty({ example: 'Khai Tâm', description: 'Khối lớp (Khai Tâm, Rước Lễ, Thêm Sức, Bao Đồng, Vào Đời)' })
  @IsNotEmpty({ message: 'Khối lớp không được để trống' })
  category: any;

  @ApiProperty({ example: 'Maria Nguyễn Thị Tuyết Mai', description: 'GLV phụ trách chính' })
  @IsNotEmpty({ message: 'Tên GLV phụ trách không được để trống' })
  catechistLeader: string;

  @ApiProperty({ example: ['Giuse Trần Văn Bình'], required: false, type: [String] })
  @IsOptional()
  @IsArray()
  catechistAssists?: string[];

  @ApiProperty({ example: 'Phòng 101 - Nhà Mục Vụ', required: false })
  @IsOptional()
  roomNumber?: string;

  @ApiProperty({ example: '2025 - 2026', default: '2025 - 2026' })
  @IsOptional()
  academicYear?: string;

  @ApiProperty({ example: 'Chúa Nhật | 07:30 - 08:45 (Sáng)', default: 'Chúa Nhật | 07:30 - 08:45' })
  @IsOptional()
  schedule?: string;

  @ApiProperty({ example: 'Sáng', description: 'Ca học (Sáng / Tối)' })
  @IsOptional()
  session?: any;

  @ApiProperty({ example: 'Lớp vỡ lòng tiếp cận đức tin cơ bản', required: false })
  @IsOptional()
  description?: string;
}
