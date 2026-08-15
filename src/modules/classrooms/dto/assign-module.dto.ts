import { IsUUID, IsNotEmpty } from 'class-validator';

export class AssignModuleDto {
  @IsUUID()
  @IsNotEmpty()
  moduleId!: string;
}
