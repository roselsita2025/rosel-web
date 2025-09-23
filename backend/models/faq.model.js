import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
    // FAQ identification
    question: {
        type: String,
        required: true,
        maxlength: 500
    },
    answer: {
        type: String,
        required: true,
        maxlength: 2000
    },
    
    // FAQ categorization
    category: {
        type: String,
        enum: ['delivery', 'payment', 'products', 'orders', 'returns', 'general'],
        required: true
    },
    
    // Keywords for search matching
    keywords: [{
        type: String,
        lowercase: true
    }],
    
    // FAQ status and priority
    isActive: {
        type: Boolean,
        default: true
    },
    priority: {
        type: Number,
        default: 0,
        min: 0,
        max: 10
    },
    
    // Usage statistics
    viewCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
        type: Date,
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

// Index for efficient queries
faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ keywords: 1 });
faqSchema.index({ priority: -1 });
faqSchema.index({ question: 'text', answer: 'text' });

export const FAQ = mongoose.model('FAQ', faqSchema);
