import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';

@Module({
  imports: [SequelizeModule.forFeature([Badge, UserBadge, User])],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService, SequelizeModule],
})
export class GamificationModule {}
