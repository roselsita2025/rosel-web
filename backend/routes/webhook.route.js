import express from 'express';
import { 
    handleLalamoveWebhook, 
    getWebhookHealth, 
    testWebhook,
    simulateWebhook,
    debugWebhook,
    simpleWebhook,
    pingWebhook 
} from '../controllers/webhook.controller.js';

const router = express.Router();

/**
 * @route   POST /api/webhooks/lalamove
 * @desc    Handle Lalamove webhook events
 * @access  Public (webhook endpoint)
 * @body    Lalamove webhook payload
 */
router.post('/lalamove', handleLalamoveWebhook);

/**
 * @route   GET /api/webhooks/health
 * @desc    Get webhook service health status
 * @access  Public
 */
router.get('/health', getWebhookHealth);

/**
 * @route   POST /api/webhooks/test
 * @desc    Test webhook endpoint
 * @access  Public
 * @body    { message: string, testId: string }
 */
router.post('/test', testWebhook);

/**
 * @route   POST /api/webhooks/simulate
 * @desc    Simulate Lalamove webhook for testing
 * @access  Public
 * @body    { eventType: string, orderId: string, status: string }
 */
router.post('/simulate', simulateWebhook);

/**
 * @route   POST /api/webhooks/debug
 * @desc    Simple webhook endpoint for debugging
 * @access  Public
 */
router.post('/debug', debugWebhook);

/**
 * @route   POST /api/webhooks/simple
 * @desc    Simple webhook endpoint that just logs and returns success (for Lalamove testing)
 * @access  Public
 */
router.post('/simple', simpleWebhook);

/**
 * @route   POST /api/webhooks/ping
 * @desc    Ultra-simple webhook endpoint that just returns success (for Lalamove testing)
 * @access  Public
 */
router.post('/ping', pingWebhook);

export default router;
