import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";
import { apierror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";

const userList = asyncHandler(async(req, res)=>{
  const users = await user.find().select("-password -refreshToken"); 
  res.status(200).json(new apiResponse(200, users, "Access users successfully"));
});
const userDelete = asyncHandler(async(req, res)=>{
    const {userId} = req.body;
    if(!userId){
        throw new apierror(400, "user not found")
    }
    const result = await user.findByIdAndDelete(userId);
    res.status(200).json(new apiResponse(200, result, "User delete successfully"))
});
export {userList, userDelete};
