import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class AgentControlGraphEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  agent_id: string;

  @Column({
    type: 'character varying',
  })
  id: string; // protey ID

  @Column({
    type: 'character varying',
  })
  id_login: string;

  @Column({
    type: 'integer',
  })
  id_login_type_number: number;

  @Column({
    type: 'character varying',
  })
  name: string;

  // @Column({
  //   type: 'character varying',
  //   nullable: true
  // })
  // firstName: string;

  // @Column({
  //   type: 'character varying',
  // })
  // lastName: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  timeWork: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  typeWork: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  LastLoginTime: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  FullDurationOfWork: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  PauseDuration: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  TimeWorkDuration: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  TimeEndWork: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  WorkState: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  ComeToWorkOnTime: Boolean;
  //false bo'lsa kech qolgan bo'ladi
  @Column({
    type: 'boolean',
    default: false,
  })
  LeftAfterWork: Boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  TimeWorkIsDone: Boolean;

  @Column({
    type: 'bigint',
    // nullable: true
    default: 0,
  })
  TimeWorked: number;

  // @OneToMany(() => GroupsEntity, (group) => group.servic)
  // groups: GroupsEntity[
  @UpdateDateColumn({ name: 'update_at' })
  update_data: Date;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
