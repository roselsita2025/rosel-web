import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import { getAllOrders } from '../controllers/order.controller.js';

const router = express.Router();

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders for admin (all customers)
 * @access  Private (Admin only)
 * @query   page, limit, status, search, sortBy, sortOrder
 */
router.get('/orders', verifyToken, verifyAdmin, getAllOrders);

export default router;
