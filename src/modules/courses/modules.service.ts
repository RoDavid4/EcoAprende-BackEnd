import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Module } from './module.entity';
import { Lesson } from './lesson.entity';
import { Course } from './course.entity';
import { LessonProgress } from './lesson-progress.entity';
import { Quiz } from '../quizzes/quiz.entity';
import { QuizAttempt } from '../quizzes/quiz-attempt.entity';
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
      throw new ForbiddenException(
        'No tienes permisos para agregar módulos a este curso',
      );
    }

    if (createModuleDto.order === undefined || createModuleDto.order === null) {
      const maxOrder = await this.moduleModel.max('order', {
        where: { courseId: createModuleDto.courseId, isActive: true },
      });
      createModuleDto.order = Number(maxOrder ?? 0) + 1;
    } else {
      const existing = await this.moduleModel.findOne({
        where: {
          courseId: createModuleDto.courseId,
          order: createModuleDto.order,
          isActive: true,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Ya existe un módulo con el orden ${createModuleDto.order} en este curso`,
        );
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

  async findModuleEntity(id: string, user: any) {
    const whereClause: any = { id };
    const lessonWhereClause: any = {};
    const quizWhereClause: any = {};

    if (user.role === 'STUDENT') {
      whereClause.isActive = true;
      whereClause.status = 'PUBLISHED';
      lessonWhereClause.isActive = true;
      quizWhereClause.isActive = true;
    }

    const moduleRecord = await this.moduleModel.findOne({
      where: whereClause,
      include: [
        {
          model: Lesson,
          as: 'lessons',
          where: lessonWhereClause,
          required: false,
          include: [
            {
              model: LessonProgress,
              as: 'progress',
              where: { userId: user.id },
              required: false,
            },
          ],
        },
        {
          model: Quiz,
          as: 'quizzes',
          where: quizWhereClause,
          required: false,
          include: [
            {
              model: QuizAttempt,
              as: 'attempts',
              where: { userId: user.id },
              required: false,
            },
          ],
        },
        {
          model: Course,
          as: 'course',
        },
      ],
      order: [[{ model: Lesson, as: 'lessons' }, 'order', 'ASC']],
    });

    if (!moduleRecord) {
      throw new NotFoundException('Módulo no encontrado');
    }

    return moduleRecord;
  }

  async findOne(id: string, user: any) {
    const moduleRecord = await this.findModuleEntity(id, user);
    const plainModule = moduleRecord.toJSON();

    return {
      id: plainModule.id,
      title: plainModule.title,
      description: plainModule.description,
      order: plainModule.order,
      status: plainModule.status,
      isActive: plainModule.isActive,
      courseId: plainModule.courseId,
      createdAt: plainModule.createdAt,
      updatedAt: plainModule.updatedAt,
      course: plainModule.course,
      lessons:
        plainModule.lessons?.map((lesson: any) => {
          const progress = lesson.progress?.[0];
          return {
            id: lesson.id,
            title: lesson.title,
            order: lesson.order,
            contentType: lesson.contentType,
            durationMinutes: lesson.durationMinutes,
            content: lesson.content,
            mediaUrl: lesson.mediaUrl,
            moduleId: lesson.moduleId,
            isActive: lesson.isActive,
            isCompleted: progress?.isCompleted ?? false,
            completedAt: progress?.completedAt ?? null,
          };
        }) || [],
      quizzes:
        plainModule.quizzes?.map((quiz: any) => {
          const attempts = quiz.attempts || [];
          const isPassed = attempts.some((a: any) => a.isPassed);
          const highestScore =
            attempts.length > 0
              ? Math.max(...attempts.map((a: any) => a.score))
              : 0;
          return {
            id: quiz.id,
            title: quiz.title,
            description: quiz.description,
            passingScore: quiz.passingScore,
            maxAttempts: quiz.maxAttempts,
            timeLimitMinutes: quiz.timeLimitMinutes,
            isActive: quiz.isActive,
            isPassed,
            attemptsCount: attempts.length,
            highestScore,
          };
        }) || [],
    };
  }

  async update(id: string, updateModuleDto: UpdateModuleDto, user: any) {
    const moduleRecord = await this.findModuleEntity(id, user);

    if (user.role !== 'ADMIN' && moduleRecord.course.createdById !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para editar este módulo',
      );
    }

    const isReactivating =
      updateModuleDto.isActive === true && !moduleRecord.isActive;
    const becomesInactive =
      updateModuleDto.isActive === false && moduleRecord.isActive;

    if (becomesInactive) {
      updateModuleDto.order = -1;
    }

    if (isReactivating || updateModuleDto.order !== undefined) {
      const targetOrder =
        updateModuleDto.order !== undefined
          ? updateModuleDto.order
          : moduleRecord.order;

      if (targetOrder <= 0 && updateModuleDto.isActive !== false) {
        throw new BadRequestException(
          'Debe especificar un número de orden válido (> 0) para reactivar el módulo.',
        );
      }

      if (targetOrder > 0) {
        const existing = await this.moduleModel.findOne({
          where: {
            courseId: moduleRecord.courseId,
            order: targetOrder,
            isActive: true,
          },
        });
        if (existing && existing.id !== moduleRecord.id) {
          throw new ConflictException(
            'El orden solicitado ya está ocupado por otro módulo activo.',
          );
        }
      }
    }

    await moduleRecord.update(updateModuleDto);
    return this.findOne(id, user);
  }

  async remove(id: string, user: any) {
    const moduleRecord = await this.findModuleEntity(id, user);

    if (user.role !== 'ADMIN' && moduleRecord.course.createdById !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar este módulo',
      );
    }

    await moduleRecord.update({ isActive: false, order: -1 });
    return this.findOne(id, user);
  }
}
