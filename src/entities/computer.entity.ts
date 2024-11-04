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
export class ComputersEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  sheet_id: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  ip_Adress: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  location: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  atc: string;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
