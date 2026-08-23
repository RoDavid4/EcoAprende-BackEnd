import {
  IsArray,
  ArrayNotEmpty,
  ValidateNested,
  IsUUID,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @IsUUID()
  @IsNotEmpty()
  questionId!: string;

  @IsUUID()
  @IsNotEmpty()
  selectedOptionId!: string;
}

export class SubmitQuizDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers!: AnswerDto[];
}
