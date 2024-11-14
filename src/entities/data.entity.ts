import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class DataEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  Id: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  dataSaup: string;
  @Column({
    type: 'character varying',
    nullable: true,
  })
  id_agent: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  lastLoginTime: string;
  @Column({
    type: 'character varying',
    nullable: true,
  })
  FulDuration: string;
  @Column({
    type: 'character varying',
    nullable: true,
  })
  PauseDuration: string;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
