import { v2 as cloudinary } from 'cloudinary';
import fs from "fs";
    // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: API_KEY, 
        api_secret: API_SECRET 
    });

const uploadOnCloudinary = async (filepath) => {
    try{
        if(!filepath) return null;
        const response = await cloudinary.uploader.upload(filepath, {resource_type: "auto"});
        console.log("file upload successfully", response.url);
        return response;
    }catch(error){
        fs.unlinkSync(filepath);  // helps to remove the file from temporary save on server 
        return null;
    }
    
}
export {uploadOnCloudinary};