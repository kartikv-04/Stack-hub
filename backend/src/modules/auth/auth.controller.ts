import type { Request, Response } from "express";
import { loginUser, logoutUser, registerUser } from "./auth.service.js";
import logger from "../../config/logger.js";
import { UserModel } from "./auth.model.js";

export const registerController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        logger.info(`Registering user with email: ${email}`);
        const result = await registerUser({ email, password });
        return res.status(result.status).json({
            success: result.success,
            data: {
                message: result.data.message,
            }
        });
    } catch (error) {
        logger.error('Registration error:'+ error);
        return res.status((error as any).status || 500).json({
            success: false,
            message: (error as any).message || 'Registration failed'
        });
    }
}

export const loginController = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await loginUser({ email, password });
        
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', result.data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });

        // Return response matching frontend expectations
        return res.status(200).json({
            success: true,
            refreshToken: result.data.refreshToken, // Get from result.data
            userId: result.data.userId, // Get from result.data
            data: {
                message: result.data.message,
                accessToken: result.data.accessToken,
            }
        });
    } catch (error) {
        logger.error('Login error:' + error);
        return res.status((error as any).status || 500).json({
            success: false,
            message: (error as any).message || 'Login failed'
        });
    }
}

export const logoutController = async (req: Request, res: Response) => {
    try {
        // Try to get refresh token from request body first, then from cookies
        let refreshToken = req.body.refreshToken || req.cookies.refreshToken;
        
        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: "Refresh token required"
            });
        }

        const result = await logoutUser(refreshToken);
        
        // Clear the refresh token cookie
        res.clearCookie('refreshToken');
        
        return res.status(result.status).json(result);
    } catch (error) {
        logger.error('Logout error:' + error);
        return res.status((error as any).status || 500).json({
            success: false,
            message: (error as any).message || 'Logout failed'
        });
    }
}

export const meController = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      logger.info("me: no refresh token present");
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const user = await UserModel.findOne({ refreshToken }).select("_id email");
    if (!user) {
      logger.info("me: refresh token not matched");
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    return res.json({
      success: true,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    logger.error("me error: " + err);
    return res.status(500).json({ success: false, message: "Auth check failed" });
  }
};