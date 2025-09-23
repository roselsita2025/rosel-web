import Order from '../models/order.model.js';
import lalamoveService from '../services/lalamove.service.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Get all orders with filtering and pagination
 * GET /api/admin/orders
 */
export const getOrders = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 10, 
            search, 
            status, 
            sortBy = 'createdAt', 
            sortOrder = 'desc',
            timeframe,
            date,
            start,
            end
        } = req.query;

        // Build query filter
        const filter = {};

        // Add search filter
        if (search) {
            filter.$or = [
                { _id: { $regex: search, $options: 'i' } },
                { 'shippingInfo.firstName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.lastName': { $regex: search, $options: 'i' } },
                { 'shippingInfo.email': { $regex: search, $options: 'i' } }
            ];
        }

        // Add status filter
        if (status) {
            filter.adminStatus = status;
        }

        // Add time filter
        if (timeframe && timeframe !== 'all') {
            const now = new Date();
            let startDate;

            switch (timeframe) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                    break;
                case 'year':
                    startDate = new Date(now.getFullYear(), 0, 1);
                    break;
                case 'custom':
                    if (date) {
                        const customDate = new Date(date);
                        startDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
                        const endDate = new Date(customDate.getTime() + 24 * 60 * 60 * 1000);
                        filter.createdAt = { $gte: startDate, $lt: endDate };
                    } else if (start && end) {
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        endDate.setHours(23, 59, 59, 999); // End of day
                        filter.createdAt = { $gte: startDate, $lte: endDate };
                    }
                    break;
            }

            if (timeframe !== 'custom' || !date) {
                filter.createdAt = { $gte: startDate };
            }
        }

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Execute query
        const orders = await Order.find(filter)
            .populate('products.product', 'name image price')
            .populate('user', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalOrders = await Order.countDocuments(filter);

        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalOrders / parseInt(limit)),
                    totalOrders,
                    hasNext: skip + orders.length < totalOrders,
                    hasPrev: parseInt(page) > 1
                }
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
};

/**
 * Update admin order status
 * PATCH /api/admin/orders/:orderId/status
 */
export const updateAdminOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { adminStatus, notes } = req.body;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        if (!adminStatus) {
            return res.status(400).json({
                success: false,
                message: 'Admin status is required'
            });
        }
        
        // Find order
        const order = await Order.findById(orderId)
            .populate('products.product', 'name image price')
            .populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        // Store original status for comparison
        const originalAdminStatus = order.adminStatus;
        
        // Update admin status
        order.adminStatus = adminStatus;
        
        // Add notes if provided
        if (notes) {
            if (!order.adminNotes) {
                order.adminNotes = [];
            }
            order.adminNotes.push({
                status: adminStatus,
                notes: notes,
                timestamp: new Date(),
                adminId: req.user._id
            });
        }
        
        await order.save();
        
        console.log(`✅ Updated order ${orderId} admin status: ${originalAdminStatus} → ${adminStatus}`);
        
        // Send notification to customer about status update
        try {
            await notificationService.sendOrderStatusUpdateNotification(order, adminStatus);
            console.log(`📢 Sent notification for order ${orderId} admin status change to ${adminStatus}`);
        } catch (notificationError) {
            console.error('Error sending order status update notification:', notificationError);
            // Don't fail the order update if notification fails
        }
        
        res.status(200).json({
            success: true,
            data: {
                ...order.toObject(),
                computedStatus: getComputedOrderStatus(order)
            },
            message: 'Admin order status updated successfully'
        });
        
    } catch (error) {
        console.error('Update admin order status error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update admin order status',
            error: error.message
        });
    }
};

/**
 * Place Lalamove order (admin action)
 * POST /api/admin/orders/:orderId/place-lalamove
 */
export const placeLalamoveOrder = async (req, res) => {
    try {
        const { orderId } = req.params;
        
        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }
        
        // Find order
        const order = await Order.findById(orderId)
            .populate('products.product', 'name image price')
            .populate('user', 'name email');
        
        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }
        
        if (order.shippingMethod !== 'lalamove') {
            return res.status(400).json({
                success: false,
                message: 'Order is not a Lalamove delivery order'
            });
        }
        
        if (!order.lalamoveDetails) {
            return res.status(400).json({
                success: false,
                message: 'Lalamove details not found for this order'
            });
        }
        
        if (order.lalamoveDetails.status !== 'pending_placement') {
            return res.status(400).json({
                success: false,
                message: 'Order is not ready for Lalamove placement'
            });
        }
        
        try {
            // Normalize PH phone numbers to E.164
            const toE164PH = (raw) => {
                const digits = (raw || '').replace(/\D/g, '');
                if (!digits) return raw;
                if (digits.startsWith('0')) return '+63' + digits.slice(1);
                if (digits.startsWith('63')) return '+' + digits;
                if (digits.startsWith('9') && digits.length === 10) return '+63' + digits;
                return raw;
            };
            console.log('Generating new Lalamove quotation for order:', orderId);
            
            // Prepare stops for new quotation
            const stops = [
                {
                    coordinates: {
                        lat: process.env.LALAMOVE_PICKUP_LAT,
                        lng: process.env.LALAMOVE_PICKUP_LNG
                    },
                    address: process.env.LALAMOVE_PICKUP_ADDRESS
                },
                {
                    coordinates: {
                        lat: order.shippingInfo.coordinates.lat.toString(),
                        lng: order.shippingInfo.coordinates.lng.toString()
                    },
                    address: order.shippingInfo.fullAddress
                }
            ];
            
            // Calculate total box quantity
            const totalBoxQuantity = order.products.reduce((sum, item) => sum + item.quantity, 0);
            
            // Get new quotation from Lalamove
            const quotation = await lalamoveService.getQuotation({
                stops: stops,
                boxQuantity: totalBoxQuantity,
                distance: order.lalamoveDetails.distance,
                language: 'en_PH'
            });
            
            console.log('New quotation generated:', quotation.data.data.quotationId);
            
            // Extract stop IDs from new quotation
            const stopId0 = quotation.data.data.stops[0].stopId;
            const stopId1 = quotation.data.data.stops[1].stopId;
            
            // Prepare Lalamove order data
            const lalamoveOrderData = {
                quotationId: quotation.data.data.quotationId,
                senderName: "Rosel Store",
                senderPhone: toE164PH(process.env.LALAMOVE_PICK_PHONE),
                recipientName: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
                recipientPhone: toE164PH(order.shippingInfo.phone),
                recipientRemarks: `Order #${order._id}`,
                stopId0: stopId0,
                stopId1: stopId1
            };
            
            console.log('Placing Lalamove order with data:', lalamoveOrderData);
            
            // Place the order with Lalamove
            const lalamoveOrder = await lalamoveService.placeOrder(lalamoveOrderData);
            
            // Update order with Lalamove order details
            order.lalamoveDetails.orderId = lalamoveOrder.data.data.orderId;
            order.lalamoveDetails.status = 'pending';
            order.lalamoveDetails.trackingUrl = lalamoveOrder.data.data.trackingUrl;
            order.lalamoveDetails.lastStatusUpdate = new Date();
            
            // Update admin status
            order.adminStatus = 'order_placed';
            
            await order.save();
            
            console.log('✅ Lalamove order placed successfully:', lalamoveOrder.data.data.orderId);
            
            // Send notification to customer
            try {
                await notificationService.sendOrderStatusUpdateNotification(order, 'order_placed');
                console.log(`📢 Sent notification for order ${orderId} Lalamove placement`);
            } catch (notificationError) {
                console.error('Error sending Lalamove placement notification:', notificationError);
            }
            
            res.status(200).json({
                success: true,
                data: {
                    ...order.toObject(),
                    computedStatus: getComputedOrderStatus(order),
                    lalamoveOrderId: lalamoveOrder.data.data.orderId,
                    trackingUrl: lalamoveOrder.data.data.trackingUrl
                },
                message: 'Lalamove order placed successfully'
            });
            
        } catch (lalamoveError) {
            console.error('Failed to place Lalamove order:', lalamoveError);
            
            // Update order status to indicate failure
            order.lalamoveDetails.status = 'failed';
            order.lalamoveDetails.lastStatusUpdate = new Date();
            await order.save();
            
            // If upstream returned a structured error (e.g., 422), surface it
            const upstreamStatus = lalamoveError?.response?.status;
            const upstreamErrors = lalamoveError?.response?.data?.errors;
            const upstreamMessage = Array.isArray(upstreamErrors) && upstreamErrors[0]?.message
                ? upstreamErrors[0].message
                : lalamoveError.message;

            res.status(upstreamStatus || 500).json({
                success: false,
                message: 'Failed to place Lalamove order',
                error: upstreamMessage,
                details: upstreamErrors || undefined
            });
        }
        
    } catch (error) {
        console.error('Place Lalamove order error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to place Lalamove order',
            error: error.message
        });
    }
};

/**
 * Get orders ready for admin action
 * GET /api/admin/orders/pending-actions
 */
export const getOrdersPendingActions = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        
        // Build query filter for orders that need admin attention
        const filter = {
            paymentStatus: 'paid',
            $or: [
                { adminStatus: 'order_received' },
                { adminStatus: 'order_preparing' },
                { adminStatus: 'order_prepared' },
                { 'lalamoveDetails.status': 'pending_placement' }
            ]
        };
        
        if (status) {
            filter.adminStatus = status;
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get orders with populated details
        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('products.product', 'name image price category')
            .sort({ createdAt: -1 })
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
            needsAction: getOrderNeedsAction(order)
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
            message: 'Orders pending actions retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get orders pending actions error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve orders pending actions',
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
 * Helper function to determine if order needs admin action
 */
function getOrderNeedsAction(order) {
    if (order.paymentStatus !== 'paid') {
        return false;
    }
    
    if (order.shippingMethod === 'pickup') {
        return ['order_received', 'order_preparing', 'order_prepared'].includes(order.adminStatus);
    }
    
    if (order.shippingMethod === 'lalamove') {
        if (order.lalamoveDetails?.status === 'pending_placement') {
            return ['order_received', 'order_preparing', 'order_prepared'].includes(order.adminStatus);
        }
        return false;
    }
    
    return false;
}
