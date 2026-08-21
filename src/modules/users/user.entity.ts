import { Table, Column, Model, DataType, PrimaryKey, Default, IsEmail, Unique, ForeignKey, BelongsTo, HasMany, BelongsToMany } from 'sequelize-typescript';
import { Role } from '../roles/role.entity';
import { Classroom } from '../classrooms/classroom.entity';
import { ClassroomStudent } from '../classrooms/classroom-student.entity';
import { Course } from '../courses/course.entity';
import { QuizAttempt } from '../quizzes/quiz-attempt.entity';
import { Mission } from '../missions/mission.entity';
import { MissionSubmission } from '../missions/mission-submission.entity';
import { Badge } from '../gamification/badge.entity';
import { UserBadge } from '../gamification/user-badge.entity';

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

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare totalXp: number;

  @Default(1)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare level: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare currentStreak: number;

  @Column({
    type: DataType.DATEONLY,
    allowNull: true,
  })
  declare lastActivityDate: Date | null;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare lessonsCompleted: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare quizzesPassed: number;

  @Default(0)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare missionsApproved: number;

  @HasMany(() => Classroom)
  declare classrooms: Classroom[];

  @BelongsToMany(() => Classroom, () => ClassroomStudent)
  declare joinedClassrooms: Classroom[];

  @HasMany(() => Course, { as: 'createdCourses', foreignKey: 'createdById' })
  declare createdCourses: Course[];

  @HasMany(() => QuizAttempt, { as: 'quizAttempts', foreignKey: 'userId' })
  declare quizAttempts: QuizAttempt[];

  @HasMany(() => Mission, { as: 'createdMissions', foreignKey: 'createdById' })
  declare createdMissions: Mission[];

  @HasMany(() => MissionSubmission, { as: 'missionSubmissions', foreignKey: 'userId' })
  declare missionSubmissions: MissionSubmission[];

  @HasMany(() => MissionSubmission, { as: 'reviewedSubmissions', foreignKey: 'reviewedById' })
  declare reviewedSubmissions: MissionSubmission[];

  @BelongsToMany(() => Badge, () => UserBadge)
  declare badges: Badge[];

  @HasMany(() => UserBadge, { as: 'userBadges', foreignKey: 'userId' })
  declare userBadges: UserBadge[];
}
