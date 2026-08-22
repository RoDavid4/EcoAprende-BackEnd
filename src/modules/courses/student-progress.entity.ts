import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { Course } from './course.entity';

@Table({
  tableName: 'student_progress',
  timestamps: true,
})
export class StudentProgress extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @BelongsTo(() => User)
  declare user: User;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare courseId: string;

  @BelongsTo(() => Course)
  declare course: Course;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare completedLessonsCount: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare totalLessonsCount: number;
  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare completedQuizzesCount: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare totalQuizzesCount: number;
  @Default(0.00)
  @Column({
    type: DataType.FLOAT,
    allowNull: false,
  })
  declare percentage: number;

  @Default(false)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isCompleted: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare lastAccessedAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare completedAt: Date;
}
