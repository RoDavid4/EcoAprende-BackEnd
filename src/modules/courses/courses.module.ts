import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from './course.entity';
import { Module as CourseModule } from './module.entity';
import { Lesson } from './lesson.entity';
import { CoursesService } from './courses.service';
import { ModulesService } from './modules.service';
import { LessonsService } from './lessons.service';
import { CoursesController } from './courses.controller';
import { ModulesController } from './modules.controller';
import { LessonsController } from './lessons.controller';
import { GamificationModule } from '../gamification/gamification.module';
import { LessonProgress } from './lesson-progress.entity';
import { ClassroomStudent } from '../classrooms/classroom-student.entity';
import { ClassroomModule as ClassroomModuleEntity } from '../classrooms/classroom-module.entity';
import { StudentProgress } from './student-progress.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Course,
      CourseModule,
      Lesson,
      LessonProgress,
      ClassroomStudent,
      ClassroomModuleEntity,
      StudentProgress,
    ]),
    GamificationModule,
  ],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [CoursesService, ModulesService, LessonsService],
  exports: [SequelizeModule, CoursesService, ModulesService, LessonsService],
})
export class CoursesModule {}
