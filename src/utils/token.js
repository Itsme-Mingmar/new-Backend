import jwt from "jsonwebtoken";

function generateAccessToken(payload) {
  return jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY } 
  );
}

function generateRefreshToken(payload) {
  return jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY } 
  );
}
export {generateAccessToken, generateRefreshToken}
