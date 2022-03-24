import { User } from "../@types/express/entity/User";
import * as yup from "yup";
import { comparePasswords } from "../utils/passwordService";
import { isDev } from "../utils";
import { ApolloError, UserInputError } from "apollo-server-core";
import jwt from "jsonwebtoken";
import cloudinary from "cloudinary"

import { ReadStream } from "typeorm/platform/PlatformTools";
import { Post } from "../@types/express/entity/Post";

const userInputSchema = yup.object().shape({
  firstName: yup.string().min(1),
  lastName: yup.string().min(1),
  email: yup.string().email(),
  password: yup.string().min(8),
});


//this is a placeholder return used because graphql does not allow returning void
interface MutationResult {
  success: boolean;
}

interface Context {
  req: Express.Request;
}

interface UserInput {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}

const createUser = async (_, input: UserInput): Promise<User> => {
  try {
    await userInputSchema.validate({
      input,
    });
  } catch (e: any) {
    //TODO: yup error formatting
    if (e) {
      throw new UserInputError(e);

    }
  }

  const isEmailUsed = await User.findOne({ where: { email: input.email } });
  if (isEmailUsed) {
    throw new Error("Email already in use");
  }

  const user = new User();
  user.email = input.email;
  user.password = input.password;
  user.firstName = input.firstName;
  user.lastName = input.lastName;

  try {
    await user.save();
  } catch (e) {
    throw e;
  }
  return user;
};


const deleteUser = async (_, { id }): Promise<MutationResult> => {
  try {
    const user = await User.findOne({ id })
    await User.remove(user);
  } catch (e) {
    throw e
  }
  return {
    success: true,
  };
};



const logIn = async (_, { email, password }, { req }: Context) => {
  //throwing an error if the user id is already set on req
  if ((req as any).userId) {
    throw new Error("A user is already logged in");
  }
  const user = await User.findOne({ where: { email } });
  //throwing an error if a user with the given email is not found
  if (!user) {
    throw new Error(isDev ? "Incorrect email" : "Incorrect password or email");
  }
  const hashed = user.password;

  //checking if the passwords match (using bcrypt)
  const isMatching = await comparePasswords(password, hashed);
  if (!isMatching) {
    throw new Error(
      isDev ? "Incorrect password" : "Incorrect password or email"
    );
  }

  const token = jwt.sign({ userId: user.id }, process.env.SECRET, {
    expiresIn: "1d",
  });
  //TOOD: decide if it needs to return the user
  return token;
};



const uploadFile = async (file) => {
  const { createReadStream } = await file;
  const fileStream: ReadStream = createReadStream();
  cloudinary.v2.config({ cloud_name: "deoaakggx", api_key: "413696494632221", api_secret: "vIruondb1MyWq_1HcHksEHRTxHk" });
  return new Promise<any>((resolve, reject) => {
    const cloudStream = cloudinary.v2.uploader.upload_stream((err, uploadedFile) => {
      err ? reject(err) : resolve(uploadedFile);
    });
    fileStream.pipe(cloudStream);
  });

}
const uploadImage = async (_, { file }, { req }) => {
  try {
    const me = await User.findOne({ id: req.userId });
    const uploaded = await uploadFile(file);
    me.profileImageUrl = uploaded.secure_url;
    await me.save();
    return { success: true }
  } catch (e) {
    throw e;
  }
}

//TODO: other images
const createPost = async (_, { mainImageUrl, title, text }, { req }) => {

  const post = new Post();
  try {
    const author = await User.findOne({ id: req.userId })
    post.author = author;
  } catch (e) {
    throw new ApolloError(`user not found: ${e.message}`);
  }
  post.imageUrls = [];
  mainImageUrl && (post.mainImageUrl = mainImageUrl);
  title && (post.title = title);
  text && (post.text = text);
  await post.save();
  return post;
}

const followUser = async (_, { id }, { req }) => {
  try {
    const me = await User.findOne({ id: req.userId });
    const userToFollow = await User.findOne({ id: id });
    me.following.push(userToFollow);
    userToFollow.followers.push(me);
    return { success: true }
  } catch (e) {
    throw new ApolloError(e.message)
  }
}

const mutationResolvers = {
  Mutation: {
    createUser,
    deleteUser,
    logIn,
    uploadImage,
    createPost,
    followUser
  },
};

export default mutationResolvers;
