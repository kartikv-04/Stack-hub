import ApiError from "../../util/ApiError.js";
import type { Authpayload } from "./auth.type.js";
import { UserModel } from "./auth.model.js";
import logger from "../../config/logger.js";
import { createHashPassword, generateRefreshToken } from "../../util/helper.js";
import bcrypt from "bcrypt";
import { generateAccessToken } from "../../util/helper.js";
import { v4 as uuidv4 } from 'uuid';



export const registerUser = async ({ email, password }: Authpayload) => {
    const userExist = await UserModel.findOne({ email });
    if (userExist) {
        logger.warn(`Registration attempt with existing email: ${email}`);
        throw new ApiError("Email Already Exists", 400);
    }
    const hashPassword = await createHashPassword(password);
    const newUser = new UserModel({ email, password: hashPassword });
    await newUser.save();
    logger.info('New user registered successfully');
    return { success: true, status: 201, data: { message: "User Registered Successfully" } };
}

export const loginUser = async ({ email, password }: Authpayload) => {
    const findUser = await UserModel.findOne({ email });
    if (!findUser) {
        logger.warn(`Login attempt with unregistered email: ${email}`);
        throw new ApiError("Invalid Email or Password", 401);
    }
    const checkPassword = await bcrypt.compare(password, findUser.password);
    if (!checkPassword) {
        logger.warn('Login attempt with incorrect password');
        throw new ApiError("Invalid Email or PAssword", 401);
    }
    const accessToken = generateAccessToken({ email: findUser.email, id: findUser._id });
    const id = uuidv4();
    const refreshToken = generateRefreshToken({id});
    findUser.refreshToken = refreshToken;
    await findUser.save();



    logger.info(`User logged in successfully with email: ${email}`);
    
    return {
        success: true,
        status: 200,
        data: {
            message: "Login Successful",
            accessToken: accessToken,
            refreshToken: refreshToken,
            userId: findUser._id.toString(),
            user: {
                id: findUser._id.toString(),
                email: findUser.email
            }
        }
    };
}

export const logoutUser = async (refreshToken : string) =>{
    const user = await UserModel.findOne({ refreshToken });
    if(!user){
        logger.warn(`Logout attempt with invalid token` );
        throw new ApiError("Invalid refresh token", 400);
    }
    user.refreshToken = null;
    await user.save();
    logger.info("Logged out successfully");
    return {
        success : true,
        status : 200,
        data : {
            message : "Logged out successfully",
        }
    }
}