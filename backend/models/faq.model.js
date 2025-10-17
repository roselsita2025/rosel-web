import mongoose from "mongoose";

const faqSchema = new mongoose.Schema({
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
    
    category: {
        type: String,
        enum: ['delivery', 'payment', 'products', 'orders', 'returns', 'general'],
        required: true
    },
    
    keywords: [{
        type: String,
        lowercase: true
    }],
    
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
    
    viewCount: {
        type: Number,
        default: 0
    },
    lastUsed: {
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

faqSchema.index({ category: 1, isActive: 1 });
faqSchema.index({ keywords: 1 });
faqSchema.index({ priority: -1 });
faqSchema.index({ question: 'text', answer: 'text' });

export const FAQ = mongoose.model('FAQ', faqSchema);
