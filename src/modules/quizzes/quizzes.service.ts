import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { Option } from './option.entity';
import { CreateQuizDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { Module } from '../courses/module.entity';

@Injectable()
export class QuizzesService {
  constructor(
    @InjectModel(Quiz) private quizModel: typeof Quiz,
    @InjectModel(Question) private questionModel: typeof Question,
    @InjectModel(Option) private optionModel: typeof Option,
    @InjectModel(Module) private moduleModel: typeof Module,
    private sequelize: Sequelize,
  ) {}

  async create(createQuizDto: CreateQuizDto, user: any) {
    const moduleRecord = await this.moduleModel.findByPk(createQuizDto.moduleId, {
      include: ['course']
    });

    if (!moduleRecord) {
      throw new NotFoundException('Módulo no encontrado');
    }

    if (user.role !== 'ADMIN' && (moduleRecord as any).course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para agregar evaluaciones a este módulo');
    }

    if (createQuizDto.questions && createQuizDto.questions.length > 0) {
      for (const [index, q] of createQuizDto.questions.entries()) {
        const hasCorrectOption = q.options.some(opt => opt.isCorrect);
        if (!hasCorrectOption) {
          throw new BadRequestException(`La pregunta en el índice ${index} debe tener al menos una opción correcta`);
        }
      }
    }

    const transaction = await this.sequelize.transaction();

    try {
      const quiz = await this.quizModel.create({
        moduleId: createQuizDto.moduleId,
        title: createQuizDto.title,
        description: createQuizDto.description,
        passingScore: createQuizDto.passingScore,
        maxAttempts: createQuizDto.maxAttempts,
        timeLimitMinutes: createQuizDto.timeLimitMinutes,
        isActive: createQuizDto.isActive,
      }, { transaction });

      if (createQuizDto.questions && createQuizDto.questions.length > 0) {
        for (const qDto of createQuizDto.questions) {
          const question = await this.questionModel.create({
            quizId: quiz.id,
            statement: qDto.statement,
            explanation: qDto.explanation,
            order: qDto.order,
            points: qDto.points,
          }, { transaction });

          for (const [optIndex, optDto] of qDto.options.entries()) {
            await this.optionModel.create({
              questionId: question.id,
              text: optDto.text,
              isCorrect: optDto.isCorrect,
              order: optDto.order ?? optIndex,
            }, { transaction });
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
          attributes: user.role === 'STUDENT' ? { exclude: ['isCorrect'] } : undefined
        }
      ]
    };

    const quiz = await this.quizModel.findByPk(id, {
      include: [includeOptions]
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
    const quizWithModule = await this.quizModel.findByPk(id, { include: [{ model: Module, as: 'module', include: ['course'] }] });
    
    if (user.role !== 'ADMIN' && (quizWithModule as any).module.course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para editar esta evaluación');
    }

    return quiz.update(updateQuizDto);
  }

  async remove(id: string, user: any) {
    const quiz = await this.findOne(id, user);
    const quizWithModule = await this.quizModel.findByPk(id, { include: [{ model: Module, as: 'module', include: ['course'] }] });
    
    if (user.role !== 'ADMIN' && (quizWithModule as any).module.course.createdById !== user.id) {
      throw new ForbiddenException('No tienes permisos para eliminar esta evaluación');
    }

    return quiz.update({ isActive: false });
  }
}
