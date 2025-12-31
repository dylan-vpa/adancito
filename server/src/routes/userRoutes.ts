import express from 'express';
import { getReferralCode, getReferralCount, getReferrals, submitFeedback } from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/referral-code', getReferralCode);
router.get('/referral-count', getReferralCount);
router.get('/referrals', getReferrals);
router.post('/feedback', submitFeedback);

export default router;
