import express from 'express';
import { createTransaction, getTransaction, getRecentTransactions } from '../controllers/pos.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS routes are working',
    timestamp: new Date().toISOString()
  });
});

router.use(verifyToken);

router.post('/transaction', createTransaction);

router.get('/transaction/:id', getTransaction);

router.get('/transactions', getRecentTransactions);

export default router;
