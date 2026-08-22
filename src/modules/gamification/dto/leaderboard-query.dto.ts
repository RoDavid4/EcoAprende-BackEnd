import { IsOptional, IsInt, Min, Max, IsEnum, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class LeaderboardQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(['ALL_TIME', 'MONTHLY', 'WEEKLY'])
  timeframe?: 'ALL_TIME' | 'MONTHLY' | 'WEEKLY' = 'ALL_TIME';

  @IsOptional()
  @IsUUID(4)
  classroomId?: string;
}
