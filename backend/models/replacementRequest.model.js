import mongoose from "mongoose";

const replacementRequestSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: true,
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity: {
            type: Number,
            required: true,
            min: 1,
        },
        reason: {
            type: String,
            required: true,
            enum: [
                'defective',
                'wrong_item',
                'damaged_during_shipping',
                'quality_issue',
                'not_as_described',
                'expired_product',
                'other'
            ]
        },
        description: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        contactNumber: {
            type: String,
            required: true,
            validate: {
                validator: function(v) {
                    // Philippine phone number validation (starts with +63 or 09)
                    return /^(\+63|0)9\d{9}$/.test(v);
                },
                message: 'Please provide a valid Philippine phone number (e.g., +639123456789 or 09123456789)'
            }
        },
        status: {
            type: String,
            enum: [
                'pending',
                'under_review',
                'approved',
                'rejected',
                'processing',
                'shipped',
                'completed',
                'cancelled'
            ],
            default: 'pending'
        },
        adminResponse: {
            type: String,
            maxlength: 1000,
            default: ''
        },
        rejectionReason: {
            type: String,
            maxlength: 1000,
            default: ''
        },
        adminResponseDate: {
            type: Date,
        },
        replacementProduct: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
        replacementQuantity: {
            type: Number,
            min: 1,
        },
        trackingNumber: {
            type: String,
            default: ''
        },
        images: {
            type: [String],
            default: [],
            validate: {
                validator: function(images) {
                    return images.length <= 5; // Maximum 5 images
                },
                message: 'Maximum 5 images allowed'
            }
        },
        estimatedResolutionDate: {
            type: Date,
        },
        actualResolutionDate: {
            type: Date,
        },
        // For tracking who handled the request
        handledBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        // Internal notes for admin use
        internalNotes: {
            type: String,
            maxlength: 2000,
            default: ''
        }
    },
    { timestamps: true }
);

// Indexes for better query performance
replacementRequestSchema.index({ user: 1, createdAt: -1 });
replacementRequestSchema.index({ status: 1, createdAt: -1 });
replacementRequestSchema.index({ order: 1 });
replacementRequestSchema.index({ product: 1 });

// Virtual for request number (last 8 characters of ID)
replacementRequestSchema.virtual('requestNumber').get(function() {
    return this._id.toString().slice(-8).toUpperCase();
});

// Ensure virtual fields are serialized
replacementRequestSchema.set('toJSON', { virtuals: true });
replacementRequestSchema.set('toObject', { virtuals: true });

// Pre-save middleware to set admin response date when admin responds
replacementRequestSchema.pre('save', function(next) {
    if (this.isModified('adminResponse') && this.adminResponse && this.adminResponse.trim() !== '') {
        this.adminResponseDate = new Date();
    }
    next();
});

// Static method to get request statistics
replacementRequestSchema.statics.getStats = async function() {
    const stats = await this.aggregate([
        {
            $group: {
                _id: null,
                totalRequests: { $sum: 1 },
                pendingRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                },
                underReviewRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'under_review'] }, 1, 0] }
                },
                approvedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
                },
                rejectedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
                },
                completedRequests: {
                    $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
                },
                highPriorityRequests: {
                    $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
                },
                urgentRequests: {
                    $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
                }
            }
        }
    ]);

    return stats[0] || {
        totalRequests: 0,
        pendingRequests: 0,
        underReviewRequests: 0,
        approvedRequests: 0,
        rejectedRequests: 0,
        completedRequests: 0,
        highPriorityRequests: 0,
        urgentRequests: 0
    };
};

// Instance method to check if request can be updated
replacementRequestSchema.methods.canBeUpdated = function() {
    const nonUpdatableStatuses = ['completed', 'cancelled'];
    return !nonUpdatableStatuses.includes(this.status);
};

// Instance method to get status color for UI
replacementRequestSchema.methods.getStatusColor = function() {
    const statusColors = {
        pending: 'yellow',
        under_review: 'blue',
        approved: 'green',
        rejected: 'red',
        processing: 'purple',
        shipped: 'indigo',
        completed: 'green',
        cancelled: 'gray'
    };
    return statusColors[this.status] || 'gray';
};

// Instance method to get priority color for UI
replacementRequestSchema.methods.getPriorityColor = function() {
    const priorityColors = {
        low: 'green',
        medium: 'yellow',
        high: 'orange',
        urgent: 'red'
    };
    return priorityColors[this.priority] || 'gray';
};

const ReplacementRequest = mongoose.model('ReplacementRequest', replacementRequestSchema);

export default ReplacementRequest;
