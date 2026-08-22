import { IsString, IsNotEmpty, IsInt, IsIn, IsOptional, Min } from 'class-validator';

export class CreateBadgeDto {
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  iconUrl: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  xpValue?: number;

  @IsIn(['ECOLOGY', 'ACADEMIC', 'COMMUNITY', 'STREAK', 'SPECIAL'])
  @IsOptional()
  category?: 'ECOLOGY' | 'ACADEMIC' | 'COMMUNITY' | 'STREAK' | 'SPECIAL';

  @IsIn(['STREAK', 'TOTAL_XP', 'LESSONS_COMPLETED', 'QUIZZES_PASSED', 'MISSIONS_APPROVED', 'MANUAL'])
  @IsOptional()
  triggerEvent?: 'STREAK' | 'TOTAL_XP' | 'LESSONS_COMPLETED' | 'QUIZZES_PASSED' | 'MISSIONS_APPROVED' | 'MANUAL';

  @IsInt()
  @Min(0)
  @IsOptional()
  triggerValue?: number;
}
