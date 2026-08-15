import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey } from 'sequelize-typescript';
import { Classroom } from './classroom.entity';
import { Module } from '../courses/module.entity';

@Table({
  tableName: 'classroom_modules',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['classroomId', 'moduleId'],
    }
  ]
})
export class ClassroomModule extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Classroom)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare classroomId: string;

  @ForeignKey(() => Module)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare moduleId: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare assignedAt: Date;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isVisible: boolean;
}
