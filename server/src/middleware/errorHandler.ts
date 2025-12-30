import { Request, Response, NextFunction } from 'express';

/**
 * Global error handling middleware
 */
export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
) {
    console.error('Error:', err);

    // Check if headers already sent
    if (res.headersSent) {
        return next(err);
    }

    res.status(500).json({
        success: false,
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
}
