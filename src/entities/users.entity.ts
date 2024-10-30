import {
  BaseEntity,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class UsersEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;
  @Column({
    type: 'character varying',
  })
  id_tg: string;

  @Column({
    type: 'character varying',
  })
  name: string;

  @Column({
    type: 'character varying',
  })
  date_was_born: string;

  @Column({
    type: 'character varying',
  })
  phone: string;

  @Column({
    type: 'character varying',
  })
  address: string;

  @Column({
    type: 'boolean',
  })
  student: boolean;

  @Column({
    type: 'character varying',
  })
  lang_ru: string;

  @Column({
    type: 'character varying',
  })
  lang_uz: string;

  @Column({
    type: 'character varying',
  })
  lang_en: string;

  @Column({
    type: 'character varying',
  })
  comp: string;
  @Column({
    type: 'character varying',
    default: 'will_call',
  })
  status: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  image: string;

  @Column({
    type: 'character varying',
  })
  experience: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  dictation_image: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  nameFile: string;

  @Column({
    type: 'character varying',
    nullable: true,
  })
  resumePdf: string;

  @CreateDateColumn({ name: 'created_at' })
  create_data: Date;
}
