import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class ServicedateEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  group_id: string;

  @Column({
    type: 'character varying',
  })
  title: string;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
