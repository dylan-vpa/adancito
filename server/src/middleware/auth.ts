import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AuthRequest extends Request {
    userId?: string;
    user?: any;
}

/**
 * Middleware to verify JWT token and attach user ID to request
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'No token provided'
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };

        // Attach user ID to request
        req.userId = decoded.userId;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token'
        });
    }
}

/**
 * Generate JWT token for user
 */
export function generateToken(userId: string): string {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '7d' } // Token expires in 7 days
    );
}
