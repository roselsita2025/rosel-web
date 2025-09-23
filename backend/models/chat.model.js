import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    // Chat identification
    chatId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Participants
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    
    // Chat type and status
    type: {
        type: String,
        enum: ['faq', 'support', 'chatbot'],
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'waiting', 'resolved', 'closed', 'ended'],
        default: 'active'
    },
    
    // Customer details for support chats
    customerDetails: {
        name: { type: String, default: "" },
        contactNumber: { type: String, default: "" },
        issue: { type: String, default: "" }
    },
    
    // Chat metadata
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    lastMessageAt: {
        type: Date,
        default: Date.now
    },
    
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Index for efficient queries
chatSchema.index({ customer: 1, status: 1 });
chatSchema.index({ admin: 1, status: 1 });
chatSchema.index({ lastMessageAt: -1 });

export const Chat = mongoose.model('Chat', chatSchema);
