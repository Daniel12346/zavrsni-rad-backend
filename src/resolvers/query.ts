import { User } from "../@types/express/entity/User";
import { AuthenticationError } from "apollo-server-core";
import { Post } from "../@types/express/entity/Post";
import { Like } from "typeorm";



interface Request {
  userId: string;
  isAuth: Boolean;
}
interface Context {
  req: Request;
}


//TODO: fix
const me = (_, __, { req }: Context) => {
  if (!req.isAuth) {
    throw new AuthenticationError("Not authenticated");
  }
  //TODO: relations
  return User.findOne({ id: req.userId }, { relations: ["posts", "following", "followers"] });
};

const user = (_, { id }: any, { req }: Context) => {
  return User.findOne({ id }, { relations: ["posts", " followers", "following"] });
};

//finds all users
const users = async () => {
  return User.find({ relations: ["followers", "following"] });
};

const usersByKey = async (_, { key }: any) => {
  return User.find({
    where: [
      { firstName: Like(`%${key}%`) },
      { lastName: Like(`%${key}%`) }]
  })
}

const posts = async () => {
  return Post.find({ relations: ["author"] });
};

const postsByKey = async (_, { key }: any) => {
  return Post.find({
    where: [
      { title: Like(`%${key}%`) },
      { text: Like(`%${key}%`) }]
  })
}

const post = async (_, { id }) => {
  return Post.findOne({ id }, { relations: ["author"] });
};


const queryResolvers = {
  Query: {
    me,
    user,
    users,
    post,
    posts,
    usersByKey,
    postsByKey
  },
};

export default queryResolvers;
