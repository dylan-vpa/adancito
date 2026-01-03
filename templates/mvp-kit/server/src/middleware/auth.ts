import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'mvp-secret-key';

export interface AuthRequest extends Request {
    user?: { id: string; email?: string };
}

/**
 * Auth middleware - extracts user from JWT token
 * For MVP purposes, also allows unauthenticated requests (creates guest user)
 */
export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };
            req.user = { id: decoded.userId, email: decoded.email };
        } else {
            // Allow unauthenticated for MVP - create guest user
            req.user = { id: 'guest-user', email: 'guest@mvp.local' };
        }

        next();
    } catch (error) {
        // Token invalid - use guest
        req.user = { id: 'guest-user', email: 'guest@mvp.local' };
        next();
    }
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, email?: string): string {
    return jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '7d' });
}
