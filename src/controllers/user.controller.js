import { asyncHandler } from "../utils/asyncHandler.js";
import { user } from "../models/user.model.js";
import { apierror } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { generateAccessToken, generateRefreshToken } from "../utils/token.js";

const generateToken = async (userId)=>{
    try{
        const client = await findById(userId)
        const accesstoken = generateAccessToken({ id: client._id, email: client.email });
        const refreshtoken = generateRefreshToken({ id: client._id });
        client.refreshtoken = refreshtoken
        await client.save({validateBeforeSave: false})
        return {accesstoken, refreshtoken}
    }
    catch(error){
        throw new apierror(500, "something went wrong wrong while generationg token" )
    }
}

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
        throw new apierror(400, "Email or password required");
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
    const loggedInclient = await user.findById(client._id).select("-password -refreshtoken")

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
        new apiResponse(200, {}, "userLogin successfully")
    )

    
})

export {userRegister, userLogin, userLogout};