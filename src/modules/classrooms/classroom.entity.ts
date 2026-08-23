import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
  BelongsTo,
  BelongsToMany,
} from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { ClassroomStudent } from './classroom-student.entity';
import { ClassroomModule } from './classroom-module.entity';
import { Module } from '../courses/module.entity';

@Table({
  tableName: 'classrooms',
  timestamps: true,
})
export class Classroom extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.STRING(6),
    allowNull: false,
    unique: true,
  })
  declare code: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare teacherId: string;

  @BelongsTo(() => User)
  declare teacher: User;

  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare courseId: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsToMany(() => User, () => ClassroomStudent)
  declare students: User[];

  @BelongsToMany(() => Module, () => ClassroomModule)
  declare modules: Module[];
}
