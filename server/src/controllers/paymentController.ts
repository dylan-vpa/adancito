import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getOne, getAll, runQuery, getCurrentTimestamp } from '../models/db';

/**
 * Get user's coin balance
 */
export function getUserCoins(req: AuthRequest, res: Response) {
    try {
        const coins = getOne<{ total_coins: number }>(
            'SELECT total_coins FROM user_coins WHERE user_id = ?',
            [req.userId!]
        );

        res.json({
            success: true,
            data: { total_coins: coins?.total_coins || 0 }
        });
    } catch (error) {
        console.error('Get user coins error:', error);
        res.status(500).json({ success: false, error: 'Failed to get coins' });
    }
}

/**
 * Purchase coins (PayPal integration placeholder)
 */
export function purchaseCoins(req: AuthRequest, res: Response) {
    try {
        const { amount, price, paypal_order_id } = req.body;

        if (!amount || !price || !paypal_order_id) {
            return res.status(400).json({
                success: false,
                error: 'Amount, price, and PayPal order ID are required'
            });
        }

        const now = getCurrentTimestamp();

        // Record transaction
        runQuery(
            `INSERT INTO coin_transactions (user_id, amount, price, paypal_order_id, status, created_at)
       VALUES (?, ?, ?, ?, 'completed', ?)`,
            [req.userId!, amount, price, paypal_order_id, now]
        );

        // Update or create user coins
        const existingCoins = getOne<{ id: number; total_coins: number }>(
            'SELECT id, total_coins FROM user_coins WHERE user_id = ?',
            [req.userId!]
        );

        if (existingCoins) {
            runQuery(
                'UPDATE user_coins SET total_coins = ?, updated_at = ? WHERE user_id = ?',
                [existingCoins.total_coins + amount, now, req.userId!]
            );
        } else {
            runQuery(
                'INSERT INTO user_coins (user_id, total_coins) VALUES (?, ?)',
                [req.userId!, amount]
            );
        }

        res.json({
            success: true,
            message: 'Coins purchased successfully',
            data: { total_coins: (existingCoins?.total_coins || 0) + amount }
        });
    } catch (error) {
        console.error('Purchase coins error:', error);
        res.status(500).json({ success: false, error: 'Failed to purchase coins' });
    }
}

/**
 * Get transaction history
 */
export function getTransactions(req: AuthRequest, res: Response) {
    try {
        const transactions = getAll(
            'SELECT * FROM coin_transactions WHERE user_id = ? ORDER BY created_at DESC',
            [req.userId!]
        );

        res.json({
            success: true,
            data: transactions
        });
    } catch (error) {
        console.error('Get transactions error:', error);
        res.status(500).json({ success: false, error: 'Failed to get transactions' });
    }
}
