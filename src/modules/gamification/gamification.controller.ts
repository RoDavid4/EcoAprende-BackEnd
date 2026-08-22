import { Controller, Get, Post, Body, Request, UseGuards, Query, Param } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { LeaderboardQueryDto } from './dto/leaderboard-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('profile')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getProfile(@Request() req: any) {
    return this.gamificationService.getProfile(req.user.id);
  }

  @Get('badges')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getBadges(@Request() req: any) {
    return this.gamificationService.getBadges(req.user.id);
  }

  @Get('badges/icons')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getAvailableIcons() {
    return this.gamificationService.getAvailableIcons();
  }

  @Get('leaderboard')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getLeaderboard(@Query() query: LeaderboardQueryDto, @Request() req: any) {
    if (query.classroomId) {
      return this.gamificationService.getClassroomLeaderboard(query.classroomId, query, req.user.id, req.user.role);
    }
    return this.gamificationService.getGlobalLeaderboard(query);
  }

  @Get('leaderboard/classroom/:classroomId')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getClassroomLeaderboard(
    @Param('classroomId') classroomId: string,
    @Query() query: LeaderboardQueryDto,
    @Request() req: any
  ) {
    return this.gamificationService.getClassroomLeaderboard(classroomId, query, req.user.id, req.user.role);
  }

  @Post('badges')
  @Roles('ADMIN')
  createBadge(@Body() createBadgeDto: CreateBadgeDto) {
    return this.gamificationService.createBadge(createBadgeDto);
  }
}
