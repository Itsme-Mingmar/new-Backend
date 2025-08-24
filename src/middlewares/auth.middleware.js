import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { user } from "../models/user.model.js";
import { apierror } from "../utils/apiError.js";

const jwtVerify = asyncHandler(async(req, _, next)=>{
    try {
        const token = req.cookies?.accesstoken || req.header("authorization")?.replace("Bearer ", "")
        if(!token){
        throw new apierror(401, "Unauthorized request")
    }
    
    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
    const client = await user.findById(decodedToken?.id).select("-password -refreshToken");
    if(!client){
        throw new apierror(400, "Invalid token")
    }
    req.user = client;
    next();
        } catch (error) {
            throw new apierror(401, "Invalid access token")
        }
    
});
export default jwtVerify;
