import Order from '../models/order.model.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Handle Lalamove webhook events
 * POST /api/webhooks/lalamove
 */
export const handleLalamoveWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        const headers = req.headers;

        console.log('📨 Received Lalamove webhook:', {
            timestamp: new Date().toISOString(),
            headers: {
                'user-agent': headers['user-agent'],
                'content-type': headers['content-type'],
                'x-lalamove-signature': headers['x-lalamove-signature'] || 'not provided'
            },
            body: webhookData
        });

        // Additional debugging - log the full webhook structure
        console.log('🔍 Full webhook data structure:', JSON.stringify(webhookData, null, 2));
        
        // Log specific fields that might be causing issues
        console.log('🔍 Webhook field analysis:');
        console.log('- eventType:', webhookData.eventType);
        console.log('- eventId:', webhookData.eventId);
        console.log('- data exists:', !!webhookData.data);
        console.log('- data.order exists:', !!webhookData.data?.order);
        console.log('- data.order.orderId:', webhookData.data?.order?.orderId);
        console.log('- data.order.status:', webhookData.data?.order?.status);

        // Validate webhook data structure
        if (!webhookData || typeof webhookData !== 'object') {
            console.error('Invalid webhook data received');
            return res.status(400).json({
                success: false,
                message: 'Invalid webhook data'
            });
        }

        // Extract webhook event type and data
        const eventType = webhookData.eventType || webhookData.type || webhookData.event_type || 'unknown';
        const orderId = webhookData.data?.order?.orderId || webhookData.order_id || webhookData.orderId || webhookData.id;
        const status = webhookData.data?.order?.status || webhookData.status || webhookData.delivery_status || 'unknown';

        console.log(`📋 Webhook Event Details:`, {
            eventType,
            orderId,
            status,
            timestamp: webhookData.timestamp || webhookData.created_at || new Date().toISOString()
        });

        // Process different webhook event types
        try {
            switch (eventType.toLowerCase()) {
                case 'order_status_changed':
                    await handleOrderStatusChanged(webhookData);
                    break;

                case 'driver_assigned':
                    await handleDriverAssigned(webhookData);
                    break;

                case 'wallet_balance_changed':
                    await handleWalletBalanceChanged(webhookData);
                    break;

                case 'order.created':
                case 'order_created':
                    await handleOrderCreated(webhookData);
                    break;

                case 'order.accepted':
                case 'order_accepted':
                    await handleOrderAccepted(webhookData);
                    break;

                case 'order.picked_up':
                case 'order_picked_up':
                    await handleOrderPickedUp(webhookData);
                    break;

                case 'order.delivered':
                case 'order_delivered':
                    await handleOrderDelivered(webhookData);
                    break;

                case 'order.cancelled':
                case 'order_cancelled':
                    await handleOrderCancelled(webhookData);
                    break;

                case 'order.failed':
                case 'order_failed':
                    await handleOrderFailed(webhookData);
                    break;

                case 'order.expired':
                case 'order_expired':
                    await handleOrderExpired(webhookData);
                    break;

                default:
                    console.log(`⚠️ Unknown webhook event type: ${eventType}`);
                    await handleUnknownEvent(webhookData);
            }
        } catch (processingError) {
            console.error('❌ Error during webhook processing:', processingError);
            console.error('❌ Processing error stack:', processingError.stack);
            throw processingError; // Re-throw to be caught by outer try-catch
        }

        // Always respond with success to acknowledge receipt
        res.status(200).json({
            success: true,
            message: 'Webhook received and processed successfully',
            eventType,
            orderId,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error processing Lalamove webhook:', error);
        console.error('❌ Webhook data that caused error:', JSON.stringify(req.body || {}, null, 2));
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error type:', error.constructor.name);
        console.error('❌ Error details:', {
            name: error.name,
            message: error.message,
            code: error.code,
            errno: error.errno,
            syscall: error.syscall
        });
        
        res.status(500).json({
            success: false,
            message: 'Internal server error processing webhook',
            error: error.message,
            eventType: req.body?.eventType || 'unknown',
            timestamp: new Date().toISOString()
        });
    }
};

/**
 * Handle order status changed webhook (new Lalamove format)
 */
const handleOrderStatusChanged = async (webhookData) => {
    console.log('🔄 Order status changed:', webhookData);
    
    try {
        const orderData = webhookData.data?.order;
        if (!orderData) {
            console.error('❌ No order data found in webhook');
            return;
        }
        
        const lalamoveOrderId = orderData.orderId;
        const newStatus = orderData.status;
        const driverId = orderData.driverId;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            console.error(`❌ Available orders in database:`);
            const allOrders = await Order.find({ 'lalamoveDetails.orderId': { $exists: true } }).select('lalamoveDetails.orderId orderNumber');
            allOrders.forEach(o => {
                console.error(`  - Order ${o.orderNumber}: Lalamove ID ${o.lalamoveDetails?.orderId}`);
            });
            throw new Error(`Order not found for Lalamove order ID: ${lalamoveOrderId}`);
        }
        
        // Capture old status values for comparison
        const oldAdminStatus = order.adminStatus;
        const oldStatus = order.status;
        
        // Map Lalamove status to our internal status
        let mappedStatus = newStatus.toLowerCase();
        
        // Handle Lalamove's uppercase status format
        if (newStatus === 'ASSIGNING_DRIVER') {
            mappedStatus = 'pending';
        } else if (newStatus === 'ON_GOING') {
            mappedStatus = 'accepted';
        } else if (newStatus === 'PICKED_UP') {
            mappedStatus = 'picked_up';
        } else if (newStatus === 'COMPLETED') {
            mappedStatus = 'delivered';
        } else if (newStatus === 'CANCELED') {
            mappedStatus = 'cancelled';
        } else if (newStatus === 'REJECTED') {
            mappedStatus = 'failed';
        } else if (newStatus === 'EXPIRED') {
            mappedStatus = 'expired';
        }
        
        // Update order status and driver details
        order.lalamoveDetails.status = mappedStatus;
        order.lalamoveDetails.lastStatusUpdate = new Date();
        
        // Update driver information if provided
        if (driverId) {
            order.lalamoveDetails.driverId = driverId;
        }
        
        // Update admin status based on Lalamove status
        if (mappedStatus === 'picked_up') {
            order.adminStatus = 'order_picked_up';
        } else if (mappedStatus === 'delivered') {
            order.adminStatus = 'order_completed';
            order.status = 'delivered';
        } else if (mappedStatus === 'cancelled') {
            order.status = 'cancelled';
        }
        
        await order.save();
        
        console.log(`✅ Updated order ${order._id} status to ${mappedStatus}`);
        
        // Send notification to customer about order status update
        if (order.adminStatus !== oldAdminStatus || order.status !== oldStatus) {
            try {
                await notificationService.sendOrderStatusUpdateNotification(order, order.adminStatus || order.status);
                console.log(`📢 Sent notification for order ${order._id} status change to ${order.adminStatus || order.status}`);
            } catch (notificationError) {
                console.error('Error sending order status update notification:', notificationError);
                // Don't fail the webhook if notification fails
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling order status changed webhook:', error.message);
        throw error; // Re-throw to trigger 500 response
    }
};

/**
 * Handle driver assigned webhook
 */
const handleDriverAssigned = async (webhookData) => {
    console.log('👤 Driver assigned:', webhookData);
    
    try {
        const orderData = webhookData.data?.order;
        if (!orderData) {
            console.error('❌ No order data found in driver assigned webhook');
            return;
        }
        
        const lalamoveOrderId = orderData.orderId;
        const driverId = orderData.driverId;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            console.error(`❌ Available orders in database:`);
            const allOrders = await Order.find({ 'lalamoveDetails.orderId': { $exists: true } }).select('lalamoveDetails.orderId orderNumber');
            allOrders.forEach(o => {
                console.error(`  - Order ${o.orderNumber}: Lalamove ID ${o.lalamoveDetails?.orderId}`);
            });
            throw new Error(`Order not found for Lalamove order ID: ${lalamoveOrderId}`);
        }
        
        // Update order with driver information
        order.lalamoveDetails.status = 'accepted';
        order.lalamoveDetails.driverId = driverId;
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`✅ Updated order ${order._id} with driver assignment: ${driverId}`);
        
    } catch (error) {
        console.error('❌ Error handling driver assigned webhook:', error.message);
        throw error;
    }
};

/**
 * Handle wallet balance changed webhook
 */
const handleWalletBalanceChanged = async (webhookData) => {
    console.log('💰 Wallet balance changed:', webhookData);
    
    try {
        // This webhook is informational only - we don't need to update any orders
        // Just log it for monitoring purposes
        console.log('📊 Wallet balance update received - no action required');
        
    } catch (error) {
        console.error('❌ Error handling wallet balance changed webhook:', error.message);
        throw error;
    }
};

/**
 * Handle order created webhook
 */
const handleOrderCreated = async (webhookData) => {
    console.log('✅ Order created:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status
        order.lalamoveDetails.status = 'pending';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`✅ Updated order ${order._id} status to pending`);
        
    } catch (error) {
        console.error('❌ Error handling order created webhook:', error.message);
    }
};

/**
 * Handle order accepted webhook
 */
const handleOrderAccepted = async (webhookData) => {
    console.log('✅ Order accepted by driver:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Extract driver information from webhook data
        const driverInfo = webhookData.driver || webhookData.driver_info || {};
        
        // Update order status and driver details
        const oldStatus = order.status;
        order.lalamoveDetails.status = 'accepted';
        order.lalamoveDetails.driverId = driverInfo.driver_id || driverInfo.id;
        order.lalamoveDetails.driverName = driverInfo.name || driverInfo.driver_name;
        order.lalamoveDetails.driverPhone = driverInfo.phone || driverInfo.phone_number;
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`✅ Updated order ${order._id} status to accepted with driver: ${order.lalamoveDetails.driverName}`);
        
        // Send notification to customer about driver assignment
        try {
            await notificationService.sendOrderStatusUpdateNotification(order, 'processing');
            console.log(`📢 Sent driver assignment notification for order ${order._id}`);
        } catch (notificationError) {
            console.error('Error sending driver assignment notification:', notificationError);
        }
        
    } catch (error) {
        console.error('❌ Error handling order accepted webhook:', error.message);
    }
};

/**
 * Handle order picked up webhook
 */
const handleOrderPickedUp = async (webhookData) => {
    console.log('✅ Order picked up:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status
        const oldStatus = order.status;
        order.lalamoveDetails.status = 'picked_up';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`✅ Updated order ${order._id} status to picked_up`);
        
        // Send notification to customer about order pickup
        try {
            await notificationService.sendOrderStatusUpdateNotification(order, 'shipped');
            console.log(`📢 Sent pickup notification for order ${order._id}`);
        } catch (notificationError) {
            console.error('Error sending pickup notification:', notificationError);
        }
        
    } catch (error) {
        console.error('❌ Error handling order picked up webhook:', error.message);
    }
};

/**
 * Handle order delivered webhook
 */
const handleOrderDelivered = async (webhookData) => {
    console.log('✅ Order delivered:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status to delivered and mark as completed
        const oldStatus = order.status;
        order.lalamoveDetails.status = 'delivered';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        order.status = 'delivered';
        await order.save();
        
        console.log(`✅ Updated order ${order._id} status to delivered and completed`);
        
        // Send notification to customer about order delivery
        if (oldStatus !== 'delivered') {
            try {
                await notificationService.sendOrderStatusUpdateNotification(order, 'delivered');
                console.log(`📢 Sent delivery notification for order ${order._id}`);
            } catch (notificationError) {
                console.error('Error sending delivery notification:', notificationError);
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling order delivered webhook:', error.message);
    }
};

/**
 * Handle order cancelled webhook
 */
const handleOrderCancelled = async (webhookData) => {
    console.log('❌ Order cancelled:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status to cancelled
        const oldStatus = order.status;
        order.lalamoveDetails.status = 'cancelled';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        order.status = 'cancelled';
        await order.save();
        
        console.log(`❌ Updated order ${order._id} status to cancelled`);
        
        // Send notification to customer about order cancellation
        if (oldStatus !== 'cancelled') {
            try {
                await notificationService.sendOrderStatusUpdateNotification(order, 'cancelled');
                console.log(`📢 Sent cancellation notification for order ${order._id}`);
            } catch (notificationError) {
                console.error('Error sending cancellation notification:', notificationError);
            }
        }
        
    } catch (error) {
        console.error('❌ Error handling order cancelled webhook:', error.message);
    }
};

/**
 * Handle order failed webhook
 */
const handleOrderFailed = async (webhookData) => {
    console.log('❌ Order failed:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status to failed
        order.lalamoveDetails.status = 'failed';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`❌ Updated order ${order._id} status to failed`);
        
    } catch (error) {
        console.error('❌ Error handling order failed webhook:', error.message);
    }
};

/**
 * Handle order expired webhook
 */
const handleOrderExpired = async (webhookData) => {
    console.log('⏰ Order expired:', webhookData);
    
    try {
        const lalamoveOrderId = webhookData.order_id || webhookData.orderId || webhookData.id;
        
        if (!lalamoveOrderId) {
            console.error('❌ No Lalamove order ID found in webhook data');
            return;
        }
        
        // Find order by Lalamove order ID
        const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
        
        if (!order) {
            console.error(`❌ Order not found for Lalamove order ID: ${lalamoveOrderId}`);
            return;
        }
        
        // Update order status to expired
        order.lalamoveDetails.status = 'expired';
        order.lalamoveDetails.lastStatusUpdate = new Date();
        await order.save();
        
        console.log(`⏰ Updated order ${order._id} status to expired`);
        
    } catch (error) {
        console.error('❌ Error handling order expired webhook:', error.message);
    }
};

/**
 * Handle unknown webhook events
 */
const handleUnknownEvent = async (webhookData) => {
    console.log('❓ Unknown webhook event received:', webhookData);
    
    // Log unknown events for debugging
    console.log('📋 Unknown event details:', {
        timestamp: new Date().toISOString(),
        eventType: webhookData.type || webhookData.event_type || 'unknown',
        orderId: webhookData.order_id || webhookData.orderId || webhookData.id,
        rawData: webhookData
    });
};

/**
 * Get webhook health status
 * GET /api/webhooks/health
 */
export const getWebhookHealth = async (req, res) => {
    try {
        // Test database connection
        const mongoose = await import('mongoose');
        const dbState = mongoose.default.connection.readyState;
        const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
        
        res.status(200).json({
            success: true,
            message: 'Webhook service is healthy',
            data: {
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                database: {
                    status: dbStates[dbState],
                    readyState: dbState
                },
                memory: process.memoryUsage()
            }
        });
    } catch (error) {
        console.error('Error getting webhook health:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking webhook health',
            error: error.message
        });
    }
};


/**
 * Test webhook endpoint
 * POST /api/webhooks/test
 */
export const testWebhook = async (req, res) => {
    try {
        const testData = {
            type: 'test',
            message: 'This is a test webhook',
            timestamp: new Date().toISOString(),
            testId: Math.random().toString(36).substr(2, 9)
        };

        console.log('🧪 Test webhook received:', testData);

        res.status(200).json({
            success: true,
            message: 'Test webhook received successfully',
            data: testData
        });
    } catch (error) {
        console.error('Error in test webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing test webhook',
            error: error.message
        });
    }
};

/**
 * Simple webhook endpoint for debugging
 * POST /api/webhooks/debug
 */
export const debugWebhook = async (req, res) => {
    try {
        console.log('🐛 Debug webhook received:', {
            timestamp: new Date().toISOString(),
            headers: req.headers,
            body: req.body
        });

        res.status(200).json({
            success: true,
            message: 'Debug webhook received successfully',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in debug webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing debug webhook',
            error: error.message
        });
    }
};

/**
 * Simple webhook endpoint that just logs and returns success (for Lalamove testing)
 * POST /api/webhooks/simple
 */
export const simpleWebhook = async (req, res) => {
    try {
        console.log('📝 Simple webhook received:', {
            timestamp: new Date().toISOString(),
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
            rawBody: JSON.stringify(req.body, null, 2)
        });

        // Always return success
        res.status(200).json({
            success: true,
            message: 'Simple webhook received successfully',
            timestamp: new Date().toISOString(),
            received: {
                eventType: req.body?.eventType || 'unknown',
                eventId: req.body?.eventId || 'unknown',
                orderId: req.body?.data?.order?.orderId || 'unknown'
            }
        });
    } catch (error) {
        console.error('Error in simple webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing simple webhook',
            error: error.message
        });
    }
};

/**
 * Ultra-simple webhook endpoint that just returns success (for Lalamove testing)
 * POST /api/webhooks/ping
 */
export const pingWebhook = async (req, res) => {
    try {
        console.log('🏓 Ping webhook received at:', new Date().toISOString());
        
        // Just return success immediately
        res.status(200).json({
            success: true,
            message: 'Pong',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error in ping webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error in ping webhook',
            error: error.message
        });
    }
};

/**
 * Simulate Lalamove webhook for testing
 * POST /api/webhooks/simulate
 */
export const simulateWebhook = async (req, res) => {
    try {
        const { eventType = 'ORDER_STATUS_CHANGED', orderId = 'test123', status = 'COMPLETED' } = req.body;
        
        const simulatedWebhookData = {
            eventType,
            eventId: Math.random().toString(36).substr(2, 9),
            timestamp: Math.floor(Date.now() / 1000),
            data: {
                order: {
                    orderId,
                    status,
                    driverId: 'test_driver_123',
                    previousStatus: 'PICKED_UP'
                }
            }
        };

        console.log('🎭 Simulating webhook:', simulatedWebhookData);

        // Process the webhook data directly without calling the main handler
        try {
            const orderData = simulatedWebhookData.data?.order;
            if (!orderData) {
                throw new Error('No order data found in simulated webhook');
            }
            
            const lalamoveOrderId = orderData.orderId;
            const newStatus = orderData.status;
            const driverId = orderData.driverId;
            
            console.log(`🔍 Looking for order with Lalamove ID: ${lalamoveOrderId}`);
            
            // Find order by Lalamove order ID
            const order = await Order.findOne({ 'lalamoveDetails.orderId': lalamoveOrderId });
            
            if (!order) {
                console.log(`⚠️ Order not found for Lalamove order ID: ${lalamoveOrderId} (this is expected for test data)`);
                res.status(200).json({
                    success: true,
                    message: 'Simulated webhook processed successfully (order not found - expected for test data)',
                    data: {
                        simulatedWebhookData,
                        note: 'Order not found in database - this is expected for test data'
                    }
                });
                return;
            }
            
            // Map Lalamove status to our internal status
            let mappedStatus = newStatus.toLowerCase();
            
            // Handle Lalamove's uppercase status format
            if (newStatus === 'ASSIGNING_DRIVER') {
                mappedStatus = 'pending';
            } else if (newStatus === 'ON_GOING') {
                mappedStatus = 'accepted';
            } else if (newStatus === 'PICKED_UP') {
                mappedStatus = 'picked_up';
            } else if (newStatus === 'COMPLETED') {
                mappedStatus = 'delivered';
            } else if (newStatus === 'CANCELED') {
                mappedStatus = 'cancelled';
            } else if (newStatus === 'REJECTED') {
                mappedStatus = 'failed';
            } else if (newStatus === 'EXPIRED') {
                mappedStatus = 'expired';
            }
            
            // Update order status and driver details
            order.lalamoveDetails.status = mappedStatus;
            order.lalamoveDetails.lastStatusUpdate = new Date();
            
            // Update driver information if provided
            if (driverId) {
                order.lalamoveDetails.driverId = driverId;
            }
            
        // Store original status for comparison
        const oldStatus = order.status;
        const oldAdminStatus = order.adminStatus;
            if (mappedStatus === 'delivered') {
                order.status = 'delivered';
            } else if (mappedStatus === 'cancelled') {
                order.status = 'cancelled';
            }
            
            await order.save();
            
            console.log(`✅ Updated order ${order._id} status to ${mappedStatus}`);
            
            // Send notification to customer about order status update
            if (order.status !== oldStatus) {
                try {
                    await notificationService.sendOrderStatusUpdateNotification(order, order.status);
                    console.log(`📢 Sent notification for simulated webhook order ${order._id} status change to ${order.status}`);
                } catch (notificationError) {
                    console.error('Error sending notification for simulated webhook:', notificationError);
                }
            }
            
            res.status(200).json({
                success: true,
                message: 'Simulated webhook processed successfully',
                data: {
                    simulatedWebhookData,
                    updatedOrder: {
                        id: order._id,
                        status: mappedStatus,
                        driverId: driverId
                    }
                }
            });
            
        } catch (processingError) {
            console.error('Error processing simulated webhook:', processingError);
            res.status(500).json({
                success: false,
                message: 'Error processing simulated webhook',
                error: processingError.message
            });
        }

    } catch (error) {
        console.error('Error in simulate webhook:', error);
        res.status(500).json({
            success: false,
            message: 'Error processing simulated webhook',
            error: error.message
        });
    }
};
