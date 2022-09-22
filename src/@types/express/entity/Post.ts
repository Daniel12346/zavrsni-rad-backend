import {
    PrimaryGeneratedColumn,
    Column,
    Entity,
    BaseEntity,
    ManyToOne,
    CreateDateColumn
} from "typeorm";
import { User } from "./User";


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

    @ManyToOne(() => User, user => user.posts, {onDelete: "CASCADE"})
    author: User;

    @Column("text", { array: true })
    imageUrls: string[];

    //if restrictedTo is null, the post is public (anyone can see it)
    //"PRIVATE" | "FOLLOWERS"
    @Column({nullable: true })
    restrictedTo: string; 
}

