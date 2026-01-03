import { Response } from 'express';
import bcrypt from 'bcrypt';
import { AuthRequest, generateToken } from '../middleware/auth';
import { getOne, runQuery, generateId, getCurrentTimestamp, getAll } from '../models/db'; // Added getAll

interface User {
    id: string;
    email: string;
    password_hash: string;
    full_name?: string;
    avatar_url?: string;
    referral_code?: string;
    total_referrals: number;
    created_at: string;
    updated_at: string;
}

const SALT_ROUNDS = 10;

/**
 * Register a new user
 */
export async function register(req: AuthRequest, res: Response) {
    try {
        const { email, password, full_name } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        // Check if user already exists
        const existingUser = getOne<User>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (existingUser) {
            return res.status(400).json({
                success: false,
                error: 'User with this email already exists'
            });
        }

        // Hash password
        const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

        // Create user
        const userId = generateId();
        const now = getCurrentTimestamp();

        // Handle referral code if provided
        let referrerId: string | null = null;
        const { referral_code } = req.body;

        if (referral_code) {
            const referrer = getOne<{ id: string }>('SELECT id FROM users WHERE referral_code = ?', [referral_code]);
            if (referrer) {
                referrerId = referrer.id;
                console.log(`[Register] User referred by: ${referrerId}`);
            } else {
                console.log(`[Register] Invalid referral code: ${referral_code}`);
            }
        }

        runQuery(
            `INSERT INTO users (id, email, password_hash, full_name, referred_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, password_hash, full_name || null, referrerId, now, now]
        );

        // If referred, increment referrer's total_referrals
        if (referrerId) {
            runQuery(
                'UPDATE users SET total_referrals = total_referrals + 1 WHERE id = ?',
                [referrerId]
            );
            console.log(`[Register] ✅ Incremented referral count for ${referrerId}`);
        }

        // Initialize user coins
        runQuery(
            'INSERT INTO user_coins (user_id, total_coins) VALUES (?, ?)',
            [userId, 1000] // Beta user grant: 1000 coins for full project lifecycle
        );

        // Generate token
        const token = generateToken(userId);

        // Get created user (without password)
        const user = getOne<User>('SELECT id, email, full_name, avatar_url, referral_code, total_referrals, created_at FROM users WHERE id = ?', [userId]);

        res.status(201).json({
            success: true,
            data: { user, token }
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to register user'
        });
    }
}

/**
 * Login user
 */
export async function login(req: AuthRequest, res: Response) {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }


        // Get user
        const user = getOne<User>(
            'SELECT * FROM users WHERE email = ?',
            [email]
        );

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                error: 'Invalid email or password'
            });
        }

        // Generate token
        const token = generateToken(user.id);

        // Return user without password
        const { password_hash, ...userWithoutPassword } = user;

        res.json({
            success: true,
            data: {
                user: userWithoutPassword,
                token
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to login'
        });
    }
}

/**
 * Get current user
 */
export function getMe(req: AuthRequest, res: Response) {
    try {
        const user = getOne<User>(
            'SELECT id, email, full_name, avatar_url, referral_code, total_referrals, created_at FROM users WHERE id = ?',
            [req.userId!]
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get user'
        });
    }
}

/**
 * Logout (client-side token removal)
 */
export function logout(req: AuthRequest, res: Response) {
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
}

/**
 * Forgot password (placeholder - would send email in production)
 */
export function forgotPassword(req: AuthRequest, res: Response) {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            error: 'Email is required'
        });
    }

    // In production, this would send a password reset email
    // For now, just return success
    res.json({
        success: true,
        message: 'Password reset link would be sent to your email'
    });
}

/**
 * Get users referred by current user
 */
export function getReferrals(req: AuthRequest, res: Response) {
    try {
        const referrals = getAll<{ id: string; email: string; full_name: string | null; created_at: string; avatar_url: string | null }>(
            'SELECT id, email, full_name, created_at, avatar_url FROM users WHERE referred_by = ? ORDER BY created_at DESC',
            [req.userId!]
        );

        // Mask emails for privacy (e.g., j***@gmail.com)
        const maskedReferrals = referrals.map((ref: { id: string; email: string; full_name: string | null; created_at: string; avatar_url: string | null }) => {
            const [name, domain] = ref.email.split('@');
            const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : `${name}***`;
            return {
                ...ref,
                email: `${maskedName}@${domain}`
            };
        });

        res.json({
            success: true,
            data: {
                referrals: maskedReferrals
            }
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get referrals'
        });
    }
}
