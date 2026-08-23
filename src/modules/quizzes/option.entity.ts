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
import { Question } from './question.entity';

@Table({
  tableName: 'options',
  timestamps: true,
})
export class Option extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column({
    type: DataType.UUID,
  })
  declare id: string;

  @ForeignKey(() => Question)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  declare questionId: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  declare text: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
  })
  declare isCorrect: boolean;

  @Column({
    type: DataType.INTEGER,
  })
  declare order: number;

  @BelongsTo(() => Question)
  declare question: Question;
}
