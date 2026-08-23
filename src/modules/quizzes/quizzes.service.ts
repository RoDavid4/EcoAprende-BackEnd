import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { Option } from './option.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { Module } from '../courses/module.entity';
import { Module as CourseModule } from '../courses/module.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { GamificationService } from '../gamification/gamification.service';
import { CoursesService } from '../courses/courses.service';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private quizModel: typeof Quiz,
    @InjectModel(Question) private questionModel: typeof Question,
    @InjectModel(Option) private optionModel: typeof Option,
    @InjectModel(QuizAttempt) private quizAttemptModel: typeof QuizAttempt,
    @InjectModel(CourseModule) private courseModuleModel: typeof CourseModule,
    private readonly gamificationService: GamificationService,
    private readonly coursesService: CoursesService,
    private sequelize: Sequelize,
  ) {}

  async create(createQuizDto: CreateQuizDto, user: any) {
    const moduleRecord = await this.courseModuleModel.findByPk(
      createQuizDto.moduleId,
      {
        include: ['course'],
      },
    );

    if (!moduleRecord) {
      throw new NotFoundException('Módulo no encontrado');
    }

    if (
      user.role !== 'ADMIN' &&
      (moduleRecord as any).course.createdById !== user.id
    ) {
      throw new ForbiddenException(
        'No tienes permisos para agregar evaluaciones a este módulo',
      );
    }

    if (createQuizDto.questions && createQuizDto.questions.length > 0) {
      for (const [index, q] of createQuizDto.questions.entries()) {
        const hasCorrectOption = q.options.some((opt) => opt.isCorrect);
        if (!hasCorrectOption) {
          throw new BadRequestException(
            `La pregunta en el índice ${index} debe tener al menos una opción correcta`,
          );
        }
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      const quiz = await this.quizModel.create(
        {
          moduleId: createQuizDto.moduleId,
          title: createQuizDto.title,
          description: createQuizDto.description,
          passingScore: createQuizDto.passingScore,
          maxAttempts: createQuizDto.maxAttempts,
          timeLimitMinutes: createQuizDto.timeLimitMinutes,
          isActive: createQuizDto.isActive,
        },
        { transaction },
      );

      if (createQuizDto.questions && createQuizDto.questions.length > 0) {
        for (const qDto of createQuizDto.questions) {
          const question = await this.questionModel.create(
            {
              quizId: quiz.id,
              statement: qDto.statement,
              explanation: qDto.explanation,
              order: qDto.order,
              points: qDto.points,
            },
            { transaction },
          );

          for (const [optIndex, optDto] of qDto.options.entries()) {
            await this.optionModel.create(
              {
                questionId: question.id,
                text: optDto.text,
                isCorrect: optDto.isCorrect,
                order: optDto.order ?? optIndex,
              },
              { transaction },
            );
          }
        }
      }

      await transaction.commit();
      return this.findOne(quiz.id, user);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(user: any) {
    const whereClause: any = {};
    if (user.role === 'STUDENT') {
      whereClause.isActive = true;
    }
    return this.quizModel.findAll({ where: whereClause });
  }

  async findOne(id: string, user: any) {
    const includeOptions: any = {
      model: Question,
      as: 'questions',
      include: [
        {
          model: Option,
          as: 'options',
          attributes:
            user.role === 'STUDENT' ? { exclude: ['isCorrect'] } : undefined,
        },
      ],
    };

    const quiz = await this.quizModel.findByPk(id, {
      include: [includeOptions],
    });

    if (!quiz) {
      throw new NotFoundException('Evaluación no encontrada');
    }

    if (user.role === 'STUDENT' && !quiz.isActive) {
      throw new ForbiddenException('No tienes acceso a esta evaluación');
    }

    return quiz;
  }

  async update(id: string, updateQuizDto: UpdateQuizDto, user: any) {
    const quiz = await this.findOne(id, user);
    const quizWithModule = await this.quizModel.findByPk(id, {
      include: [{ model: Module, as: 'module', include: ['course'] }],
    });

    if (
      user.role !== 'ADMIN' &&
      (quizWithModule as any).module.course.createdById !== user.id
    ) {
      throw new ForbiddenException(
        'No tienes permisos para editar esta evaluación',
      );
    }

    return quiz.update(updateQuizDto);
  }

  async remove(id: string, user: any) {
    const quiz = await this.findOne(id, user);
    const quizWithModule = await this.quizModel.findByPk(id, {
      include: [{ model: Module, as: 'module', include: ['course'] }],
    });

    if (
      user.role !== 'ADMIN' &&
      (quizWithModule as any).module.course.createdById !== user.id
    ) {
      throw new ForbiddenException(
        'No tienes permisos para eliminar esta evaluación',
      );
    }

    return quiz.update({ isActive: false });
  }

  async submitQuiz(quizId: string, userId: string, dto: SubmitQuizDto) {
    const quiz = await this.quizModel.findByPk(quizId, {
      include: [
        {
          model: Question,
          as: 'questions',
          include: [{ model: Option, as: 'options' }],
        },
        {
          model: CourseModule,
          as: 'module',
        },
      ],
    });

    if (!quiz || !quiz.isActive) {
      throw new NotFoundException('Evaluación no encontrada o inactiva');
    }

    const previousAttemptsCount = await this.quizAttemptModel.count({
      where: { quizId, userId },
    });

    if (
      quiz.maxAttempts !== null &&
      previousAttemptsCount >= quiz.maxAttempts
    ) {
      throw new BadRequestException(
        'Has alcanzado el límite máximo de intentos permitidos para esta evaluación',
      );
    }

    let pointsObtained = 0;
    let totalPoints = 0;
    const processedAnswers: any[] = [];

    const questionsMap = new Map<string, Question>();
    for (const q of quiz.questions) {
      questionsMap.set(q.id, q);
      totalPoints += q.points;
    }

    for (const answer of dto.answers) {
      const question = questionsMap.get(answer.questionId);
      if (!question) continue;

      const correctOption = question.options.find((opt) => opt.isCorrect);
      const selectedOption = question.options.find(
        (opt) => opt.id === answer.selectedOptionId,
      );

      const isCorrect = selectedOption ? selectedOption.isCorrect : false;
      const pointsAwarded = isCorrect ? question.points : 0;
      pointsObtained += pointsAwarded;

      processedAnswers.push({
        questionId: question.id,
        statement: question.statement,
        explanation: question.explanation,
        selectedOptionId: answer.selectedOptionId,
        correctOptionId: correctOption?.id,
        isCorrect,
        pointsAwarded,
      });
    }

    const score = totalPoints > 0 ? (pointsObtained / totalPoints) * 100 : 0;
    const isPassed = score >= quiz.passingScore;
    const attemptNumber = previousAttemptsCount + 1;

    const attempt = await this.quizAttemptModel.create({
      quizId,
      userId,
      score,
      pointsObtained,
      totalPoints,
      isPassed,
      attemptNumber,
      answers: processedAnswers,
    });

    if (isPassed) {
      await this.gamificationService.processActivity(userId, 'PASS_QUIZ');
    }

    if (quiz.module?.courseId) {
      await this.coursesService.updateStudentProgress(
        userId,
        quiz.module.courseId,
      );
    }

    return {
      attemptId: attempt.id,
      score,
      isPassed,
      attemptNumber,
      pointsObtained,
      totalPoints,
      attemptsRemaining:
        quiz.maxAttempts !== null ? quiz.maxAttempts - attemptNumber : null,
      answers: processedAnswers,
    };
  }

  async getMyAttempts(quizId: string, userId: string) {
    return this.quizAttemptModel.findAll({
      where: { quizId, userId },
      order: [['attemptNumber', 'ASC']],
    });
  }
}
