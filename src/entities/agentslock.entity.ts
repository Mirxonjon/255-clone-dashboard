import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class agentslockEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  agent_id: string;

  @Column({
    type: 'character varying',
  })
  id: string;

  @Column({
    type: 'integer',
  })
  login: Number;

  @Column({
    type: 'character varying',
  })
  firstName: string;

  @Column({
    type: 'character varying',
  })
  lastName: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  secondName: string;

  @Column({
    type: 'character varying',
  })
  agentState: number;

  @Column({
    type: 'character varying',
  })
  agentStateDuration: number;

  @Column({
    type: 'character varying',
    nullable:true
  })
  lastAgentStateDuration: number;
  @Column({
    type: 'character varying',
  })
  lockCause: number;

  @Column({
    type: 'character varying',
    nullable :true
  })
  lastLockCause: number;
  
  @Column({
    type: 'character varying',
  })
  banInfo: string ;


  // @OneToMany(() => GroupsEntity, (group) => group.servic)
  // groups: GroupsEntity[]

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
