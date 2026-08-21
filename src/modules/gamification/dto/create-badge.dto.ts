import { IsString, IsNotEmpty, IsUrl, IsInt, IsEnum, IsOptional, Min } from 'class-validator';

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

  @IsUrl()
  @IsNotEmpty()
  iconUrl: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  xpValue?: number;

  @IsEnum(['ACADEMIC', 'COMMUNITY', 'STREAK', 'SPECIAL'])
  @IsOptional()
  category?: 'ACADEMIC' | 'COMMUNITY' | 'STREAK' | 'SPECIAL';

  @IsEnum(['STREAK', 'TOTAL_XP', 'LESSONS_COMPLETED', 'QUIZZES_PASSED', 'MISSIONS_APPROVED', 'MANUAL'])
  @IsOptional()
  triggerEvent?: 'STREAK' | 'TOTAL_XP' | 'LESSONS_COMPLETED' | 'QUIZZES_PASSED' | 'MISSIONS_APPROVED' | 'MANUAL';

  @IsInt()
  @Min(0)
  @IsOptional()
  triggerValue?: number;
}
