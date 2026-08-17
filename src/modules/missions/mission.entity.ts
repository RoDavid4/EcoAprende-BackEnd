import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { Module } from '../courses/module.entity';
import { MissionSubmission } from './mission-submission.entity';

@Table({
  tableName: 'missions',
  timestamps: true,
})
export class Mission extends Model {
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
  declare title: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare description: string;

  @Column({
    type: DataType.ENUM('DIGITAL', 'PRACTICAL'),
    allowNull: false,
  })
  declare type: 'DIGITAL' | 'PRACTICAL';

  @Default(50)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare pointsReward: number;

  @Column({
    type: DataType.TEXT,
  })
  declare instructions: string;

  @Column({
    type: DataType.STRING,
  })
  declare imageUrl: string;

  @ForeignKey(() => Module)
  @Column({
    type: DataType.UUID,
  })
  declare moduleId: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare createdById: string;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Module)
  declare module: Module;

  @BelongsTo(() => User, 'createdById')
  declare creator: User;

  @HasMany(() => MissionSubmission, { as: 'submissions', foreignKey: 'missionId' })
  declare submissions: MissionSubmission[];
}
