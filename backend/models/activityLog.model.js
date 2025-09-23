import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['created', 'updated', 'stock_in', 'stock_out', 'deleted'],
        required: true
    },
    details: {
        type: String,
        required: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    adminName: {
        type: String,
        required: true
    },
    changes: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    // Additional fields for stock operations
    quantityChange: {
        type: Number,
        default: 0
    },
    oldQuantity: {
        type: Number,
        default: 0
    },
    newQuantity: {
        type: Number,
        default: 0
    },
    reason: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

// Index for better query performance
activityLogSchema.index({ productId: 1, createdAt: -1 });
activityLogSchema.index({ adminId: 1, createdAt: -1 });
activityLogSchema.index({ action: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

export default ActivityLog;
