import express from 'express';
import { createTransaction, getTransaction, getRecentTransactions } from '../controllers/pos.controller.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// Health check route (no auth required for testing)
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'POS routes are working',
    timestamp: new Date().toISOString()
  });
});

// All other POS routes require authentication
router.use(verifyToken);

// Create new POS transaction
router.post('/transaction', createTransaction);

// Get transaction by ID
router.get('/transaction/:id', getTransaction);

// Get recent transactions
router.get('/transactions', getRecentTransactions);

export default router;
