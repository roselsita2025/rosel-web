import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getOrders,
    updateAdminOrderStatus,
    placeLalamoveOrder,
    getOrdersPendingActions
} from '../controllers/adminOrder.controller.js';

const router = express.Router();

// Apply admin authentication middleware to all routes
router.use(verifyToken);

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

// Apply admin role check to all routes
router.use(requireAdmin);

/**
 * @route   GET /api/admin/orders
 * @desc    Get all orders with filtering and pagination
 * @access  Admin
 */
router.get('/', getOrders);

/**
 * @route   GET /api/admin/orders/pending-actions
 * @desc    Get orders that need admin attention
 * @access  Admin
 */
router.get('/pending-actions', getOrdersPendingActions);

/**
 * @route   PATCH /api/admin/orders/:orderId/status
 * @desc    Update admin order status
 * @access  Admin
 */
router.patch('/:orderId/status', updateAdminOrderStatus);

/**
 * @route   POST /api/admin/orders/:orderId/place-lalamove
 * @desc    Place Lalamove order (admin action)
 * @access  Admin
 */
router.post('/:orderId/place-lalamove', placeLalamoveOrder);

export default router;
