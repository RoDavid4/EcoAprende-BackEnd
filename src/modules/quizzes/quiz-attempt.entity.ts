import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Quiz } from './quiz.entity';
import { User } from '../users/user.entity';

@Table({
  tableName: 'quiz_attempts',
  timestamps: true,
})
export class QuizAttempt extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare quizId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare score: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare pointsObtained: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare totalPoints: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isPassed: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare attemptNumber: number;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
  })
  declare answers: any;

  @BelongsTo(() => Quiz)
  declare quiz: Quiz;

  @BelongsTo(() => User)
  declare student: User;
}
