import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Course } from './course.entity';
import { Module } from './module.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { User } from '../users/user.entity';
import { StudentProgress } from './student-progress.entity';
import { GamificationService } from '../gamification/gamification.service';

@Injectable()
export class CoursesService {
  constructor(
    @InjectModel(Course) private courseModel: typeof Course,
    @InjectModel(Module) private moduleModel: typeof Module,
    @InjectModel(StudentProgress) private studentProgressModel: typeof StudentProgress,
    private readonly gamificationService: GamificationService,
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

  async getStudentProgress(studentId: string) {
    const progressList = await this.studentProgressModel.findAll({
      where: { userId: studentId },
      include: [
        {
          model: Course,
          as: 'course',
          attributes: ['id', 'title', 'imageUrl']
        }
      ]
    });

    const updatedProgressList = await Promise.all(progressList.map(async p => {
      const updated = await this.updateStudentProgress(studentId, p.courseId);
      if (updated) {
        (updated as any).course = p.course;
        return updated;
      }
      return p;
    }));

    const gamificationProfile = await this.gamificationService.getProfile(studentId);

    const enrolledCoursesCount = updatedProgressList.length;
    const completedCoursesCount = updatedProgressList.filter(p => p.isCompleted).length;
    
    let totalCompletedLessons = 0;
    let totalCompletedQuizzes = 0;
    let totalPercentageSum = 0;

    const courseDetails = updatedProgressList.map(p => {
      totalCompletedLessons += p.completedLessonsCount;
      totalCompletedQuizzes += p.completedQuizzesCount;
      totalPercentageSum += p.percentage;
      
      return {
        courseId: p.courseId,
        courseTitle: p.course.title,
        courseThumbnail: p.course.imageUrl,
        completedLessonsCount: p.completedLessonsCount,
        totalLessonsCount: p.totalLessonsCount,
        completedQuizzesCount: p.completedQuizzesCount,
        totalQuizzesCount: p.totalQuizzesCount,
        totalItemsCount: p.totalLessonsCount + p.totalQuizzesCount,
        completedItemsCount: p.completedLessonsCount + p.completedQuizzesCount,
        percentage: p.percentage,
        isCompleted: p.isCompleted,
        lastAccessedAt: p.lastAccessedAt,
        completedAt: p.completedAt,
      };
    });

    const globalPercentage = enrolledCoursesCount > 0 ? (totalPercentageSum / enrolledCoursesCount) : 0;

    return {
      global: {
        enrolledCoursesCount,
        completedCoursesCount,
        totalLessonsCompleted: totalCompletedLessons,
        totalQuizzesPassed: totalCompletedQuizzes,
        averagePercentage: parseFloat(globalPercentage.toFixed(2)),
      },
      gamification: {
        totalXp: gamificationProfile?.totalXp || 0,
        level: gamificationProfile?.level || 1,
        currentStreak: gamificationProfile?.currentStreak || 0,
        badgesCount: gamificationProfile?.badges?.length || 0,
      },
      courses: courseDetails
    };
  }

  async updateStudentProgress(userId: string, courseId: string) {
    const modules = await this.moduleModel.findAll({
      where: { courseId, isActive: true },
      attributes: ['id']
    });
    const moduleIds = modules.map(m => m.id);

    const sequelize = this.courseModel.sequelize;
    if (!sequelize) return null;
    
    const LessonModel = sequelize.models.Lesson;
    const QuizModel = sequelize.models.Quiz;
    const LessonProgressModel = sequelize.models.LessonProgress;
    const QuizAttemptModel = sequelize.models.QuizAttempt;

    // Default to empty arrays for `where` IN clauses to avoid errors
    const moduleIdClause = moduleIds.length > 0 ? moduleIds : [null];

    const totalLessons = await LessonModel.count({ where: { moduleId: moduleIdClause, isActive: true } });
    const totalQuizzes = QuizModel ? await QuizModel.count({ where: { moduleId: moduleIdClause, isActive: true } }) : 0;
    
    // completed lessons
    const lessons = await LessonModel.findAll({ where: { moduleId: moduleIdClause, isActive: true }, attributes: ['id'] });
    const lessonIds = lessons.map(l => (l as any).id);
    const completedLessons = lessonIds.length > 0 
      ? await LessonProgressModel.count({ where: { userId, lessonId: lessonIds, isCompleted: true } })
      : 0;

    // completed quizzes
    let passedQuizzes = 0;
    if (QuizModel && QuizAttemptModel) {
      const quizzes = await QuizModel.findAll({ where: { moduleId: moduleIdClause, isActive: true }, attributes: ['id'] });
      const quizIds = quizzes.map(q => (q as any).id);
      passedQuizzes = quizIds.length > 0
        ? await QuizAttemptModel.count({ where: { userId, quizId: quizIds, isPassed: true } })
        : 0;
    }

    const totalItems = totalLessons + totalQuizzes;
    const completedItems = completedLessons + passedQuizzes;

    const percentage = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    const isCompleted = percentage >= 100 && totalItems > 0;

    let studentProgress = await this.studentProgressModel.findOne({ where: { userId, courseId } });
    if (!studentProgress) {
      studentProgress = await this.studentProgressModel.create({
        userId,
        courseId,
        totalLessonsCount: totalLessons,
        totalQuizzesCount: totalQuizzes,
        completedLessonsCount: completedLessons,
        completedQuizzesCount: passedQuizzes,
        percentage: percentage > 100 ? 100 : percentage,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        lastAccessedAt: new Date(),
      });
    } else {
      await studentProgress.update({
        totalLessonsCount: totalLessons,
        totalQuizzesCount: totalQuizzes,
        completedLessonsCount: completedLessons,
        completedQuizzesCount: passedQuizzes,
        percentage: percentage > 100 ? 100 : percentage,
        isCompleted,
        completedAt: isCompleted && !studentProgress.isCompleted ? new Date() : studentProgress.completedAt,
        lastAccessedAt: new Date(),
      });
    }

    return studentProgress;
  }
}
