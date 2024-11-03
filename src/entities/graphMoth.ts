import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { AgentDateEntity } from './agentdate.entity';
import { GraphDaysEntity } from './graphDays';

@Entity()
export class GraphMonthEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  year: string;

  @Column({
    type: 'int',
    default: 0,
  })
  month_number: number;

  @Column({
    type: 'character varying',
  })
  month_name: string;

  @Column({
    type: 'character varying',
  })
  month_days_count: string;

  // @Column({
  //   type: 'character varying',
  //   nullable: true,
  // })
  // login: string;

  @ManyToOne(() => AgentDateEntity, (agent) => agent.months)
  agent_id: AgentDateEntity[];

  @OneToMany(() => GraphDaysEntity, (group) => group.month_id)
  days: GraphDaysEntity[];

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
