import { IsString, IsOptional, IsUrl } from 'class-validator';

export class SubmitMissionDto {
  @IsOptional()
  @IsString()
  evidenceText?: string;

  @IsOptional()
  @IsUrl()
  evidenceUrl?: string;
}
