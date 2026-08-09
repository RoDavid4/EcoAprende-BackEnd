import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ClassroomsService } from './classrooms.service';
import { ClassroomsController } from './classrooms.controller';
import { Classroom } from './classroom.entity';
import { ClassroomStudent } from './classroom-student.entity';

@Module({
  imports: [SequelizeModule.forFeature([Classroom, ClassroomStudent])],
  controllers: [ClassroomsController],
  providers: [ClassroomsService],
  exports: [SequelizeModule, ClassroomsService],
})
export class ClassroomsModule {}
