import { asyncHandler } from "../utils/asyncHandler.js";

const authorizeRole = asyncHandler((req, res, next)=>{ 
        if (req.user.role !== "admin") {
        return res.status(403).json({ message: "You are not allowed to access this" });
        }
    next();

});
export default authorizeRole;