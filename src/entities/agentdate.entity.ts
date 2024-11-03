import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { GraphMonthEntity } from './graphMoth';

@Entity()
export class AgentDateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  agent_id: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  id: string;

  @Column({
    type: 'character varying',
  })
  service_name: string;

  @Column({
    type: 'character varying',
  })
  id_login: string;

  @Column({
    type: 'character varying',
  })
  name: string;

  @OneToMany(() => GraphMonthEntity, (group) => group.agent_id)
  months: GraphMonthEntity[];
  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
