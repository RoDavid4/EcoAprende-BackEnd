import { IsString, IsOptional, IsNotEmpty, IsBoolean } from 'class-validator';

export class UpdateClassroomDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
