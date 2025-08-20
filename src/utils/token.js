import jwt from "jsonwebtoken";

function generateAccessToken(user) {
  return jwt.sign(
    { id: user._id, userName: user.userName },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } 
  );
}

function generateRefreshToken(user) {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } 
  );
}
export {generateAccessToken, generateRefreshToken}
