import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import { SECRET_KEY } from "../config/env.js";
import logger from "../config/logger.js";






export const createHashPassword = async (password: string): Promise<string> => {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const getHashedPassword = await bcrypt.hash(password, salt);
    return getHashedPassword;
};

export const generateAccessToken = (payload: Object): string => {
    if (!SECRET_KEY) {
        throw new Error("SECRET_KEY is not defined in environment variables.");
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '15m' });
    return token;
}

export const generateRefreshToken = (payload: { id: string }): string => {
    if (!SECRET_KEY) {
        logger.error("SECRET_KEY is not defined in environment variables.");
        throw new Error("SECRET_KEY is not defined in environment variables.");
    }
    const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '7d' });
    return token;
}