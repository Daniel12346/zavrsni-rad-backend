import { User } from "../@types/express/entity/User";
import { AuthenticationError } from "apollo-server-core";
import { Post } from "../@types/express/entity/Post";



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

const user = (_, { id }: { [key: string]: string }, { req }: Context) => {
  return User.findOne({ id }, { relations: [] });
};

//finds all users
const users = async () => {
  return User.find();
};


const posts = async () => {
  return Post.find({ relations: ["author"] });
};

const post = async (_, { id }) => {
  return Post.findOne({ id }, { relations: ["author"] });
};


const queryResolvers = {
  Query: {
    me,
    user,
    users,
    post,
    posts
  },
};

export default queryResolvers;
