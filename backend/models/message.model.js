import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    messageId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    
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
    
    isRead: {
        type: Boolean,
        default: false
    },
    readAt: {
        type: Date,
        default: null
    },
    
    faqReference: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'FAQ',
        default: null
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ isRead: 1 });

export const Message = mongoose.model('Message', messageSchema);
