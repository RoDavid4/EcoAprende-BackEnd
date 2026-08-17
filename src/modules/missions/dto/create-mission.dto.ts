import { IsString, IsNotEmpty, IsEnum, IsInt, IsOptional, IsUUID, IsBoolean, IsUrl } from 'class-validator';

export class CreateMissionDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsEnum(['DIGITAL', 'PRACTICAL'])
  @IsNotEmpty()
  type!: 'DIGITAL' | 'PRACTICAL';

  @IsInt()
  @IsNotEmpty()
  pointsReward!: number;

  @IsOptional()
  @IsString()
  instructions?: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;

  @IsOptional()
  @IsUUID()
  moduleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
