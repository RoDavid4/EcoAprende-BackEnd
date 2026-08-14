import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Module } from './module.entity';

@Table({
  tableName: 'lessons',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['moduleId', 'order'],
    }
  ]
})
export class Lesson extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Module)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare moduleId: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  declare title: string;

  @Column({
    type: DataType.ENUM('TEXT', 'VIDEO', 'MULTIMEDIA'),
    allowNull: false,
  })
  declare contentType: 'TEXT' | 'VIDEO' | 'MULTIMEDIA';

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  declare content: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  declare mediaUrl: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare order: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare durationMinutes: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isActive: boolean;

  @BelongsTo(() => Module, { as: 'module', foreignKey: 'moduleId' })
  declare module: Module;
}
