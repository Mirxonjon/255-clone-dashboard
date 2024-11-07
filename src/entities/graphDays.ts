import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GraphMonthEntity } from './graphMoth';

@Entity()
export class GraphDaysEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  at_work: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  work_time: string;

  @Column({
    type: 'character varying',
  })
  the_date: string;

  @Column({
    type: 'date',
    nullable: true,
  })
  the_day_Format_Date: Date;
  @Column({
    type: 'int',
    default: 0,
  })
  work_day: number;

  @Column({
    type: 'character varying',
  })
  work_type: string;
  @Column({
    type: 'character varying',
  })
  week_day_name: string;
  @ManyToOne(() => GraphMonthEntity, (agent) => agent.days, {
    onDelete: 'CASCADE',
  })
  month_id: GraphMonthEntity;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
