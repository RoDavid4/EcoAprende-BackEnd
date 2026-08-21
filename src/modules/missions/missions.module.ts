import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { MissionsService } from './missions.service';
import { MissionsController } from './missions.controller';
import { Mission } from './mission.entity';
import { MissionSubmission } from './mission-submission.entity';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [SequelizeModule.forFeature([Mission, MissionSubmission]), GamificationModule],
  controllers: [MissionsController],
  providers: [MissionsService],
  exports: [MissionsService, SequelizeModule]
})
export class MissionsModule {}
