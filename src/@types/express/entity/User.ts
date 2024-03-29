import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BeforeInsert,
  BaseEntity,
  OneToMany,
  ManyToMany,
  JoinTable,
} from "typeorm";

import { hashPassword } from "../../../utils/passwordService";

import { Post } from "./Post"

@Entity()
export class User extends BaseEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  profileImageUrl: string;

  @Column({ nullable: true })
  backgroundImageUrl: string;

  @OneToMany(() => Post, post => post.author, {onDelete: "CASCADE"})
  @JoinTable()
  posts: Post[]

  @ManyToMany(() => User, user => user.following, {onDelete: "CASCADE"})
  @JoinTable()
  followers: User[]

  @ManyToMany(() => User, user => user.followers, {onDelete: "CASCADE"})
  following: User[]
  //TODO: notifications

  @BeforeInsert()
  async hash() {
    this.password = await hashPassword(this.password);
  }
}
