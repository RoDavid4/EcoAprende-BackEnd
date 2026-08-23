import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  HasMany,
} from 'sequelize-typescript';
import { Module } from '../courses/module.entity';
import { Question } from './question.entity';
import { QuizAttempt } from './quiz-attempt.entity';

@Table({
  tableName: 'quizzes',
  timestamps: true,
})
export class Quiz extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Module)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare moduleId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
  })
  declare description: string;

  @Default(70)
  @Column({
    type: DataType.INTEGER,
  })
  declare passingScore: number;

  @Default(3)
  @Column({
    type: DataType.INTEGER,
  })
  declare maxAttempts: number;

  @Column({
    type: DataType.INTEGER,
  })
  declare timeLimitMinutes: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;

  @BelongsTo(() => Module)
  declare module: Module;

  @HasMany(() => Question, { as: 'questions', foreignKey: 'quizId' })
  declare questions: Question[];

  @HasMany(() => QuizAttempt, { as: 'attempts', foreignKey: 'quizId' })
  declare attempts: QuizAttempt[];
}
