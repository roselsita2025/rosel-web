import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const purchaseOrderSchema = new mongoose.Schema({
    purchaseOrderId: {
        type: String,
        required: true,
        unique: true,
        default: () => uuidv4()
    },
    
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    adminName: {
        type: String,
        required: true
    },
    
    supplier: {
        type: String,
        required: true,
        trim: true
    },
    
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: {
            type: String,
            required: true
        },
        category: {
            type: String,
            required: true
        },
        weightOptionId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        weightKg: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    }],
    
    subtotal: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    
    totalAmount: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled'],
        default: 'pending'
    },
    
    completedAt: {
        type: Date,
        default: null
    },
    
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

// Indexes for better query performance
purchaseOrderSchema.index({ admin: 1, createdAt: -1 });
purchaseOrderSchema.index({ supplier: 1, createdAt: -1 });
purchaseOrderSchema.index({ status: 1, createdAt: -1 });
purchaseOrderSchema.index({ purchaseOrderId: 1 });

// Virtual for formatted purchase order number
purchaseOrderSchema.virtual('purchaseOrderNumber').get(function() {
    return this.purchaseOrderId.split('-')[0].toUpperCase();
});

// Virtual for item count
purchaseOrderSchema.virtual('itemCount').get(function() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

purchaseOrderSchema.set('toJSON', { virtuals: true });
purchaseOrderSchema.set('toObject', { virtuals: true });

const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);

export default PurchaseOrder;
