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
import { Badge } from './badge.entity';

@Table({
  tableName: 'user_badges',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'badgeId'],
    },
  ],
})
export class UserBadge extends Model {
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

  @ForeignKey(() => Badge)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare badgeId: string;

  @Default(DataType.NOW)
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare awardedAt: Date;

  @BelongsTo(() => User, 'userId')
  declare student: User;

  @BelongsTo(() => Badge, 'badgeId')
  declare badge: Badge;
}
