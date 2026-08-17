import { IsEnum, IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class ReviewMissionDto {
  @IsEnum(['APPROVED', 'REJECTED'])
  @IsNotEmpty()
  status!: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  feedback?: string;
}
