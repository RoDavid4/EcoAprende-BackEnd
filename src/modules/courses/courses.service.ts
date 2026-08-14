import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Course } from './course.entity';
import { Module } from './module.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from '../users/user.entity';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course) private courseModel: typeof Course,
  ) {}

  async create(createCourseDto: CreateCourseDto, userId: string) {
    return this.courseModel.create({
      ...createCourseDto,
      createdById: userId,
    });
  }

  async findAll(user: any) {
    const whereClause: any = { isActive: true };

    if (user.role === 'STUDENT') {
      whereClause.status = 'PUBLISHED';
    }

    return this.courseModel.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName'],
        }
      ]
    });
  }

  async findOne(id: string, user: any) {
    const whereClause: any = { id, isActive: true };
    const moduleWhereClause: any = { isActive: true };

    if (user.role === 'STUDENT') {
      whereClause.status = 'PUBLISHED';
      moduleWhereClause.status = 'PUBLISHED';
    }

    const course = await this.courseModel.findOne({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'fullName'],
        },
        {
          model: Module,
          as: 'modules',
          where: moduleWhereClause,
          required: false,
        }
      ],
      order: [
        [{ model: Module, as: 'modules' }, 'order', 'ASC']
      ]
    });

    if (!course) {
      throw new NotFoundException('Curso no encontrado');
    }

    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, user: any) {
    const course = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para editar este curso');
    }

    return course.update(updateCourseDto);
  }

  async remove(id: string, user: any) {
    const course = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este curso');
    }

    return course.update({ isActive: false });
  }
}
