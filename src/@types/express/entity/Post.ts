import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    BaseEntity,
    ManyToOne,
    CreateDateColumn
} from "typeorm";
import { User } from "./User";

//TODO: koristit API?
@Entity()
export class Post extends BaseEntity {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true })
    text: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ nullable: true })
    mainImageUrl: string;

    //ili prazni array ?
    @ManyToOne(() => User, user => user.posts)
    author: User;

    @Column("text", { array: true })
    imageUrls: string[];
}

