import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getCustomerOrders,
    getOrderDetails,
    getOrderTracking,
    updateOrderStatus,
    getOrderStats
} from '../controllers/order.controller.js';

const router = express.Router();

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
