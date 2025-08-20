import mongoose, {Schema, Types} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
const userSchema = new Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index: true

    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true, 
    },
    fullName: {
        type: String,
        required: true,
        index: true,
        trim: true
    },
    avatar: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    coverImage: {
        type: String
    },
    watchHistory: [
        {
            type: Schema.Types.ObjectId,
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
export const user = mongoose.model("user", userSchema);