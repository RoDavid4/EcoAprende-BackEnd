import { Module as NestModule } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Course } from './course.entity';
import { Module } from './module.entity';
import { Lesson } from './lesson.entity';
import { CoursesService } from './courses.service';
import { ModulesService } from './modules.service';
import { LessonsService } from './lessons.service';
import { CoursesController } from './courses.controller';
import { ModulesController } from './modules.controller';
import { LessonsController } from './lessons.controller';

@NestModule({
  imports: [SequelizeModule.forFeature([Course, Module, Lesson])],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [CoursesService, ModulesService, LessonsService],
  exports: [SequelizeModule, CoursesService, ModulesService, LessonsService],
})
export class CoursesModule {}
