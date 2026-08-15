import { Table, Column, Model, DataType, PrimaryKey, Default, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Quiz } from './quiz.entity';
import { Option } from './option.entity';

@Table({
  tableName: 'questions',
  timestamps: true,
})
export class Question extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Quiz)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare quizId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare statement: string;

  @Column({
    type: DataType.TEXT,
  })
  declare explanation: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare order: number;

  @Default(10)
  @Column({
    type: DataType.INTEGER,
  })
  declare points: number;

  @Default(true)
  @Column({
    type: DataType.BOOLEAN,
  })
  declare isActive: boolean;

  @BelongsTo(() => Quiz)
  declare quiz: Quiz;

  @HasMany(() => Option, { as: 'options', foreignKey: 'questionId' })
  declare options: Option[];
}
