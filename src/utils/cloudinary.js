import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET
});

const uploadOnCloudinary = async (filepath) => {
  console.log(process.env.API_KEY);
  try {
    if (!filepath) return null;

    const response = await cloudinary.uploader.upload(filepath, {
      resource_type: "auto",
    });

    console.log(" File uploaded successfully:", response.url);

    // Delete local file after upload
    fs.unlinkSync(filepath);

    return response;
  } catch (error) {
    console.error("Cloudinary upload failed:", error.message);

    // Try to delete the file only if it exists
    try {
      fs.unlinkSync(filepath);
    } catch (unlinkError) {
      console.warn("Failed to delete local file:", unlinkError.message);
    }

    return null;
  }
};

export { uploadOnCloudinary };
