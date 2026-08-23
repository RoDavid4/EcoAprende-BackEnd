import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';
import { Classroom } from './classroom.entity';
import { ClassroomStudent } from './classroom-student.entity';
import { ClassroomModule as ClassroomModuleEntity } from './classroom-module.entity';
import { Module as CourseModuleEntity } from '../courses/module.entity';
import { StudentProgress } from '../courses/student-progress.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Classroom,
      ClassroomStudent,
      ClassroomModuleEntity,
      CourseModuleEntity,
      StudentProgress,
    ]),
  ],
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [SequelizeModule, ClassroomsService],
})
export class ClassroomsModule {}
