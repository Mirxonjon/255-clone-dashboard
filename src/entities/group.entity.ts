import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ServicesEntity } from './service.entity';

@Entity()
export class GroupsEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  group_id: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  title: string;
  @Column({
    type: 'character varying',
  })
  name: string;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;

  @ManyToOne(() => ServicesEntity, (service) => service.groups)
  servic: ServicesEntity;
}
