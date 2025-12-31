import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOne, getAll, runQuery, generateId } from '../models/db';

/**
 * Generate referral code for user
 */
function generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const section1 = Array.from({ length: 6 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    const section2 = Array.from({ length: 4 }, () =>
        chars[Math.floor(Math.random() * chars.length)]
    ).join('');
    return `ADAN-${section1}-${section2}`;
}

/**
 * Get or generate user's referral code
 */
export function getReferralCode(req: AuthRequest, res: Response) {
    try {
        const user = getOne<{ referral_code: string | null }>(
            'SELECT referral_code FROM users WHERE id = ?',
            [req.userId!]
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        let referralCode = user.referral_code;

        // Generate if doesn't exist
        if (!referralCode) {
            referralCode = generateReferralCode();
            runQuery(
                'UPDATE users SET referral_code = ? WHERE id = ?',
                [referralCode, req.userId!]
            );
        }

        res.json({
            success: true,
            data: { referral_code: referralCode }
        });
    } catch (error) {
        console.error('Get referral code error:', error);
        res.status(500).json({ success: false, error: 'Failed to get referral code' });
    }
}

/**
 * Get user's referral count
 */
export function getReferralCount(req: AuthRequest, res: Response) {
    try {
        const user = getOne<{ total_referrals: number }>(
            'SELECT total_referrals FROM users WHERE id = ?',
            [req.userId!]
        );

        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json({
            success: true,
            data: { total_referrals: user.total_referrals }
        });
    } catch (error) {
        console.error('Get referral count error:', error);
        res.status(500).json({ success: false, error: 'Failed to get referral count' });
    }
}

/**
 * Submit user feedback
 */
export function submitFeedback(req: AuthRequest, res: Response) {
    try {
        const { rating, feedback_type, message } = req.body;

        if (!rating || !message) {
            return res.status(400).json({
                success: false,
                error: 'Rating and message are required'
            });
        }

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                error: 'Rating must be between 1 and 5'
            });
        }

        const user = getOne<{ email: string }>(
            'SELECT email FROM users WHERE id = ?',
            [req.userId!]
        );

        runQuery(
            `INSERT INTO user_feedback (user_id, email, rating, feedback_type, message, created_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [req.userId!, user?.email || null, rating, feedback_type || null, message]
        );

        res.json({
            success: true,
            message: 'Feedback submitted successfully'
        });
    } catch (error) {
        console.error('Submit feedback error:', error);
        res.status(500).json({ success: false, error: 'Failed to submit feedback' });
    }
}

/**
 * Get list of users referred by current user
 */
export function getReferrals(req: AuthRequest, res: Response) {
    try {
        const referrals = getAll<{
            id: string;
            email: string;
            full_name: string | null;
            created_at: string;
        }>(
            'SELECT id, email, full_name, created_at FROM users WHERE referred_by = ? ORDER BY created_at DESC',
            [req.userId!]
        );

        res.json({
            success: true,
            data: { referrals }
        });
    } catch (error) {
        console.error('Get referrals error:', error);
        res.status(500).json({ success: false, error: 'Failed to get referrals' });
    }
}
