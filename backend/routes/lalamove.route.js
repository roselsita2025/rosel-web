import express from 'express';
import { 
    getQuotation, 
    placeOrder, 
    getOrderDetails, 
    cancelOrder, 
    setWebhook,
    getConfig,
    testServiceType,
    getVehicleTypes
} from '../controllers/lalamove.controller.js';

const router = express.Router();

/**
 * @route   POST /api/lalamove/quotation
 * @desc    Get delivery quotation from Lalamove
 * @access  Public
 * @body    { deliveryAddress: string, cartItems: Array }
 */
router.post('/quotation', getQuotation);

/**
 * @route   POST /api/lalamove/order
 * @desc    Place delivery order with Lalamove
 * @access  Public
 * @body    { quotationId: string, senderName: string, senderPhone: string, recipientName: string, recipientPhone: string, recipientRemarks?: string, stopId0: string, stopId1: string }
 */
router.post('/order', placeOrder);

/**
 * @route   GET /api/lalamove/order/:orderId
 * @desc    Get order details from Lalamove
 * @access  Public
 */
router.get('/order/:orderId', getOrderDetails);

/**
 * @route   DELETE /api/lalamove/order/:orderId
 * @desc    Cancel order with Lalamove
 * @access  Public
 */
router.delete('/order/:orderId', cancelOrder);

/**
 * @route   POST /api/lalamove/webhook
 * @desc    Set webhook URL for Lalamove
 * @access  Public
 * @body    { webhookUrl: string }
 */
router.post('/webhook', setWebhook);

/**
 * @route   GET /api/lalamove/config
 * @desc    Get Lalamove service configuration
 * @access  Public
 */
router.get('/config', getConfig);

/**
 * @route   POST /api/lalamove/test-service-type
 * @desc    Test service type determination logic
 * @access  Public
 * @body    { boxQuantity: number, distance: number }
 */
router.post('/test-service-type', testServiceType);

/**
 * @route   GET /api/lalamove/vehicle-types
 * @desc    Get all available vehicle types and their specifications
 * @access  Public
 */
router.get('/vehicle-types', getVehicleTypes);

export default router;
