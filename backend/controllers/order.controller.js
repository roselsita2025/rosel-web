import Order from '../models/order.model.js';
import { verifyToken } from '../middleware/verifyToken.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Get all orders for the authenticated customer
 * GET /api/orders
 */
export const getCustomerOrders = async (req, res) => {
    try {
        const userId = req.user._id;
        const { page = 1, limit = 10, status } = req.query;
        
        // Build query filter - only show orders with successful payments
        const filter = { 
            user: userId,
            paymentStatus: 'paid' // Only show orders that have been paid
        };
        if (status) {
            filter.status = status;
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get orders with populated product details
        const orders = await Order.find(filter)
            .populate('products.product', 'name image price')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        console.log('🔍 Customer orders query:', {
            userId,
            filter,
            ordersFound: orders.length,
            orders: orders.map(o => ({ id: o._id, paymentStatus: o.paymentStatus, status: o.status }))
        });
        
        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);
        
        // Map orders to include computed status
        const ordersWithStatus = orders.map(order => ({
            ...order.toObject(),
            computedStatus: getComputedOrderStatus(order)
        }));
        
        res.status(200).json({
            success: true,
            data: {
                orders: ordersWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / parseInt(limit)),
                    totalOrders,
                    hasNextPage: skip + orders.length < totalOrders,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Orders retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get customer orders error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
            error: error.message
        });
    }
};

/**
 * Get specific order details for the authenticated customer
 * GET /api/orders/:orderId
 */
export const getOrderDetails = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        // Find order and verify ownership
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('products.product', 'name image price description category');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or access denied'
            });
        }
        
        // Add computed status
        const orderWithStatus = {
            ...order.toObject(),
            computedStatus: getComputedOrderStatus(order)
        };
        
        res.status(200).json({
            success: true,
            data: orderWithStatus,
            message: 'Order details retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get order details error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order details',
            error: error.message
        });
    }
};

/**
 * Get order tracking information
 * GET /api/orders/:orderId/tracking
 */
export const getOrderTracking = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        // Find order and verify ownership
        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('products.product', 'name image');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found or access denied'
            });
        }
        
        // Get tracking information
        const trackingInfo = {
            orderId: order._id,
            orderNumber: order._id.toString().slice(-8).toUpperCase(),
            status: getComputedOrderStatus(order),
            paymentStatus: order.paymentStatus,
            shippingMethod: order.shippingMethod,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            shippingInfo: {
                recipientName: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
                address: order.shippingInfo.fullAddress,
                phone: order.shippingInfo.phone
            },
            lalamoveDetails: order.lalamoveDetails ? {
                status: order.lalamoveDetails.status,
                trackingUrl: order.lalamoveDetails.trackingUrl,
                driverName: order.lalamoveDetails.driverName,
                driverPhone: order.lalamoveDetails.driverPhone,
                serviceType: order.lalamoveDetails.serviceType,
                distance: order.lalamoveDetails.distance,
                duration: order.lalamoveDetails.duration,
                deliveryFee: order.lalamoveDetails.deliveryFee
            } : null,
            products: order.products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                subtotal: item.quantity * item.price
            })),
            totalAmount: order.totalAmount,
            coupon: order.coupon
        };
        
        res.status(200).json({
            success: true,
            data: trackingInfo,
            message: 'Order tracking information retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get order tracking error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order tracking information',
            error: error.message
        });
    }
};

/**
 * Update order status (for webhook use)
 * PATCH /api/orders/:orderId/status
 */
export const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status, lalamoveStatus, driverInfo } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        // Find order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Store original status for comparison
        const originalStatus = order.status;
        
        // Update order status
        const updateData = {};
        if (status) {
            updateData.status = status;
        }
        
        // Update Lalamove details if provided
        if (lalamoveStatus || driverInfo) {
            updateData.lalamoveDetails = {
                ...order.lalamoveDetails,
                ...(lalamoveStatus && { status: lalamoveStatus }),
                ...(driverInfo && {
                    driverId: driverInfo.driverId,
                    driverName: driverInfo.driverName,
                    driverPhone: driverInfo.driverPhone
                })
            };
        }
        
        const updatedOrder = await Order.findByIdAndUpdate(
            orderId,
            updateData,
            { new: true, runValidators: true }
        ).populate('products.product', 'name image').populate('user', 'name email');
        
        // Send notification to customer about order status update
        if (status && status !== originalStatus) {
            try {
                console.log(`📢 Sending notification for order ${orderId}: ${originalStatus} → ${status}`);
                await notificationService.sendOrderStatusUpdateNotification(updatedOrder, status);
                console.log(`✅ Notification sent successfully for order ${orderId}`);
            } catch (notificationError) {
                console.error('Error sending order status update notification:', notificationError);
                // Don't fail the order update if notification fails
            }
        } else {
            console.log(`ℹ️ No notification sent for order ${orderId}: status unchanged (${originalStatus})`);
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...updatedOrder.toObject(),
                computedStatus: getComputedOrderStatus(updatedOrder)
            },
            message: 'Order status updated successfully'
        });
        
    } catch (error) {
        console.error('Update order status error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update order status',
            error: error.message
        });
    }
};

/**
 * Helper function to compute order status based on payment, admin status, and Lalamove status
 */
function getComputedOrderStatus(order) {
    // If payment is not completed, order is pending
    if (order.paymentStatus !== 'paid') {
        return 'PENDING';
    }
    
    // If order is cancelled or refunded
    if (order.status === 'cancelled' || order.status === 'refunded') {
        return 'CANCELED';
    }
    
    // For pickup orders
    if (order.shippingMethod === 'pickup') {
        switch (order.adminStatus) {
            case 'order_received':
                return 'ORDER_RECEIVED';
            case 'order_preparing':
                return 'ORDER_PREPARING';
            case 'order_prepared':
                return 'ORDER_PREPARED';
            case 'order_placed':
                return 'READY_FOR_PICKUP';
            case 'order_picked_up':
                return 'PICKED_UP';
            case 'order_completed':
                return 'COMPLETED';
            default:
                return 'ORDER_RECEIVED';
        }
    }
    
    // For Lalamove delivery orders
    if (order.shippingMethod === 'lalamove' && order.lalamoveDetails) {
        const lalamoveStatus = order.lalamoveDetails.status;
        
        // If order hasn't been placed in Lalamove yet
        if (lalamoveStatus === 'pending_placement') {
            switch (order.adminStatus) {
                case 'order_received':
                    return 'ORDER_RECEIVED';
                case 'order_preparing':
                    return 'ORDER_PREPARING';
                case 'order_prepared':
                    return 'ORDER_PREPARED';
                default:
                    return 'ORDER_RECEIVED';
            }
        }
        
        // If order has been placed in Lalamove
        switch (lalamoveStatus) {
            case 'pending':
            case 'ASSIGNING_DRIVER':
                return 'ASSIGNING_DRIVER';
            case 'accepted':
            case 'ON_GOING':
                return 'ON_GOING';
            case 'picked_up':
            case 'PICKED_UP':
                return 'PICKED_UP';
            case 'delivered':
            case 'COMPLETED':
                return 'COMPLETED';
            case 'cancelled':
            case 'CANCELED':
                return 'CANCELED';
            case 'failed':
            case 'REJECTED':
                return 'REJECTED';
            case 'expired':
            case 'EXPIRED':
                return 'EXPIRED';
            default:
                return 'ASSIGNING_DRIVER';
        }
    }
    
    // Default fallback
    return 'PROCESSING';
}

/**
 * Get order statistics for customer
 * GET /api/orders/stats
 */
export const getOrderStats = async (req, res) => {
    try {
        const userId = req.user._id;
        
        // Get all paid orders for the user
        const orders = await Order.find({ 
            user: userId, 
            paymentStatus: 'paid',
            status: { $nin: ['cancelled', 'refunded'] } // Exclude cancelled/refunded orders
        });
        
        let totalOrders = orders.length;
        let totalSpent = 0;
        let completedOrders = 0;
        let pendingOrders = 0;
        
        // Calculate stats using computed status
        orders.forEach(order => {
            totalSpent += order.totalAmount || 0;
            
            const computedStatus = getComputedOrderStatus(order);
            
            if (computedStatus === 'COMPLETED') {
                completedOrders++;
            } else if (['PENDING', 'ORDER_RECEIVED', 'ORDER_PREPARING', 'ORDER_PREPARED', 'READY_FOR_PICKUP', 'ASSIGNING_DRIVER', 'ON_GOING', 'PICKED_UP', 'PROCESSING'].includes(computedStatus)) {
                pendingOrders++;
            }
        });
        
        const result = {
            totalOrders,
            totalSpent,
            completedOrders,
            pendingOrders
        };
        
        res.status(200).json({
            success: true,
            data: result,
            message: 'Order statistics retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get order stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve order statistics',
            error: error.message
        });
    }
};

/**
 * Get all orders for admin (all customers)
 * GET /api/admin/orders
 */
export const getAllOrders = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
        
        // Build query filter - only show orders with successful payments
        const filter = {
            paymentStatus: 'paid' // Only show orders that have been paid
        };
        if (status) {
            filter.status = status;
        }
        
        // Search functionality
        if (search) {
            filter.$or = [
                { 'shippingInfo.firstName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.lastName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.email': { $regex: search, $options: 'i' } },
                { _id: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        
        // Get orders with populated product and user details
        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name image price category')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);
        
        // Map orders to include computed status and formatted data
        const ordersWithStatus = orders.map(order => ({
            ...order.toObject(),
            computedStatus: getComputedOrderStatus(order),
            orderId: order._id.toString().slice(-8).toUpperCase(),
            customerName: order.shippingInfo ? `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}` : 'N/A',
            customerEmail: order.shippingInfo?.email || 'N/A',
            itemsCount: order.products.reduce((sum, item) => sum + item.quantity, 0),
            totalPrice: order.totalAmount,
            created: order.createdAt,
            modified: order.updatedAt,
            products: order.products.map(item => ({
                product: item.product,
                quantity: item.quantity,
                price: item.price,
                totalPrice: item.quantity * item.price
            }))
        }));
        
        res.status(200).json({
            success: true,
            data: {
                orders: ordersWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / parseInt(limit)),
                    totalOrders,
                    hasNextPage: skip + orders.length < totalOrders,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Orders retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get all orders error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders',
            error: error.message
        });
    }
};