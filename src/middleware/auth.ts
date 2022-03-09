import { NextFunction } from "express";
import { AuthenticationError } from "apollo-server-core";
import { isDev } from "../utils";
import jwt from "jsonwebtoken";

export default (req: any, res: Express.Response, next: NextFunction) => {
  //TODO: error codes and other fixes
  const authHeader = req.get("Authorization");
  if (!authHeader) {
    req.isAuth = false;
    if (isDev) {
      throw new AuthenticationError("Auth header not found");
    }
    return next();
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    req.isAuth = false;
    return next();
  }
  try {
    const decoded: any = jwt.verify(token, process.env.SECRET);
    req.userId = decoded.userId;
  } catch {
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  next();
};
