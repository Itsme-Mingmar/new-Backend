import { Router } from "express";
import { userLogin, userLogout, userRegister } from "../controllers/user.controller.js";
import upload from "../middlewares/multer.middleware.js";
import jwtVerify from "../middlewares/auth.middleware.js";

const userRouter = Router();
userRouter.post(
  "/register",
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 }
  ]),
  userRegister
);
userRouter.post("/login", userLogin);
userRouter.post("/logout", jwtVerify, userLogout);

export {userRouter};