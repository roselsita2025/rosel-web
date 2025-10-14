import mongoose from "mongoose";

const writeOffSchema = new mongoose.Schema(
    {
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },
        // For weight-based products, track which weight option was written off
        weightOptionId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },
        weightKg: {
            type: Number,
            default: null
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        reason: {
            type: String,
            required: true,
            enum: [
                'expired',
                'damaged',
                'defective',
                'spoiled',
                'lost',
                'theft',
                'quality_issue',
                'other'
            ]
        },
        description: {
            type: String,
            required: true,
            maxlength: 1000
        },
        // Calculated cost of the written off items
        cost: {
            type: Number,
            required: true,
            min: 0
        },
        // Admin who performed the write-off
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        adminName: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'approved' // Write-offs are auto-approved when created
        },
        // Additional metadata
        productName: {
            type: String,
            required: true
        },
        productCategory: {
            type: String,
            required: true
        },
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    { timestamps: true }
);

// Indexes for better query performance
writeOffSchema.index({ product: 1, createdAt: -1 });
writeOffSchema.index({ adminId: 1, createdAt: -1 });
writeOffSchema.index({ reason: 1, createdAt: -1 });
writeOffSchema.index({ productCategory: 1, createdAt: -1 });
writeOffSchema.index({ status: 1, createdAt: -1 });

// Virtual for total cost calculation
writeOffSchema.virtual('totalCost').get(function() {
    return this.cost * this.quantity;
});

// Ensure virtual fields are serialized
writeOffSchema.set('toJSON', { virtuals: true });
writeOffSchema.set('toObject', { virtuals: true });

const WriteOff = mongoose.model("WriteOff", writeOffSchema);

export default WriteOff;
