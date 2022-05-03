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
  user.posts = [];
  user.followers = [];
  user.following = [];

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

const uploadFiles = async (files) => {
  const uploadedFiles = [];
  files.forEach(async file => {
    const uploadedFile = await uploadFile(file);
    uploadedFiles.push(uploadedFile);
  })
  return uploadedFiles;
}

const uploadImage = async (_, { file, purpose }, { req }) => {
  try {
    const me = await User.findOne({ id: req.userId });
    const uploaded = await uploadFile(file);
    // "profile" | "background"
    purpose === "profile" ?
      me.profileImageUrl = uploaded.secure_url
      : me.backgroundImageUrl = uploaded.secure_url;
    await me.save();
    return { success: true }
  } catch (e) {
    throw e;
  }
}

const uploadPostImage = async (_, { file, postId, purpose }: { file: File, postId: string, purpose: "main" | "additional" }, { req }) => {
  try {
    const post = await Post.findOne({ id: postId });
    const uploaded = await uploadFile(file);
    purpose === "main" ?
      post.mainImageUrl = uploaded.secure_url
      : post.imageUrls.push(uploaded.secure_url);
    await post.save();
    return { success: true }
  } catch (e) {
    throw e;
  }
}

const uploadPostImages = async (_, { files, postId }: { files: File[], postId: string }, { req }) => {
  try {
    const post = await Post.findOne({ id: postId });
    const uploadedFiles = await uploadFiles(files);
    uploadedFiles.forEach((image => post.imageUrls.push(image.secure_url)))
    await post.save();
    return { success: true }
  } catch (e) {
    throw e;
  }
}


//TODO!!!: images should be uploaded like the profile image, not just by setting the url
const createPost = async (_, { mainImageFile, additionalImageFiles, title, text }, { req }) => {

  const post = new Post();
  let uploadedMainImage;
  let uploadedAdditionalImages;
  try {
    const author = await User.findOne({ id: req.userId });
    post.author = author;
    mainImageFile && (uploadedMainImage = await uploadFile(mainImageFile));
    additionalImageFiles && (uploadedAdditionalImages = await uploadFiles(additionalImageFiles));
  } catch (e) {
    throw new ApolloError(`user not found: ${e.message}`);
  }
  title && (post.title = title);
  text && (post.text = text);
  uploadedMainImage && (post.mainImageUrl = uploadedMainImage.secure_url);
  uploadedAdditionalImages && uploadedAdditionalImages.forEach(image => post.imageUrls.push(image.secure_url));

  await post.save();
  return post;
}

const followUser = async (_, { id }, { req }) => {
  try {
    //TODO: see if relations are needed in User.findOne()
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
    uploadPostImage,
    uploadPostImages,
    createPost,
    followUser
  },
};

export default mutationResolvers;
