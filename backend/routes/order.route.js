import express from 'express';
import Order from '../models/order.model.js';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import {
    getCustomerOrders,
    getOrderDetails,
    getOrderTracking,
    updateOrderStatus,
    getOrderStats
} from '../controllers/order.controller.js';

const router = express.Router();

// Get distinct customers with completed orders within optional date range (Admin)
router.get('/distinct-customers', verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { start, end, status = 'completed' } = req.query;
    const match = {
      paymentStatus: 'paid',
      status: { $nin: ['cancelled', 'refunded'] },
      adminStatus: status === 'completed' ? 'order_completed' : { $exists: true }
    };
    if (start) match.createdAt = { ...(match.createdAt || {}), $gte: new Date(start) };
    if (end) match.createdAt = { ...(match.createdAt || {}), $lte: new Date(end) };

    const results = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$user' } },
      { $count: 'count' }
    ]);

    const count = results?.[0]?.count || 0;
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch distinct customers', error: err.message });
  }
});

/**
 * @route   GET /api/orders
 * @desc    Get all orders for the authenticated customer
 * @access  Private (Customer only)
 * @query   page, limit, status
 */
router.get('/', verifyToken, getCustomerOrders);

/**
 * @route   GET /api/orders/stats
 * @desc    Get order statistics for the authenticated customer
 * @access  Private (Customer only)
 */
router.get('/stats', verifyToken, getOrderStats);

/**
 * @route   GET /api/orders/:orderId
 * @desc    Get specific order details for the authenticated customer
 * @access  Private (Customer only)
 */
router.get('/:orderId', verifyToken, getOrderDetails);

/**
 * @route   GET /api/orders/:orderId/tracking
 * @desc    Get order tracking information for the authenticated customer
 * @access  Private (Customer only)
 */
router.get('/:orderId/tracking', verifyToken, getOrderTracking);

/**
 * @route   PATCH /api/orders/:orderId/status
 * @desc    Update order status (primarily for webhook use)
 * @access  Private (Admin/Webhook)
 * @body    { status?, lalamoveStatus?, driverInfo? }
 */
router.patch('/:orderId/status', verifyToken, updateOrderStatus);

export default router;
