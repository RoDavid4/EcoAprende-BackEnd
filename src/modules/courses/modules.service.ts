import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Module } from './module.entity';
import { Lesson } from './lesson.entity';
import { Course } from './course.entity';
import { CreateModuleDto } from './dto/create-module.dto';
import { UpdateModuleDto } from './dto/update-module.dto';

@Injectable()
export class ModulesService {
  constructor(
    @InjectModel(Module) private moduleModel: typeof Module,
    @InjectModel(Course) private courseModel: typeof Course,
  ) {}

  async create(createModuleDto: CreateModuleDto, user: any) {
    const course = await this.courseModel.findByPk(createModuleDto.courseId);
    if (!course || !course.isActive) {
      throw new NotFoundException('Curso no encontrado');
    }

    if (user.role !== 'ADMIN' && course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para agregar módulos a este curso');
    }

    if (createModuleDto.order === undefined || createModuleDto.order === null) {
      const maxOrder = await this.moduleModel.max('order', {
        where: { courseId: createModuleDto.courseId, isActive: true }
      }) as number | null;
      createModuleDto.order = (maxOrder || 0) + 1;
    } else {
      const existing = await this.moduleModel.findOne({
        where: { courseId: createModuleDto.courseId, order: createModuleDto.order, isActive: true }
      });
      if (existing) {
        throw new BadRequestException(`Ya existe un módulo con el orden ${createModuleDto.order} en este curso`);
      }
    }

    return this.moduleModel.create({ ...createModuleDto });
  }

  async findAll(user: any) {
    const whereClause: any = { isActive: true };

    if (user.role === 'STUDENT') {
      whereClause.status = 'PUBLISHED';
    }

    return this.moduleModel.findAll({
      where: whereClause,
      order: [['order', 'ASC']],
    });
  }

  async findOne(id: string, user: any) {
    const whereClause: any = { id };
    const lessonWhereClause: any = {};

    if (user.role === 'STUDENT') {
      whereClause.isActive = true;
      whereClause.status = 'PUBLISHED';
      lessonWhereClause.isActive = true;
    }

    const moduleRecord = await this.moduleModel.findOne({
      where: whereClause,
      include: [
        {
          model: Lesson,
          as: 'lessons',
          where: lessonWhereClause,
          required: false,
        },
        {
          model: Course,
          as: 'course',
        }
      ],
      order: [
        [{ model: Lesson, as: 'lessons' }, 'order', 'ASC']
      ]
    });

    if (!moduleRecord) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return moduleRecord;
  }

  async update(id: string, updateModuleDto: UpdateModuleDto, user: any) {
    const moduleRecord = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && moduleRecord.course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para editar este módulo');
    }

    const isReactivating = updateModuleDto.isActive === true && !moduleRecord.isActive;
    const becomesInactive = updateModuleDto.isActive === false && moduleRecord.isActive;

    if (becomesInactive) {
      updateModuleDto.order = -1;
    }

    if (isReactivating || updateModuleDto.order !== undefined) {
      const targetOrder = updateModuleDto.order !== undefined ? updateModuleDto.order : moduleRecord.order;
      
      if (targetOrder <= 0 && updateModuleDto.isActive !== false) {
        throw new BadRequestException('Debe especificar un número de orden válido (> 0) para reactivar el módulo.');
      }
      
      if (targetOrder > 0) {
        const existing = await this.moduleModel.findOne({
          where: { courseId: moduleRecord.courseId, order: targetOrder, isActive: true }
        });
        if (existing && existing.id !== moduleRecord.id) {
          throw new ConflictException('El orden solicitado ya está ocupado por otro módulo activo.');
        }
      }
    }

    return moduleRecord.update(updateModuleDto);
  }

  async remove(id: string, user: any) {
    const moduleRecord = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && moduleRecord.course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para eliminar este módulo');
    }

    return moduleRecord.update({ isActive: false, order: -1 });
  }
}
