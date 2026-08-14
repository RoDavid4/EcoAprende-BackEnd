import { IsString, IsOptional, IsEnum, IsBoolean, IsNotEmpty, IsInt, IsUUID, IsUrl } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  moduleId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsEnum(['TEXT', 'VIDEO', 'MULTIMEDIA'])
  @IsNotEmpty()
  contentType!: 'TEXT' | 'VIDEO' | 'MULTIMEDIA';

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsInt()
  durationMinutes?: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
