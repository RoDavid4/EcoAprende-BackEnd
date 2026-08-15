import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Course } from './course.entity';
import { Lesson } from './lesson.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { ClassroomModule } from '../classrooms/classroom-module.entity';

@Table({
  tableName: 'modules',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['courseId', 'order'],
    }
  ]
})
export class Module extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Course)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare courseId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare order: number;

  @Default('DRAFT')
  @Column({
    type: DataType.ENUM('DRAFT', 'PUBLISHED'),
    allowNull: false,
  })
  declare status: 'DRAFT' | 'PUBLISHED';

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Course, { as: 'course', foreignKey: 'courseId' })
  declare course: Course;

  @HasMany(() => Lesson, { as: 'lessons', foreignKey: 'moduleId' })
  declare lessons: Lesson[];

  @BelongsToMany(() => Classroom, () => ClassroomModule)
  declare classrooms: Classroom[];
}
