import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { User } from '../users/user.entity';
import { Module } from './module.entity';

@Table({
  tableName: 'courses',
  timestamps: true,
})
export class Course extends Model {
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
    allowNull: true,
  })
  declare description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare imageUrl: string;

  @Default('DRAFT')
  @Column({
    type: DataType.ENUM('DRAFT', 'PUBLISHED'),
    allowNull: false,
  })
  declare status: 'DRAFT' | 'PUBLISHED';

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

  @BelongsTo(() => User, { as: 'creator', foreignKey: 'createdById' })
  declare creator: User;

  @HasMany(() => Module, { as: 'modules', foreignKey: 'courseId' })
  declare modules: Module[];
}
