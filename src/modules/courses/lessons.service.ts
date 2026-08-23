import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Lesson } from './lesson.entity';
import { Module } from './module.entity';
import { Course } from './course.entity';
import { CoursesService } from './courses.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { GamificationService } from '../gamification/gamification.service';
import { LessonProgress } from './lesson-progress.entity';
import { ClassroomStudent } from '../classrooms/classroom-student.entity';
import { ClassroomModule } from '../classrooms/classroom-module.entity';
import { StudentProgress } from './student-progress.entity';
import { Op } from 'sequelize';

@Injectable()
export class LessonsService {
  constructor(
    @InjectModel(Lesson) private lessonModel: typeof Lesson,
    @InjectModel(Module) private moduleModel: typeof Module,
    @InjectModel(LessonProgress)
    private lessonProgressModel: typeof LessonProgress,
    @InjectModel(ClassroomStudent)
    private classroomStudentModel: typeof ClassroomStudent,
    @InjectModel(ClassroomModule)
    private classroomModuleModel: typeof ClassroomModule,
    @InjectModel(StudentProgress)
    private studentProgressModel: typeof StudentProgress,
    private readonly gamificationService: GamificationService,
    @Inject(forwardRef(() => CoursesService))
    private coursesService: CoursesService,
  ) {}

  async create(createLessonDto: CreateLessonDto, user: any) {
    const moduleRecord = await this.moduleModel.findByPk(
      createLessonDto.moduleId,
      {
        include: [{ model: Course, as: 'course' }],
      },
    );

    if (!moduleRecord || !moduleRecord.isActive) {
      throw new NotFoundException('Módulo no encontrado');
    }

    if (user.role !== 'ADMIN' && moduleRecord.course.createdById !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para agregar lecciones a este módulo',
      );
    }

    if (createLessonDto.order === undefined || createLessonDto.order === null) {
      const maxOrder = await this.lessonModel.max('order', {
        where: { moduleId: createLessonDto.moduleId, isActive: true },
      });
      createLessonDto.order = Number(maxOrder ?? 0) + 1;
    } else {
      const existing = await this.lessonModel.findOne({
        where: {
          moduleId: createLessonDto.moduleId,
          order: createLessonDto.order,
          isActive: true,
        },
      });
      if (existing) {
        throw new BadRequestException(
          `Ya existe una lección con el orden ${createLessonDto.order} en este módulo`,
        );
      }
    }

    return this.lessonModel.create({ ...createLessonDto });
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findAll(user: any) {
    const whereClause: any = { isActive: true };

    return this.lessonModel.findAll({
      where: whereClause,
      order: [['order', 'ASC']],
    });
  }

  async findOne(id: string, user: any) {
    const whereClause: any = { id };
    if (user.role === 'STUDENT') {
      whereClause.isActive = true;
    }

    const lesson = await this.lessonModel.findOne({
      where: whereClause,
      include: [
        {
          model: Module,
          as: 'module',
          include: [{ model: Course, as: 'course' }],
        },
      ],
    });

    if (!lesson) {
      throw new NotFoundException('Lección no encontrada');
    }

    if (user.role === 'STUDENT') {
      if (
        lesson.module.status !== 'PUBLISHED' ||
        lesson.module.course.status !== 'PUBLISHED'
      ) {
        throw new NotFoundException('Lección no disponible');
      }
    }

    return lesson;
  }

  async update(id: string, updateLessonDto: UpdateLessonDto, user: any) {
    const lesson = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && lesson.module.course.createdById !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta lección',
      );
    }

    const isReactivating =
      updateLessonDto.isActive === true && !lesson.isActive;
    const becomesInactive =
      updateLessonDto.isActive === false && lesson.isActive;

    if (becomesInactive) {
      updateLessonDto.order = -1;
    }

    if (isReactivating || updateLessonDto.order !== undefined) {
      const targetOrder =
        updateLessonDto.order !== undefined
          ? updateLessonDto.order
          : lesson.order;

      if (targetOrder <= 0 && updateLessonDto.isActive !== false) {
        throw new BadRequestException(
          'Debe especificar un número de orden válido (> 0) para reactivar el elemento.',
        );
      }

      if (targetOrder > 0) {
        const existing = await this.lessonModel.findOne({
          where: {
            moduleId: lesson.moduleId,
            order: targetOrder,
            isActive: true,
          },
        });
        if (existing && existing.id !== lesson.id) {
          throw new ConflictException(
            'El orden solicitado ya está ocupado por otro elemento activo.',
          );
        }
      }
    }

    return lesson.update(updateLessonDto);
  }

  async remove(id: string, user: any) {
    const lesson = await this.findOne(id, user);

    if (user.role !== 'ADMIN' && lesson.module.course.createdById !== user.id) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta lección',
      );
    }

    return lesson.update({ isActive: false, order: -1 });
  }

  async complete(id: string, user: any) {
    if (user.role !== 'STUDENT') {
      return { message: 'Only students receive XP for completing lessons' };
    }

    const lesson = await this.findOne(id, user);

    // Verify enrollment
    const enrolledClassrooms = await this.classroomStudentModel.findAll({
      where: { studentId: user.id },
    });
    const classroomIds = enrolledClassrooms.map((c) => c.classroomId);

    const hasAccess = await this.classroomModuleModel.findOne({
      where: {
        moduleId: lesson.moduleId,
        classroomId: { [Op.in]: classroomIds },
        isVisible: true,
      },
    });

    if (!hasAccess) {
      throw new ForbiddenException(
        'No estás inscripto en ningún aula que tenga acceso a esta lección.',
      );
    }

    // Idempotency check
    const existingProgress = await this.lessonProgressModel.findOne({
      where: { userId: user.id, lessonId: lesson.id },
    });

    if (existingProgress && existingProgress.isCompleted) {
      return {
        message: 'Lección ya estaba completada',
        progress: existingProgress,
      };
    }

    const progress =
      existingProgress ||
      (await this.lessonProgressModel.create({
        userId: user.id,
        lessonId: lesson.id,
      }));

    await progress.update({
      isCompleted: true,
      completedAt: new Date(),
    });

    const rewards = await this.gamificationService.processActivity(
      user.id,
      'COMPLETE_LESSON',
    );

    // Remove direct StudentProgress update logic and call CoursesService (which handles everything)
    const courseId = lesson.module.course.id;
    await this.coursesService.updateStudentProgress(user.id, courseId);

    return {
      message: 'Lección completada exitosamente',
      progress,
      rewards,
    };
  }
}
