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
import { User } from '../users/user.entity';
import { Lesson } from './lesson.entity';

@Table({
  tableName: 'lesson_progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'lessonId'],
    },
  ],
})
export class LessonProgress extends Model {
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

  @ForeignKey(() => Lesson)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare lessonId: string;

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
  declare completedAt: Date;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Lesson)
  declare lesson: Lesson;
}
