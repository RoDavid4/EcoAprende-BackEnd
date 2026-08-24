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

@Table({
  tableName: 'audit_logs',
  timestamps: true,
  updatedAt: false, // We only need createdAt for audit logs
})
export class AuditLog extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  declare userId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare action: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare resource: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare resourceId: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  declare payload: any;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare ipAddress: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare userAgent: string;

  @BelongsTo(() => User)
  declare user: User;
}
