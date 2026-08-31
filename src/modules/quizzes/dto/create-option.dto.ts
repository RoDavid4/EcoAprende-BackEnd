import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  IsInt,
  IsUUID,
} from 'class-validator';

export class CreateOptionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsBoolean()
  @IsNotEmpty()
  isCorrect!: boolean;

  @IsOptional()
  @IsInt()
  order?: number;
}
