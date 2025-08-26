import { Router } from "express";
import { userLogin, userLogout, userRegister, refrestAccesstoken, changePassword, updateAccountDetails, updateAvatarImage } from "../controllers/user.controller.js";
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
userRouter.post("/refresh-token", refrestAccesstoken);
userRouter.post("/changePassword",jwtVerify, changePassword);
userRouter.post("/updateDetails", jwtVerify,updateAccountDetails);
userRouter.post("/updateImage", upload.single("avatar"),jwtVerify,updateAvatarImage);
export {userRouter};
