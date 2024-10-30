import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class dataServiceGroupEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  goup_id: string;

  @Column({
    type: 'character varying',
  })
  queue: string;

  @Column({
    type: 'character varying',
  })
  online: number;

  @Column({
    type: 'character varying',
  })
  in_job: number;

  @Column({
    type: 'character varying',
  })
  free: number;
  @Column({
    type: 'character varying',
  })
  locked: number;

  // @OneToMany(() => GroupsEntity, (group) => group.servic)
  // groups: GroupsEntity[]

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
