import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class AdminEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'character varying',
  })
  name: string;

  @Column({
    type: 'character varying',
  })
  password: string;

  @Column({
    type: 'character varying',
  })
  role: string;
}
