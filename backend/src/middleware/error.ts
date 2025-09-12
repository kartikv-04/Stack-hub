import type { Request, Response, NextFunction } from "express";
import ApiError from "../util/ApiError.js";
import logger from "../config/logger.js";

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    // Log the error for debugging
    logger.error("Unhandled error:", err);

    // If error is an instance of ApiError, use its status and message
    if (err instanceof ApiError) {
        return res.status(err.status).json({
            status: err.status,
            message: err.message,
        });
    }

    // Default fallback for unexpected errors
    res.status(500).json({
        status: 500,
        message: "Internal Server Error",
    });
};
