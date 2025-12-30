import { Router } from 'express';
import { downloadDeliverable, generateDeliverable, completeByChatId } from '../controllers/deliverableController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// NEW: Generate PDF on-demand from content (frontend-driven)
router.post('/generate', authMiddleware, generateDeliverable);

// NEW: Mark deliverable complete by chatId (used for MVP code cards)
router.post('/complete-by-chat/:chatId', authMiddleware, completeByChatId);

// LEGACY: Download pre-generated file
router.get('/download/:filename', authMiddleware, downloadDeliverable);

export default router;
