import mongoose, {Schema, Types} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    userName: {
        Type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true

    },
    email: {
        Type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
    },
    fullName: {
        Type: String,
        required: true,
        index: true,
        trim: true
    },
    avatar: {
        Type: String,
        required: true
    },
    refreshToken: {
        Type: String
    },
    password: {
        Type: String,
        required: true
    },
    coverImage: {
        Type: String
    },
    watchHistory: [
        {
            Type: Schema.Types.ObjectId,
            ref: ".."
        }
    ]

}, {
    timestamps: true
})
userSchema.pre("save", async function (next) {
    if(this.isModified("password")){
        this.password = bcrypt.hash(this.password, 10)
        next();
    }
    return next();
})
userSchema.methods.isCorrectPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.createToken = function (){
    return jwt.sign({
        _id : this._id,
        email: this.email,
        userName: this.userName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {expiresIn: ACCESS_TOKEN_EXPIRY }
)
}
userSchema.methods.createToken = async function (){
    return jwt.sign({
        _id : this._id
    },
    process.env.REFRESH_TOKEN_SECRET,
    {expiresIn: REFRESH_TOKEN_EXPIRY }
)
}
export const user = mongoose.model("user", userSchema);