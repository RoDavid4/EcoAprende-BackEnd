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
import { Mission } from './mission.entity';
import { User } from '../users/user.entity';

@Table({
  tableName: 'mission_submissions',
  timestamps: true,
})
export class MissionSubmission extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Mission)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare missionId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare userId: string;

  @Default('PENDING')
  @Column({
    type: DataType.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    allowNull: false,
  })
  declare status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Column({
    type: DataType.TEXT,
  })
  declare evidenceText: string;

  @Column({
    type: DataType.STRING,
  })
  declare evidenceUrl: string;

  @Column({
    type: DataType.TEXT,
  })
  declare feedback: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  declare reviewedById: string;

  @Column({
    type: DataType.DATE,
  })
  declare reviewedAt: Date;

  @BelongsTo(() => Mission, 'missionId')
  declare mission: Mission;

  @BelongsTo(() => User, 'userId')
  declare student: User;

  @BelongsTo(() => User, 'reviewedById')
  declare reviewer: User;
}
