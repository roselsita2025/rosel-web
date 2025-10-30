import express from 'express';
import {
    createPurchaseOrder,
    getPurchaseOrderHistory,
    getPurchaseOrderById,
    completePurchaseOrder,
    cancelPurchaseOrder,
    getPurchaseOrderAnalytics
} from '../controllers/purchaseOrder.controller.js';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';

const router = express.Router();

/**
 * Create a new purchase order
 * POST /api/purchase-orders
 * @access Private (Admin only)
 */
router.post('/', verifyToken, verifyAdmin, createPurchaseOrder);

/**
 * Get all purchase orders with filters
 * GET /api/purchase-orders
 * @access Private (Admin only)
 */
router.get('/', verifyToken, verifyAdmin, getPurchaseOrderHistory);

/**
 * Get purchase order analytics
 * GET /api/purchase-orders/analytics
 * @access Private (Admin only)
 */
router.get('/analytics', verifyToken, verifyAdmin, getPurchaseOrderAnalytics);

/**
 * Get purchase order by ID
 * GET /api/purchase-orders/:id
 * @access Private (Admin only)
 */
router.get('/:id', verifyToken, verifyAdmin, getPurchaseOrderById);

/**
 * Complete a purchase order
 * POST /api/purchase-orders/:id/complete
 * @access Private (Admin only)
 */
router.post('/:id/complete', verifyToken, verifyAdmin, completePurchaseOrder);

/**
 * Cancel a purchase order
 * POST /api/purchase-orders/:id/cancel
 * @access Private (Admin only)
 */
router.post('/:id/cancel', verifyToken, verifyAdmin, cancelPurchaseOrder);

export default router;
