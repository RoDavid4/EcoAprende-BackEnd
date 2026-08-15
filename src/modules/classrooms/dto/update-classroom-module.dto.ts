import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClassroomModuleDto {
  @IsOptional()
  @IsBoolean()
  isVisible?: boolean;
}
