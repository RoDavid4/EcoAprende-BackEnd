import { Table, Column, Model, DataType, PrimaryKey, Default, IsEmail, Unique, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Role } from '../roles/role.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { ClassroomStudent } from '../classrooms/classroom-student.entity';
import { Course } from '../courses/course.entity';
import { QuizAttempt } from '../quizzes/quiz-attempt.entity';

@Table({
  tableName: 'users',
  timestamps: true,
})
export class User extends Model {
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
  declare fullName: string;

  @Unique
  @IsEmail
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare email: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare password: string;

  @ForeignKey(() => Role)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare roleId: number;

  @BelongsTo(() => Role)
  declare role: Role;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare resetPasswordToken: string | null;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare resetPasswordExpires: Date | null;

  @HasMany(() => Classroom)
  declare classrooms: Classroom[];

  @BelongsToMany(() => Classroom, () => ClassroomStudent)
  declare joinedClassrooms: Classroom[];

  @HasMany(() => Course, { as: 'createdCourses', foreignKey: 'createdById' })
  declare createdCourses: Course[];

  @HasMany(() => QuizAttempt, { as: 'quizAttempts', foreignKey: 'userId' })
  declare quizAttempts: QuizAttempt[];
}
