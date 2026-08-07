import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateClassroomDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
