import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  ValidateNested,
  ArrayMinSize,
  IsArray,
  IsUUID,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateOptionDto } from './create-option.dto';

export class CreateQuestionDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsString()
  @IsNotEmpty()
  statement!: string;

  @IsOptional()
  @IsString()
  explanation?: string;

  @IsInt()
  @IsNotEmpty()
  order!: number;

  @IsOptional()
  @IsInt()
  points?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(2)
  @Type(() => CreateOptionDto)
  options!: CreateOptionDto[];
}
