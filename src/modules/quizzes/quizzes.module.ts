import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { QuizzesService } from './quizzes.service';
import { QuizzesController } from './quizzes.controller';
import { Quiz } from './quiz.entity';
import { Question } from './question.entity';
import { Option } from './option.entity';
import { QuizAttempt } from './quiz-attempt.entity';
import { Module as CourseModule } from '../courses/module.entity';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [SequelizeModule.forFeature([Quiz, Question, Option, QuizAttempt, CourseModule]), GamificationModule],
  controllers: [QuizzesController],
  providers: [QuizzesService],
  exports: [SequelizeModule, QuizzesService],
})
export class QuizzesModule {}
