import mongoose, { Schema } from "mongoose";
import { type User } from "./auth.type.js";

const userSchema = new Schema<User>({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    refreshToken : {
        type : String, 
        default : null
    }
}, { timestamps: true })

export const UserModel = mongoose.model<User>("User", userSchema);