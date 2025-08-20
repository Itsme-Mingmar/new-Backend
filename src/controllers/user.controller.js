import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";
import { apierror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const userRegister = asyncHandler(async (req, res)=> {
    const {userName, email, fullName, password} = req.body

    if([userName, email, fullName, password].some((field)=>{
        field?.trim() === ""
    })){
        throw new apierror(400, "All fields are required")
    }

    const existetUser = await user.findOne({
        $or: [{userName}, {email}]
    })
    if(existetUser){
        throw new apierror(409, "This credientials are already exist")
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if(!avatarLocalPath){
        throw new apierror(400, "file is required:")
    }
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new apierror(400, "Avator file is required")
    }
    const User = await user.create({
        userName: userName.toLowerCase(),
        fullName,
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    });
    const createdUser = await user.findById(User._id).select("-password -refreshToken")
    if(!createdUser){
        throw new apierror(500, "User is not created")
    }
    return res.status(201).json(
        new apiResponse(200, "User created successfully", createdUser)
    );

});

export {userRegister};