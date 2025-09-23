import Notification from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { socketService } from './socketService.js';
import { sendEmail } from '../sendgrid/emails.js';
import { LOW_STOCK_ALERT_TEMPLATE } from '../sendgrid/emailTemplates.js';

class NotificationService {
    constructor() {
        this.socketService = socketService;
    }

    /**
     * Create and send a notification
     * @param {Object} notificationData - Notification data
     * @param {string} notificationData.recipientId - User ID of the recipient
     * @param {string} notificationData.type - Notification type
     * @param {string} notificationData.category - Notification category
     * @param {string} notificationData.subcategory - Notification subcategory
     * @param {string} notificationData.title - Notification title
     * @param {string} notificationData.message - Notification message
     * @param {Object} notificationData.relatedEntity - Related entity info
     * @param {Object} notificationData.data - Additional data
     * @param {string} notificationData.priority - Priority level
     * @param {Date} notificationData.expiresAt - Expiration date
     * @param {string} notificationData.actionUrl - Action URL
     * @returns {Promise<Object>} Created notification
     */
    async createNotification({
        recipientId,
        type,
        category,
        subcategory,
        title,
        message,
        relatedEntity = null,
        data = {},
        priority = 'medium',
        expiresAt = null,
        actionUrl = null
    }) {
        try {
            // Verify recipient exists
            const recipient = await User.findById(recipientId);
            if (!recipient) {
                throw new Error(`Recipient with ID ${recipientId} not found`);
            }

            // Create notification
            const notification = await Notification.createNotification({
                recipient: recipientId,
                type,
                category,
                subcategory,
                title,
                message,
                relatedEntity,
                data,
                priority,
                expiresAt,
                actionUrl
            });

            // Populate recipient info
            await notification.populate('recipient', 'name email role');

            // Send real-time notification via WebSocket
            this.socketService.emitToUser(recipientId.toString(), 'new_notification', {
                notification
            });

            console.log(`📢 Notification sent to user ${recipient.name} (${recipient.email}): ${title}`);
            
            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create notifications for multiple recipients
     * @param {Array} recipients - Array of recipient IDs
     * @param {Object} notificationData - Notification data (same as createNotification)
     * @returns {Promise<Array>} Array of created notifications
     */
    async createBulkNotifications(recipients, notificationData) {
        const notifications = [];
        const errors = [];

        for (const recipientId of recipients) {
            try {
                console.log(`📋 Creating notification for recipient: ${recipientId}`);
                const notification = await Notification.createNotification({
                    recipient: recipientId,
                    type: notificationData.type,
                    category: notificationData.category,
                    subcategory: notificationData.subcategory,
                    title: notificationData.title,
                    message: notificationData.message,
                    relatedEntity: notificationData.relatedEntity || null,
                    data: notificationData.data || {},
                    priority: notificationData.priority || 'medium',
                    expiresAt: notificationData.expiresAt || null,
                    actionUrl: notificationData.actionUrl || null
                });

                await notification.populate('recipient', 'name email role');
                notifications.push(notification);
                console.log(`✅ Created notification: ${notification.notificationId}`);

                // Emit real-time notification
                this.socketService.emitToUser(recipientId, 'new_notification', {
                    notification
                });
                console.log(`📡 Emitted real-time notification to user: ${recipientId}`);
            } catch (error) {
                console.error(`❌ Error creating notification for ${recipientId}:`, error);
                errors.push({
                    recipientId,
                    error: error.message
                });
            }
        }

        console.log(`📢 Bulk notifications: ${notifications.length} sent, ${errors.length} failed`);
        
        return {
            notifications,
            errors,
            summary: {
                total: recipients.length,
                sent: notifications.length,
                failed: errors.length
            }
        };
    }

    /**
     * Create notification for all admins
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Bulk notification result
     */
    async notifyAdmins(notificationData) {
        try {
            console.log('🔔 Notifying admins with data:', notificationData);
            const admins = await User.find({ role: 'admin' }).select('_id');
            console.log(`👥 Found ${admins.length} admins:`, admins.map(a => a._id));
            const adminIds = admins.map(admin => admin._id.toString());
            
            const result = await this.createBulkNotifications(adminIds, notificationData);
            console.log('✅ Admin notification result:', result);
            return result;
        } catch (error) {
            console.error('❌ Error notifying admins:', error);
            throw error;
        }
    }

    /**
     * Create notification for all customers
     * @param {Object} notificationData - Notification data
     * @returns {Promise<Object>} Bulk notification result
     */
    async notifyCustomers(notificationData) {
        try {
            const customers = await User.find({ role: 'customer' }).select('_id');
            const customerIds = customers.map(customer => customer._id.toString());
            
            return await this.createBulkNotifications(customerIds, notificationData);
        } catch (error) {
            console.error('Error notifying customers:', error);
            throw error;
        }
    }

    // ==================== INVENTORY NOTIFICATIONS ====================

    /**
     * Send low stock alert to admins
     * @param {Object} product - Product object
     * @param {number} currentStock - Current stock level
     * @param {number} threshold - Stock threshold
     */
    async sendLowStockAlert(product, currentStock, threshold = 10) {
        const notificationData = {
            type: 'inventory_alert',
            category: 'inventory',
            subcategory: 'low_stock',
            title: 'Low Stock Alert',
            message: `${product.name} is running low on stock. Current: ${currentStock}, Threshold: ${threshold}`,
            relatedEntity: {
                type: 'product',
                id: product._id
            },
            data: {
                productName: product.name,
                currentStock,
                threshold,
                productImage: product.image || product.mainImageUrl
            },
            priority: currentStock <= 5 ? 'high' : 'medium',
            actionUrl: `/manage-products?product=${product._id}`
        };

        // Create in-app + realtime notifications for admins
        const result = await this.notifyAdmins(notificationData);

        // Send email notification to all admin users (best-effort)
        try {
            const admins = await User.find({ role: 'admin', email: { $exists: true, $ne: null } }).select('email');
            const adminEmails = admins.map(a => a.email).filter(Boolean);
            if (adminEmails.length > 0) {
                await sendEmail(
                    adminEmails,
                    `Low Stock: ${product.name} (${currentStock} left)`,
                    LOW_STOCK_ALERT_TEMPLATE,
                    {
                        productName: product.name,
                        currentStock: String(currentStock),
                        threshold: String(threshold),
                        productImage: product.image || product.mainImageUrl || '',
                        manageUrl: `${process.env.CLIENT_URL || ''}/manage-products?product=${product._id}`
                    }
                );
            }
        } catch (emailError) {
            console.error('Error sending low stock email alerts:', emailError);
        }

        return result;
    }

    /**
     * Send product created notification to admins
     * @param {Object} product - Product object
     */
    async sendProductCreatedNotification(product) {
        const notificationData = {
            type: 'inventory_alert',
            category: 'inventory',
            subcategory: 'product_created',
            title: 'New Product Added',
            message: `New product "${product.name}" has been added to inventory`,
            relatedEntity: {
                type: 'product',
                id: product._id
            },
            data: {
                productName: product.name,
                productCategory: product.category,
                productPrice: product.price,
                productImage: product.image || product.mainImageUrl
            },
            priority: 'medium',
            actionUrl: `/manage-products?product=${product._id}`
        };

        return await this.notifyAdmins(notificationData);
    }

    /**
     * Send product updated notification to admins
     * @param {Object} product - Product object
     * @param {Object} changes - Object containing what changed
     */
    async sendProductUpdatedNotification(product, changes = {}) {
        const notificationData = {
            type: 'inventory_alert',
            category: 'inventory',
            subcategory: 'product_updated',
            title: 'Product Updated',
            message: `Product "${product.name}" has been updated`,
            relatedEntity: {
                type: 'product',
                id: product._id
            },
            data: {
                productName: product.name,
                changes,
                productImage: product.image || product.mainImageUrl
            },
            priority: 'low',
            actionUrl: `/manage-products?product=${product._id}`
        };

        return await this.notifyAdmins(notificationData);
    }

    /**
     * Send product removed notification to admins
     * @param {Object} product - Product object
     */
    async sendProductRemovedNotification(product) {
        const notificationData = {
            type: 'inventory_alert',
            category: 'inventory',
            subcategory: 'product_removed',
            title: 'Product Removed',
            message: `Product "${product.name}" has been removed from inventory`,
            relatedEntity: {
                type: 'product',
                id: product._id
            },
            data: {
                productName: product.name,
                productCategory: product.category
            },
            priority: 'medium',
            actionUrl: '/manage-products'
        };

        return await this.notifyAdmins(notificationData);
    }

    // ==================== ORDER NOTIFICATIONS ====================

    /**
     * Send new order notification to admins
     * @param {Object} order - Order object
     */
    async sendNewOrderNotification(order) {
        const notificationData = {
            type: 'order_alert',
            category: 'orders',
            subcategory: 'order_pending',
            title: 'New Order Received',
            message: `New order #${order._id.toString().slice(-8).toUpperCase()} from ${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
            relatedEntity: {
                type: 'order',
                id: order._id
            },
            data: {
                orderId: order._id.toString().slice(-8).toUpperCase(),
                customerName: `${order.shippingInfo.firstName} ${order.shippingInfo.lastName}`,
                totalAmount: order.totalAmount,
                itemCount: order.products.reduce((sum, item) => sum + item.quantity, 0)
            },
            priority: 'high',
            actionUrl: `/orders-history?order=${order._id}`
        };

        return await this.notifyAdmins(notificationData);
    }

    /**
     * Send order status update notification to customer
     * @param {Object} order - Order object
     * @param {string} newStatus - New order status
     */
    async sendOrderStatusUpdateNotification(order, newStatus) {
        const statusMessages = {
            'processing': 'Your order is being processed',
            'shipped': 'Your order has been shipped',
            'delivered': 'Your order has been delivered',
            'cancelled': 'Your order has been cancelled'
        };

        // Map status to valid subcategory
        const subcategoryMap = {
            'processing': 'order_processing',
            'shipped': 'order_shipped',
            'delivered': 'order_delivered',
            'cancelled': 'order_cancelled'
        };

        const notificationData = {
            recipientId: order.user._id ? order.user._id.toString() : order.user.toString(),
            type: 'order_notification',
            category: 'orders',
            subcategory: subcategoryMap[newStatus] || 'order_processing',
            title: 'Order Status Update',
            message: `Order #${order._id.toString().slice(-8).toUpperCase()}: ${statusMessages[newStatus] || 'Status updated'}`,
            relatedEntity: {
                type: 'order',
                id: order._id
            },
            data: {
                orderId: order._id.toString().slice(-8).toUpperCase(),
                newStatus,
                totalAmount: order.totalAmount
            },
            priority: newStatus === 'cancelled' ? 'high' : 'medium',
            actionUrl: `/track-orders?order=${order._id}`
        };

        return await this.createNotification(notificationData);
    }

    // ==================== CUSTOMER REQUEST NOTIFICATIONS ====================

    /**
     * Send new replacement request notification to admins
     * @param {Object} request - Replacement request object
     */
    async sendNewReplacementRequestNotification(request) {
        const notificationData = {
            type: 'customer_alert',
            category: 'customers',
            subcategory: 'new_request',
            title: 'New Replacement Request',
            message: `New replacement request #${request.requestNumber} from ${request.user.name}`,
            relatedEntity: {
                type: 'replacement_request',
                id: request._id
            },
            data: {
                requestNumber: request.requestNumber,
                customerName: request.user.name,
                productName: request.product.name,
                reason: request.reason,
                priority: request.priority
            },
            priority: request.priority === 'urgent' ? 'urgent' : 'high',
            actionUrl: `/admin/replacement-requests/${request._id}`
        };

        return await this.notifyAdmins(notificationData);
    }

    /**
     * Send replacement request status update notification to customer
     * @param {Object} request - Replacement request object
     * @param {string} newStatus - New request status
     */
    async sendReplacementRequestStatusUpdateNotification(request, newStatus) {
        const statusMessages = {
            'under_review': 'Your replacement request is under review',
            'approved': 'Your replacement request has been approved and you will be contacted soon',
            'rejected': 'Your replacement request has been rejected',
            'processing': 'Your replacement request is being processed',
            'shipped': 'Your replacement has been shipped',
            'completed': 'Your replacement request has been completed'
        };

        const notificationData = {
            recipientId: request.user.toString(),
            type: 'request_notification',
            category: 'requests',
            subcategory: 'request_update',
            title: 'Replacement Request Update',
            message: newStatus === 'rejected' && request.rejectionReason 
                ? `Request #${request.requestNumber}: ${statusMessages[newStatus]} - ${request.rejectionReason}`
                : `Request #${request.requestNumber}: ${statusMessages[newStatus] || 'Status updated'}`,
            relatedEntity: {
                type: 'replacement_request',
                id: request._id
            },
            data: {
                requestNumber: request.requestNumber,
                newStatus,
                productName: request.product.name,
                adminResponse: request.adminResponse,
                rejectionReason: request.rejectionReason || null
            },
            priority: newStatus === 'rejected' ? 'high' : 'medium',
            actionUrl: `/replacement-requests/${request._id}`
        };

        return await this.createNotification(notificationData);
    }

    // ==================== PROMOTION NOTIFICATIONS ====================

    /**
     * Send promotion notification to customers
     * @param {Object} product - Product object
     * @param {string} promotionType - Type of promotion
     * @param {Object} promotionData - Additional promotion data
     */
    async sendPromotionNotification(product, promotionType = 'top_selling', promotionData = {}) {
        const promotionMessages = {
            'top_selling': `🔥 ${product.name} is our top-selling product! Don't miss out!`,
            'special_offer': `🎉 Special offer on ${product.name}! Limited time only!`,
            'discount_available': `💰 Discount available on ${product.name}! Check it out!`
        };

        const notificationData = {
            type: 'promotion',
            category: 'promotions',
            subcategory: promotionType,
            title: 'Special Promotion',
            message: promotionMessages[promotionType] || `Check out ${product.name}!`,
            relatedEntity: {
                type: 'product',
                id: product._id
            },
            data: {
                productName: product.name,
                productPrice: product.price,
                productImage: product.image || product.mainImageUrl,
                promotionType,
                ...promotionData
            },
            priority: 'low',
            actionUrl: `/product/${product._id}`,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        };

        return await this.notifyCustomers(notificationData);
    }

    // ==================== CHAT NOTIFICATIONS ====================

    /**
     * Send new chat message notification to admins
     * @param {Object} chat - Chat object
     * @param {Object} message - Message object
     */
    async sendNewChatMessageNotification(chat, message) {
        const notificationData = {
            type: 'customer_alert',
            category: 'customers',
            subcategory: 'chat_message',
            title: 'New Chat Message',
            message: `New message from ${chat.customer.name} in support chat`,
            relatedEntity: {
                type: 'chat',
                id: chat._id
            },
            data: {
                customerName: chat.customer.name,
                messagePreview: message.content.substring(0, 100),
                chatId: chat.chatId
            },
            priority: 'medium',
            actionUrl: `/admin/chat-management?chat=${chat.chatId}`
        };

        return await this.notifyAdmins(notificationData);
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Clean up expired notifications
     * @returns {Promise<number>} Number of deleted notifications
     */
    async cleanupExpiredNotifications() {
        try {
            const deletedCount = await Notification.cleanupExpired();
            console.log(`🧹 Cleaned up ${deletedCount} expired notifications`);
            return deletedCount;
        } catch (error) {
            console.error('Error cleaning up expired notifications:', error);
            throw error;
        }
    }

    /**
     * Get notification statistics
     * @param {string} userId - User ID (optional, for user-specific stats)
     * @returns {Promise<Object>} Notification statistics
     */
    async getNotificationStats(userId = null) {
        try {
            return await Notification.getStats(userId);
        } catch (error) {
            console.error('Error getting notification stats:', error);
            throw error;
        }
    }
}

// Create singleton instance
export const notificationService = new NotificationService();
