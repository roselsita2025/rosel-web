import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const notificationSchema = new mongoose.Schema({
    // Notification identification
    notificationId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Recipient information
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Notification type and category
    type: {
        type: String,
        enum: [
            // Admin notifications
            'inventory_alert',
            'sales_alert', 
            'order_alert',
            'customer_alert',
            // Customer notifications
            'promotion',
            'order_notification',
            'request_notification'
        ],
        required: true
    },
    
    // Notification category for grouping
    category: {
        type: String,
        enum: [
            // Admin categories
            'inventory',
            'sales',
            'orders',
            'customers',
            // Customer categories
            'promotions',
            'orders',
            'requests'
        ],
        required: true
    },
    
    // Notification subcategory for specific actions
    subcategory: {
        type: String,
        enum: [
            // Inventory subcategories
            'low_stock',
            'stock_update',
            'product_created',
            'product_updated',
            'product_removed',
            // Order subcategories
            'order_pending',
            'order_processing',
            'order_shipped',
            'order_delivered',
            'order_cancelled',
            // Customer subcategories
            'new_request',
            'request_update',
            'chat_message',
            // Promotion subcategories
            'top_selling',
            'special_offer',
            'discount_available'
        ],
        required: true
    },
    
    // Notification content
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    message: {
        type: String,
        required: true,
        maxlength: 500
    },
    
    // Related entity references
    relatedEntity: {
        type: {
            type: String,
            enum: ['product', 'order', 'replacement_request', 'chat', 'user']
        },
        id: {
            type: mongoose.Schema.Types.ObjectId
        }
    },
    
    // Additional data for the notification
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Notification status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    
    // Priority level
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    
    // Expiration date (for time-sensitive notifications)
    expiresAt: {
        type: Date,
        default: null
    },
    
    // Action URL for the notification
    actionUrl: {
        type: String,
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ type: 1, category: 1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ 'relatedEntity.type': 1, 'relatedEntity.id': 1 });

// Virtual for time ago
notificationSchema.virtual('timeAgo').get(function() {
    const now = new Date();
    const diffInSeconds = Math.floor((now - this.createdAt) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return this.createdAt.toLocaleDateString();
});

// Ensure virtual fields are serialized
notificationSchema.set('toJSON', { virtuals: true });
notificationSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set readAt when isRead changes
notificationSchema.pre('save', function(next) {
    if (this.isModified('isRead') && this.isRead && !this.readAt) {
        this.readAt = new Date();
    }
    next();
});

// Static method to get notification statistics
notificationSchema.statics.getStats = async function(recipientId = null) {
    const matchStage = recipientId ? { recipient: recipientId } : {};
    
    const stats = await this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                unread: {
                    $sum: { $cond: [{ $eq: ['$isRead', false] }, 1, 0] }
                },
                byCategory: {
                    $push: {
                        category: '$category',
                        isRead: '$isRead'
                    }
                },
                byPriority: {
                    $push: {
                        priority: '$priority',
                        isRead: '$isRead'
                    }
                }
            }
        }
    ]);

    if (stats.length === 0) {
        return {
            total: 0,
            unread: 0,
            byCategory: {},
            byPriority: {}
        };
    }

    const result = stats[0];
    
    // Process category stats
    const categoryStats = {};
    result.byCategory.forEach(item => {
        if (!categoryStats[item.category]) {
            categoryStats[item.category] = { total: 0, unread: 0 };
        }
        categoryStats[item.category].total++;
        if (!item.isRead) categoryStats[item.category].unread++;
    });

    // Process priority stats
    const priorityStats = {};
    result.byPriority.forEach(item => {
        if (!priorityStats[item.priority]) {
            priorityStats[item.priority] = { total: 0, unread: 0 };
        }
        priorityStats[item.priority].total++;
        if (!item.isRead) priorityStats[item.priority].unread++;
    });

    return {
        total: result.total,
        unread: result.unread,
        byCategory: categoryStats,
        byPriority: priorityStats
    };
};

// Static method to create notification
notificationSchema.statics.createNotification = async function({
    recipient,
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
    console.log('📝 Creating notification with data:', { recipient, type, category, subcategory, title, message });
    const notificationId = uuidv4();
    
    const notification = new this({
        notificationId,
        recipient,
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

    await notification.save();
    console.log('✅ Notification created successfully:', notification.notificationId);
    return notification;
};

// Instance method to mark as read
notificationSchema.methods.markAsRead = function() {
    this.isRead = true;
    this.readAt = new Date();
    return this.save();
};

// Instance method to get priority color for UI
notificationSchema.methods.getPriorityColor = function() {
    const colors = {
        low: 'green',
        medium: 'blue',
        high: 'orange',
        urgent: 'red'
    };
    return colors[this.priority] || 'blue';
};

// Instance method to check if notification is expired
notificationSchema.methods.isExpired = function() {
    return this.expiresAt && new Date() > this.expiresAt;
};

// Static method to clean up expired notifications
notificationSchema.statics.cleanupExpired = async function() {
    const result = await this.deleteMany({
        expiresAt: { $lt: new Date() }
    });
    return result.deletedCount;
};

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
