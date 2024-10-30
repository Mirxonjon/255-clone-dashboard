import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class agentsDataStateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  agent_id: string;

  @Column({
    type: 'character varying',
  })
  id: string;

  @Column({
    type: 'character varying',
  })
  login: number;

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
    nullable:true
  })
  lastLockCause: number;

  @Column({
    type: 'boolean',
    default :'false'
  })
  IsBlockToBlock: boolean;


  @Column({
    type: 'boolean',
    default :'false'
  })
  IsOnlineToBlock: boolean;

  @Column({
    type: 'boolean',
    default :'false'
  })
  IsSupervazer: boolean;

  @Column({
    type: 'character varying',
    default :'null'
  })
  TgMsgId: string;

  @Column({
    type: 'character varying',
    default :'null'
  })
  TgMsgSentTime: string;

  

  @Column({
    type: 'boolean',
    default :'true'
  })
  addToblockTable: boolean;

  // @OneToMany(() => GroupsEntity, (group) => group.servic)
  // groups: GroupsEntity[]

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
