import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class SingleStudentGradeDto {
  @ApiProperty({ example: 'std-001' })
  @IsNotEmpty()
  studentId: string;

  @ApiProperty({ example: 8.5, required: false })
  @IsOptional()
  hk1_tx1?: number;

  @ApiProperty({ example: 9.0, required: false })
  @IsOptional()
  hk1_tx2?: number;

  @ApiProperty({ example: 9.0, required: false })
  @IsOptional()
  hk1_thi?: number;

  @ApiProperty({ example: 8.5, required: false })
  @IsOptional()
  hk2_tx1?: number;

  @ApiProperty({ example: 9.0, required: false })
  @IsOptional()
  hk2_tx2?: number;

  @ApiProperty({ example: 9.0, required: false })
  @IsOptional()
  hk2_thi?: number;

  @ApiProperty({ example: 'Em học tập tốt, đi lễ siêng năng', required: false })
  @IsOptional()
  notes?: string;
}

export class BatchUpdateGradeDto {
  @ApiProperty({ example: 'cls-kt1' })
  @IsNotEmpty()
  classId: string;

  @ApiProperty({ type: [SingleStudentGradeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleStudentGradeDto)
  grades: SingleStudentGradeDto[];
}
