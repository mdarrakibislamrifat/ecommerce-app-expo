import { NextFunction, Request, Response } from "express";
import User from "../models/User.js";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { userId } = await req.auth();
    if (!userId) {
      return res.status(401).send({ success: false, message: "Unauthorized" });
    }
    let user = await User.findOne({ clerkId: userId });
    req.user = user;
    next();
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .send({ success: false, message: "Internal Server Error" });
  }
};

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!roles.includes(req.user.role)) {
        return res.status(403).send({ success: false, message: "You are not authorized" });
      }
      next();
    } catch (err) {
      console.log(err);
      return res
        .status(500)
        .send({ success: false, message: "Internal Server Error" });
    }
  };
};
