import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { Badge } from './badge.entity';
import { UserBadge } from './user-badge.entity';
import { User } from '../users/user.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { ClassroomStudent } from '../classrooms/classroom-student.entity';
import { Role } from '../roles/role.entity';

@Module({
  imports: [SequelizeModule.forFeature([Badge, UserBadge, User, Classroom, ClassroomStudent, Role])],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService, SequelizeModule],
})
export class GamificationModule {}
