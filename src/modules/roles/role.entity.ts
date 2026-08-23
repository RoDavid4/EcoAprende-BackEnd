import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  BelongsToMany,
  HasMany,
} from 'sequelize-typescript';
import { Permission } from './permission.entity';
import { RolePermission } from './role-permission.entity';
import { User } from '../users/user.entity';

@Table({ tableName: 'roles', timestamps: false })
export class Role extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column({ type: DataType.INTEGER })
  declare id: number;

  @Column({ type: DataType.STRING, unique: true, allowNull: false })
  declare name: string;

  @Column({ type: DataType.STRING })
  declare description: string;

  @BelongsToMany(() => Permission, () => RolePermission)
  declare permissions: Permission[];

  @HasMany(() => User)
  declare users: User[];
}
