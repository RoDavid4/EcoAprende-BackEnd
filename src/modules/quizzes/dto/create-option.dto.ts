import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class CreateOptionDto {
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
