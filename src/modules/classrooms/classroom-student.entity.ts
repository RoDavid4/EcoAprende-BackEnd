import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  ForeignKey,
} from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { Classroom } from './classroom.entity';

@Table({
  tableName: 'classroom_students',
  timestamps: false,
})
export class ClassroomStudent extends Model {
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

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare studentId: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare joinedAt: Date;
}
