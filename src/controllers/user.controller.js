import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
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
    const {userName, email, fullName, password, role} = req.body

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
        role: role || "user",
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
const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body;

    if (!(email || fullName)) {
        throw new apierror(400, "Please provide email or full name to update");
    }

    const updatedUser = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {  
                ...(fullName && { fullName }),
                ...(email && { email })
            }
        },
        { new: true }
    ).select("-password");

    if (!updatedUser) {
        throw new apierror(404, "User not found");
    }

    res.status(200).json({
        success: true,
        message: "Update successful",
        user: updatedUser
    });
});

const updateAvatarImage = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new apierror(400, "File path not received");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if (!avatar?.url) {
        throw new apierror(400, "Failed to upload on Cloudinary");
    }

    const newAvatar = await user.findByIdAndUpdate(
        req.user?._id,
        {
            $set: { avatar: avatar.url }  
        },
        { new: true }
    ).select("-password");

    if (!newAvatar) {
        throw new apierror(404, "User not found");
    }

    res.status(200).json({
        success: true,
        message: "File update successful",
        user: newAvatar
    });
});
const getUserChannel = asyncHandler(async(req, res)=>{
   const { username } = req.body;  

if (!username) {
    throw new apierror(400, "Invalid channel");
}

const channel = await user.aggregate([
    {
        $match: { userName: username.toLowerCase() }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as: "subscribers"
        }
    },
    {
        $lookup: {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as: "subscribed"
        }
    },
    {
        $addFields: {
            noSubscribers: { $size: "$subscribers" },
            noSubscribed: { $size: "$subscribed" },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullName: 1,
            userName: 1,
            noSubscribers: 1,
            noSubscribed: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
        }
    }
]);
    if(!channel){
        throw new apierror(
            400,
            "Channel does not exit"
        )
    }
 res.status(200).json({
    success: true,
    message: "access channel information successfully",
    data: channel
});

});

const subscribe = asyncHandler(async(req, res)=>{
    try {
        const {channelId} = req.body;
        if(!channelId){
            throw new apierror(400, "channel not found")
        }
        const clientId = req.user?._id;
        if(clientId.toString()===channelId){
            throw new apierror(400, "You cannot subscribed yourself")
        }
        const subscription = await Subscription.create({
            subscriber: clientId,
            channel: channelId
        });
        res.status(200).json(
            new apiResponse(200, subscription, "subscribed successfully")
        );
        
    } catch (error) {
        throw new apiResponse(500, null, error.message)
    }

});
const unSubscribe = asyncHandler(async(req, res)=>{
 try {
       const {channelId} = req.body;
       if(!channelId){
               throw new apierror(400, "channel not found")
       }
       const clientId = req.user?._id;
       const result = await Subscription.findOneAndDelete({
           subscriber: clientId,
           channel: channelId
       });
        if (!result) {
         throw new apierror(404, "You are not subscribed to this channelr");
       }
       res.status(200).json(
           new apiResponse(200, "Unsubscribed successfully")
       )
 } catch (error) {
     res.status(error.statusCode || 500).json(new apiResponse(500, null, error.message));
 }
});

export {userRegister, userLogin, userLogout, refrestAccesstoken, changePassword, getCurrentUser, updateAccountDetails, updateAvatarImage, getUserChannel, subscribe, unSubscribe};