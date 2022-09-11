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
  return User.findOne({ id: req.userId }, { relations: ["posts", "following", "followers"] });
};

const user = (_, { id }: any, { req }: Context) => {
  return User.findOne({ id }, { relations: ["posts", "followers", "following"] });
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


const postsByKey = async (_, { key }: any) => {
  return Post.find({
    where: [
      { title: Like(`%${key}%`) },
      { text: Like(`%${key}%`) }], relations: ["author"]
  })
}

const post = async (_, { id }) => {
  return Post.findOne({ id }, { relations: ["author"] });
};

const posts = async () => {
  return Post.find({ relations: ["author"] });
};

//public posts and posts shared with user by users they follow
const viewablePosts = async (_, {showPublicPosts} , {req}: Context) => {
  try{
  const me= await User.findOne({ id: req.userId }, { relations: ["posts", "following", "followers"] });
  const allPosts =await Post.find({relations: ["author", "author.followers"]});
  return allPosts.filter(post=>(showPublicPosts && !post.restrictedTo) 
      || (post.restrictedTo === "FOLLOWERS" && (post.author?.followers?.find(user=>user.id === me.id) ?? 0)))
    }catch(e){
    throw e;
  }   
}


const queryResolvers = {
  Query: {
    me,
    user,
    users,
    post,
    posts,
    viewablePosts,
    usersByKey,
    postsByKey
  },
};

export default queryResolvers;
