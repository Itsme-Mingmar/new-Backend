import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";
import { apierror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";
import jwt from "jsonwebtoken";

const generateToken = async (userId) => {
    try {
        const client = await user.findById(userId);   
        if (!client) {
            throw new apierror(404, "User not found while generating token");
        }

        const accesstoken = generateAccessToken({ id: client._id, email: client.email });
        const refreshtoken = generateRefreshToken({ id: client._id });

        client.refreshToken = refreshtoken;   
        await client.save({ validateBeforeSave: false });

        return { accesstoken, refreshtoken };
    } catch (error) {
        throw new apierror(500, "Something went wrong while generating token");
    }
};
const refrestAccesstoken = asyncHandler(async(req, res)=>{
   try {
     const refreshtoken = req.cookies.refreshtoken || req.body.refreshtoken
     if(!refreshtoken){
         throw new apierror(401, "unauthorized access")
     }
     const decodedToken = jwt.verify(refrestAccesstoken, process.env.REFRESH_TOKEN_SECRET);
     const client = user.findById(decodedToken?._id);
     if(!client){
         throw new apierror(400, "Invalid refresh token")
     }
     if(refreshtoken !== client?.refreshToken){
         throw new apierror(400, "Invalid refresh token or expired")
     }
     const {accesstoken, newrefreshtoken }= await generateToken(client._id);
     const options = { 
         httpOnly: true,
         secure: true
     }
     return res.status(200)
     .cookie("accesstoken", accesstoken, options)
     .cookie("newrefreshtoken", newrefreshtoken, options)
     .json(
         new apiResponse(200, 
             {
             accesstoken, refreshtoken: newrefreshtoken
             },
             "refresh accesstoken successfully")
     )
   } catch (error) {
    throw new apierror(400, "Invalid refreshtoken")
   }
})

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
const userLogin = asyncHandler(async (req, res)=>{
    const {email, userName, password} = req.body
    if(!(email || userName)){
        throw new apierror(400, "Email or userName required");
    }
    const client = await user.findOne({
        $or: [{email}, {userName}]
    })
    if(!client){
        throw new apierror(400, "User doesnt exit")
    }
    const ispasswordValid = await client.isCorrectPassword(password);
    if (!ispasswordValid) {
        throw new apierror(401, "Invalid password");
    }
    const {accesstoken, refreshtoken} = await generateToken(client._id);
    const loggedInclient = await user.findById(client._id).select("-password -refreshToken")

    const options = { 
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .cookie("accesstoken", accesstoken, options)
    .cookie("refreshtoken", refreshtoken, options)
    .json(
        {
            client: loggedInclient, accesstoken, refreshtoken
        },
        new apiResponse(200, "userLogin successfully")
    )


});
const userLogout = asyncHandler(async(req, res)=>{
    await user.findByIdAndUpdate(req.user._id,
         {$set:{
            refreshtoken: undefined
         } },
         {new: true}
    )
    const options = { 
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearCookie("accesstoken", options)
    .clearCookie("refreshtoken", options)
    .json(
        new apiResponse(200, {}, "userLogout successfully")
    )
})
const changePassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;
    const client = await user.findById(req.user?._id);
    const checkPassword = await client.isCorrectPassword(oldPassword);
    if(!checkPassword){
        throw new apierror(400, "Wrong password");
    }
    client.password = newPassword;
    await client.save({validateBeforeSave: false});
    return res.status(200).json(new apiResponse(200, {},"Password change successfully"))
})
const getCurrentUser = asyncHandler(async(req, res)=>{
    return res.status(200).json(200, req.user, "current user" )
})
const updateAccountDetails = asyncHandler(async(req, res)=>{
    const {fullName, email} = req.body;
    if(!(email || fullName)){
        throw new apierror(401, "unauthorized access")
    }
    const client = user.findByIdAndUpdate(req.user?._id, {
        set: {
            fullName: fullName,
            email: email
        } 
    }, {new: true}).select("-password");
    res.status(200).json(200, client, "Update successful");
    
})
const updateAvatarImage = asyncHandler(async(req, res)=>{
    const avatarPath = req.file6?.path;
    if(!avatarPath){
        throw new apierror(400, "file path not received");
    }
    const avatar = uploadOnCloudinary(avatarPath);
    if(!avatar.url){
        throw new apierror(400, "failed to upload on cloudinary")
    }
    const newAvatar = await user.findByIdAndUpdate(req.user?._id, {
        set: {
            avatar: avatar.url
        }
    }, {new: true}).select("-password");
    res.status(200).json(200, newAvatar, "file update successful");
});

export {userRegister, userLogin, userLogout, refrestAccesstoken, changePassword, getCurrentUser, updateAccountDetails, updateAvatarImage};