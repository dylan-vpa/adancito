import express from 'express';
import { getUserCoins, purchaseCoins, getTransactions } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

router.get('/coins', getUserCoins);
router.post('/purchase', purchaseCoins);
router.get('/transactions', getTransactions);

export default router;
