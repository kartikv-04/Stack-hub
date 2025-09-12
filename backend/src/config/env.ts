import dotenv from 'dotenv';
dotenv.config();



export const PORT = process.env.PORT;
export const NODE_ENV = process.env.NODE_ENV;  // will be string
export const LOG_LEVEL = process.env.LOG_LEVEL; // will be string
export const MONGO_URI = process.env.MONGO_URI; // will be string
export const SECRET_KEY = process.env.JWT_SECRET; // will be string