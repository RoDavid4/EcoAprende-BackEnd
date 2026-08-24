import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { User } from '../users/user.entity';
import { Course } from '../courses/course.entity';
import { Module as CourseModule } from '../courses/module.entity';
import { Lesson } from '../courses/lesson.entity';
import { Quiz } from '../quizzes/quiz.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { StudentProgress } from '../courses/student-progress.entity';
import { Badge } from '../gamification/badge.entity';
import { UserBadge } from '../gamification/user-badge.entity';
import { Role } from '../roles/role.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      User,
      Course,
      CourseModule,
      Lesson,
      Quiz,
      Classroom,
      StudentProgress,
      Badge,
      UserBadge,
      Role,
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
