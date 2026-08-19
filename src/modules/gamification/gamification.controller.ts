import { Controller, Get, Post, Body, Request, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
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

  @Get('leaderboard')
  @Roles('STUDENT', 'TEACHER', 'ADMIN')
  getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }

  @Post('badges')
  @Roles('ADMIN')
  createBadge(@Body() createBadgeDto: CreateBadgeDto) {
    return this.gamificationService.createBadge(createBadgeDto);
  }
}
