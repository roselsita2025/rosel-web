import Notification from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { socketService } from '../services/socketService.js';

/**
 * Get notifications for the authenticated user
 * GET /api/notifications
 */
export const getUserNotifications = async (req, res) => {
    try {
        const userId = req.user._id;
        const { 
            page = 1, 
            limit = 20, 
            category, 
            isRead, 
            priority,
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        // Build query filter
        const filter = { recipient: userId };
        
        // Handle null values properly (convert 'null' strings to actual null)
        if (category && category !== 'null') filter.category = category;
        if (isRead !== undefined && isRead !== 'null') filter.isRead = isRead === 'true';
        if (priority && priority !== 'null') filter.priority = priority;

        console.log('🔍 Notification filter:', filter);
        console.log('🔍 User ID:', userId);
        console.log('🔍 Query params:', { category, isRead, priority });

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get notifications
        const notifications = await Notification.find(filter)
            .populate('recipient', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        console.log('📋 Found notifications:', notifications.length);

        // Get total count for pagination
        const totalNotifications = await Notification.countDocuments(filter);

        // Get unread count
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        console.log('📊 Notification stats:', { totalNotifications, unreadCount });

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalNotifications / parseInt(limit)),
                    totalNotifications,
                    hasNextPage: skip + notifications.length < totalNotifications,
                    hasPrevPage: parseInt(page) > 1
                },
                unreadCount
            },
            message: 'Notifications retrieved successfully'
        });

    } catch (error) {
        console.error('Get user notifications error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notifications',
            error: error.message
        });
    }
};

/**
 * Get notification statistics for the authenticated user
 * GET /api/notifications/stats
 */
export const getNotificationStats = async (req, res) => {
    try {
        const userId = req.user._id;
        const stats = await Notification.getStats(userId);

        res.status(200).json({
            success: true,
            data: stats,
            message: 'Notification statistics retrieved successfully'
        });

    } catch (error) {
        console.error('Get notification stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification statistics',
            error: error.message
        });
    }
};

/**
 * Mark a notification as read
 * PATCH /api/notifications/:notificationId/read
 */
export const markNotificationAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }

        // Find notification and verify ownership
        const notification = await Notification.findOne({
            notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or access denied'
            });
        }

        // Mark as read
        await notification.markAsRead();

        res.status(200).json({
            success: true,
            data: notification,
            message: 'Notification marked as read'
        });

    } catch (error) {
        console.error('Mark notification as read error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to mark notification as read',
            error: error.message
        });
    }
};

/**
 * Mark all notifications as read for the authenticated user
 * PATCH /api/notifications/mark-all-read
 */
export const markAllNotificationsAsRead = async (req, res) => {
    try {
        const userId = req.user._id;

        const result = await Notification.updateMany(
            { recipient: userId, isRead: false },
            { 
                isRead: true, 
                readAt: new Date() 
            }
        );

        res.status(200).json({
            success: true,
            data: {
                modifiedCount: result.modifiedCount
            },
            message: `${result.modifiedCount} notifications marked as read`
        });

    } catch (error) {
        console.error('Mark all notifications as read error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to mark all notifications as read',
            error: error.message
        });
    }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;
        const userId = req.user._id;

        if (!notificationId) {
            return res.status(400).json({
                success: false,
                message: 'Notification ID is required'
            });
        }

        // Find and delete notification
        const notification = await Notification.findOneAndDelete({
            notificationId,
            recipient: userId
        });

        if (!notification) {
            return res.status(404).json({
                success: false,
                message: 'Notification not found or access denied'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Notification deleted successfully'
        });

    } catch (error) {
        console.error('Delete notification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete notification',
            error: error.message
        });
    }
};

/**
 * Get all notifications for admin (all users)
 * GET /api/admin/notifications
 */
export const getAllNotifications = async (req, res) => {
    try {
        const { 
            page = 1, 
            limit = 20, 
            category, 
            type,
            isRead, 
            priority,
            recipientId,
            sortBy = 'createdAt', 
            sortOrder = 'desc' 
        } = req.query;

        // Build query filter
        const filter = {};
        
        if (category) filter.category = category;
        if (type) filter.type = type;
        if (isRead !== undefined) filter.isRead = isRead === 'true';
        if (priority) filter.priority = priority;
        if (recipientId) filter.recipient = recipientId;

        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Get notifications
        const notifications = await Notification.find(filter)
            .populate('recipient', 'name email role')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        // Get total count for pagination
        const totalNotifications = await Notification.countDocuments(filter);

        // Get overall statistics
        const stats = await Notification.getStats();

        res.status(200).json({
            success: true,
            data: {
                notifications,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalNotifications / parseInt(limit)),
                    totalNotifications,
                    hasNextPage: skip + notifications.length < totalNotifications,
                    hasPrevPage: parseInt(page) > 1
                },
                stats
            },
            message: 'All notifications retrieved successfully'
        });

    } catch (error) {
        console.error('Get all notifications error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve all notifications',
            error: error.message
        });
    }
};

/**
 * Create a notification (Admin only)
 * POST /api/admin/notifications
 */
export const createNotification = async (req, res) => {
    try {
        const {
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
        } = req.body;

        // Validate required fields
        if (!recipientId || !type || !category || !subcategory || !title || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: recipientId, type, category, subcategory, title, message'
            });
        }

        // Verify recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: 'Recipient not found'
            });
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

        // Emit real-time notification
        socketService.emitToUser(recipientId.toString(), 'new_notification', {
            notification
        });

        res.status(201).json({
            success: true,
            data: notification,
            message: 'Notification created successfully'
        });

    } catch (error) {
        console.error('Create notification error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create notification',
            error: error.message
        });
    }
};

/**
 * Bulk create notifications (Admin only)
 * POST /api/admin/notifications/bulk
 */
export const createBulkNotifications = async (req, res) => {
    try {
        const { notifications } = req.body;

        if (!Array.isArray(notifications) || notifications.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Notifications array is required and cannot be empty'
            });
        }

        const createdNotifications = [];
        const errors = [];

        for (let i = 0; i < notifications.length; i++) {
            try {
                const notificationData = notifications[i];
                
                // Validate required fields
                if (!notificationData.recipientId || !notificationData.type || 
                    !notificationData.category || !notificationData.subcategory || 
                    !notificationData.title || !notificationData.message) {
                    errors.push({
                        index: i,
                        error: 'Missing required fields'
                    });
                    continue;
                }

                // Verify recipient exists
                const recipient = await User.findById(notificationData.recipientId);
                if (!recipient) {
                    errors.push({
                        index: i,
                        error: 'Recipient not found'
                    });
                    continue;
                }

                // Create notification
                const notification = await Notification.createNotification({
                    recipient: notificationData.recipientId,
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
                createdNotifications.push(notification);

                // Emit real-time notification
                socketService.emitToUser(notificationData.recipientId.toString(), 'new_notification', {
                    notification
                });

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message
                });
            }
        }

        res.status(201).json({
            success: true,
            data: {
                created: createdNotifications,
                errors: errors,
                summary: {
                    total: notifications.length,
                    created: createdNotifications.length,
                    failed: errors.length
                }
            },
            message: `Bulk notification creation completed. ${createdNotifications.length} created, ${errors.length} failed`
        });

    } catch (error) {
        console.error('Create bulk notifications error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create bulk notifications',
            error: error.message
        });
    }
};

/**
 * Clean up expired notifications (Admin only)
 * DELETE /api/admin/notifications/cleanup
 */
export const cleanupExpiredNotifications = async (req, res) => {
    try {
        const deletedCount = await Notification.cleanupExpired();

        res.status(200).json({
            success: true,
            data: {
                deletedCount
            },
            message: `${deletedCount} expired notifications cleaned up`
        });

    } catch (error) {
        console.error('Cleanup expired notifications error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to cleanup expired notifications',
            error: error.message
        });
    }
};

/**
 * Get notification summary for dropdown
 * GET /api/notifications/summary
 */
export const getNotificationSummary = async (req, res) => {
    try {
        const userId = req.user._id;
        const { limit = 5 } = req.query;

        // Get recent unread notifications
        const recentNotifications = await Notification.find({
            recipient: userId,
            isRead: false
        })
        .populate('recipient', 'name email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

        // Get unread count by category
        const categoryCounts = await Notification.aggregate([
            { $match: { recipient: userId, isRead: false } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        // Get total unread count
        const totalUnread = await Notification.countDocuments({
            recipient: userId,
            isRead: false
        });

        res.status(200).json({
            success: true,
            data: {
                recentNotifications,
                categoryCounts: categoryCounts.reduce((acc, item) => {
                    acc[item._id] = item.count;
                    return acc;
                }, {}),
                totalUnread
            },
            message: 'Notification summary retrieved successfully'
        });

    } catch (error) {
        console.error('Get notification summary error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve notification summary',
            error: error.message
        });
    }
};

/**
 * Test notification endpoint for debugging
 * POST /api/notifications/test
 */
export const testNotification = async (req, res) => {
    try {
        const { notificationService } = await import('../services/notificationService.js');
        
        // Create a test product object
        const testProduct = {
            _id: 'test-product-id',
            name: 'Test Product',
            price: 29.99,
            image: 'https://via.placeholder.com/150',
            mainImageUrl: 'https://via.placeholder.com/150'
        };
        
        // Send test low stock notification
        const result = await notificationService.sendLowStockAlert(testProduct, 5, 10);
        
        res.status(200).json({
            success: true,
            data: result,
            message: 'Test notification sent successfully'
        });
    } catch (error) {
        console.error('Error sending test notification:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send test notification',
            error: error.message
        });
    }
};
