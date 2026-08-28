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
import { Module } from './module.entity';
import { LessonProgress } from './lesson-progress.entity';

@Table({
  tableName: 'lessons',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['moduleId', 'order'],
      where: {
        isActive: true,
      },
    },
  ],
})
export class Lesson extends Model {
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
    type: DataType.ENUM('TEXT', 'VIDEO', 'MULTIMEDIA'),
    allowNull: false,
  })
  declare contentType: 'TEXT' | 'VIDEO' | 'MULTIMEDIA';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare content: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare mediaUrl: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare order: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare durationMinutes: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Module, { as: 'module', foreignKey: 'moduleId' })
  declare module: Module;

  @HasMany(() => LessonProgress, { as: 'progress', foreignKey: 'lessonId' })
  declare progress: LessonProgress[];
}
