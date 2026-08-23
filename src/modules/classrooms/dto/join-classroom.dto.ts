import { IsString, IsNotEmpty, Length } from 'class-validator';

export class JoinClassroomDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, {
    message: 'El código del aula debe tener exactamente 6 caracteres',
  })
  code!: string;
}
