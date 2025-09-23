import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    // Message identification
    messageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Chat reference
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
    // Sender information
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    senderType: {
        type: String,
        enum: ['customer', 'admin', 'bot'],
        required: true
    },
    
    // Message content
    content: {
        type: String,
        required: true,
        maxlength: 2000
    },
    messageType: {
        type: String,
        enum: ['text', 'system', 'bot_response'],
        default: 'text'
    },
    
    // Message status
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    
    // For bot messages - reference to FAQ
    faqReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQ',
        default: null
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

export const Message = mongoose.model('Message', messageSchema);
