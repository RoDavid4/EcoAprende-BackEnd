import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
} from 'sequelize-typescript';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';

@Table({ tableName: 'permissions', timestamps: false })
export class Permission extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING })
  declare description: string;

  @BelongsToMany(() => Role, () => RolePermission)
  declare roles: Role[];
}
