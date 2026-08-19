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
}
