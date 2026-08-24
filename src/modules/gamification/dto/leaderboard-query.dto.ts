import { IsOptional, IsEnum, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/pagination/pagination.dto';

export class LeaderboardQueryDto extends PaginationDto {
  @IsOptional()
  @IsEnum(['ALL_TIME', 'MONTHLY', 'WEEKLY'])
  timeframe?: 'ALL_TIME' | 'MONTHLY' | 'WEEKLY' = 'ALL_TIME';

  @IsOptional()
  @IsUUID(4)
  classroomId?: string;
}
