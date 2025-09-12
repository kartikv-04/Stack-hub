import {body ,validationResult} from "express-validator";
import type { Request, Response, NextFunction } from "express";

export const userValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail() // Sanitizes email (lowercase, removes dots from gmail, etc.)
            .isLength({ max: 255 })
            .withMessage('Email must not exceed 255 characters'),
        
        body('password')
            .isLength({ min: 8 })
            .withMessage('Password must be at least 8 characters long')
            .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
            .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
        
    ];
}

// Middleware to check validation results
export const checkValidationResults = (req : Request, res : Response, next : NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array()
        });
    }
    next();
};
// Validation rules for signin route (only require email and password, no password strength)
export const signinValidationRules = () => {
    return [
        body('email')
            .isEmail()
            .withMessage('Invalid email format')
            .normalizeEmail()
            .isLength({ max: 255 })
            .withMessage('Email must not exceed 255 characters'),
        body('password')
            .notEmpty()
            .withMessage('Password is required'),
    ];
};