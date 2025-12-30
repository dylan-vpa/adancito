import express from 'express';
import { register, login, getMe, logout, forgotPassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.post('/logout', authMiddleware, logout);

export default router;
