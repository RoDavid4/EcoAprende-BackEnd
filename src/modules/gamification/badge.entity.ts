import { Table, Column, Model, DataType, PrimaryKey, Default, Unique, BelongsToMany, HasMany } from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { UserBadge } from './user-badge.entity';

@Table({
  tableName: 'badges',
  timestamps: true,
})
export class Badge extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @Unique
  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare code: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare name: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare iconUrl: string;

  @Default(50)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare xpValue: number;

  @Default('ACADEMIC')
  @Column({
    type: DataType.ENUM('ACADEMIC', 'COMMUNITY', 'STREAK', 'SPECIAL'),
    allowNull: false,
  })
  declare category: 'ACADEMIC' | 'COMMUNITY' | 'STREAK' | 'SPECIAL';

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsToMany(() => User, () => UserBadge)
  declare users: User[];

  @HasMany(() => UserBadge, { as: 'awardedUsers', foreignKey: 'badgeId' })
  declare awardedUsers: UserBadge[];
}
