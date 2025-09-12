import jwt from 'jsonwebtoken';
import { SECRET_KEY } from '../config/env.js';
import ApiError from '../util/ApiError.js';
import type { Request, Response, NextFunction } from 'express';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        if (!SECRET_KEY) {
            return res.status(500).json({ error: 'Secret key not configured' });
        }
        if (!token) {
            return res.status(401).json({ error: 'Token missing from header' });
        }
        const decoded = jwt.verify(token, SECRET_KEY);
        (req as any).user = decoded; // Attach user info to request
        next();
    } catch (err) {
        // return res.status(401).json({ error: 'Invalid token' });
        throw new ApiError('Invalid token', 401);
    }
};
