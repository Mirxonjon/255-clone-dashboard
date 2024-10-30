import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class dataGroupEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  group_id: string;

  @Column({
    type: 'bigint',
  })
  acceptedCallCount: number;

  // @Column({
  //   type: 'bigint',
  // })
  // lastAcceptedCallCount: number;

  @Column({
    type: 'bigint',
  })
  presentedCallCount: number;

  // @Column({
  //   type: 'bigint',
  // })
  // lastPresentedCallCount: number;

  @Column({
    type: 'bigint',
  })
  lostCallCount: number;

  // @Column({
  //   type: 'bigint',
  // })
  // lastLostCallCount: number;

  @Column({
    type: 'bigint',
  })
  straggleCallCount: number;

  // @Column({
  //   type: 'bigint',
  // })
  // lastStraggleCallCount: number;

  @Column({
    type: 'character varying',
  })
  averageTimeBeforeConnect: string;

  @Column({
    type: 'character varying',
  })
  averageCallDuration: string;

  @Column({
    type: 'bigint',
  })
  queueDispatchedCallCoun: number;

  // @Column({
  //   type: 'bigint',
  // })
  // lastQueueDispatchedCallCoun: number;
  // @OneToMany(() => GroupsEntity, (group) => group.servic)
  // groups: GroupsEntity[]

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
