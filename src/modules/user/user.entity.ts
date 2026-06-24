import { Entity, PrimaryGeneratedColumn, Column, OneToMany, OneToOne,CreateDateColumn,UpdateDateColumn, Index, Unique } from 'typeorm';

@Entity('users')
export class User_Entity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'bigint', nullable: true, unique: true })
  auth_id: number;

  @Column({ nullable: true, default: "" })
  realname: string;

  @CreateDateColumn()
  createdAt: Date;
}
