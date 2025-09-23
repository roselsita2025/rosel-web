import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { FAQ } from '../models/faq.model.js';
import { User } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from '../services/socketService.js';
import { notificationService } from '../services/notificationService.js';

// Create a new chat session
export const createChat = async (req, res) => {
    try {
        const { type, customerDetails } = req.body;
        const customerId = req.user._id;

        // Validate chat type
        if (!['faq', 'support', 'chatbot'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat type. Must be "faq", "support", or "chatbot"'
            });
        }

        // Check if customer already has an active chat of this type
        const existingChat = await Chat.findOne({
            customer: customerId,
            type: type,
            status: { $in: ['active', 'waiting'] }
        });

        if (existingChat) {
            return res.status(200).json({
                success: true,
                message: 'Existing chat found',
                data: existingChat
            });
        }

        // Create new chat
        const chatId = uuidv4();
        const newChat = new Chat({
            chatId,
            customer: customerId,
            type,
            customerDetails: customerDetails || {}
        });

        await newChat.save();

        // If it's a support chat, create initial bot message
        if (type === 'support') {
            // Find or create bot user
            let botUser = await User.findOne({ role: 'bot' });
            if (!botUser) {
                botUser = new User({
                    name: 'Support Assistant',
                    email: 'support-bot@roselmeat.com',
                    password: 'bot_password_123',
                    role: 'bot',
                    isVerified: true
                });
                await botUser.save();
                console.log('Created support bot user');
            }

            const welcomeMessage = new Message({
                messageId: uuidv4(),
                chat: newChat._id,
                sender: botUser._id,
                senderType: 'bot',
                content: "Hello! I'm here to help you with your inquiry. How can I assist you today?",
                messageType: 'bot_response'
            });

            await welcomeMessage.save();

            // Update chat with last message
            newChat.lastMessage = welcomeMessage._id;
            newChat.lastMessageAt = welcomeMessage.createdAt;
            await newChat.save();
        }

        // If it's a chatbot, create initial bot message
        if (type === 'chatbot') {
            // Find or create chatbot user
            let chatbotUser = await User.findOne({ role: 'chatbot' });
            if (!chatbotUser) {
                chatbotUser = new User({
                    name: 'AI Assistant',
                    email: 'chatbot@roselmeat.com',
                    password: 'chatbot_password_123',
                    role: 'chatbot',
                    isVerified: true
                });
                await chatbotUser.save();
                console.log('Created chatbot user');
            }

            const welcomeMessage = new Message({
                messageId: uuidv4(),
                chat: newChat._id,
                sender: chatbotUser._id,
                senderType: 'bot',
                content: "Hello! I'm your AI assistant. How can I help you today?",
                messageType: 'bot_response'
            });

            await welcomeMessage.save();

            // Update chat with last message
            newChat.lastMessage = welcomeMessage._id;
            newChat.lastMessageAt = welcomeMessage.createdAt;
            await newChat.save();
        }

        res.status(201).json({
            success: true,
            message: 'Chat created successfully',
            data: newChat
        });

    } catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get customer's chats
export const getCustomerChats = async (req, res) => {
    try {
        const customerId = req.user._id;
        const { type, status } = req.query;

        const filter = { customer: customerId };
        if (type) filter.type = type;
        if (status) filter.status = status;

        const chats = await Chat.find(filter)
            .populate('admin', 'name email')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 });

        res.status(200).json({
            success: true,
            data: chats
        });

    } catch (error) {
        console.error('Error fetching customer chats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get admin's chats (all support chats)
export const getAdminChats = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = { type: 'support' };
        if (status) filter.status = status;

        const chats = await Chat.find(filter)
            .populate('customer', 'name email')
            .populate('admin', 'name email')
            .populate('lastMessage')
            .sort({ lastMessageAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Chat.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                chats,
                pagination: {
                    current: parseInt(page),
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });

    } catch (error) {
        console.error('Error fetching admin chats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get chat messages
export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        // Find chat and verify access
        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user has access to this chat
        const isCustomer = chat.customer._id.toString() === userId.toString();
        const isAdmin = chat.admin && chat.admin._id.toString() === userId.toString();
        const isAdminUser = req.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Get messages
        const messages = await Message.find({ chat: chat._id })
            .populate('sender', 'name email role')
            .sort({ createdAt: 1 });

        res.status(200).json({
            success: true,
            data: {
                chat,
                messages
            }
        });

    } catch (error) {
        console.error('Error fetching chat messages:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Send a message
export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, messageType = 'text' } = req.body;
        const senderId = req.user._id;

        // Find chat
        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if user can send messages to this chat
        const isCustomer = chat.customer.toString() === senderId.toString();
        const isAdmin = chat.admin && chat.admin.toString() === senderId.toString();
        const isAdminUser = req.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Check if chat is ended - no one can send messages to ended chats
        if (chat.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'This conversation has ended. No new messages can be sent.'
            });
        }

        // Create message
        const message = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: senderId,
            senderType: req.user.role === 'admin' ? 'admin' : 'customer',
            content,
            messageType
        });

        await message.save();

        // Update chat
        chat.lastMessage = message._id;
        chat.lastMessageAt = message.createdAt;
        
        // If customer sends first message in support chat, set status to waiting
        if (chat.type === 'support' && chat.status === 'active' && isCustomer) {
            chat.status = 'waiting';
            
            // Check if this is the first customer message (no previous customer messages)
            const previousCustomerMessages = await Message.find({
                chat: chat._id,
                senderType: 'customer'
            }).countDocuments();
            
            // Only send bot response if this is the first customer message
            if (previousCustomerMessages === 1) {
                setTimeout(async () => {
                    try {
                        // Find or create support bot user
                        let botUser = await User.findOne({ role: 'bot' });
                        if (!botUser) {
                            botUser = new User({
                                name: 'Support Assistant',
                                email: 'support-bot@roselmeat.com',
                                password: 'bot_password_123',
                                role: 'bot',
                                isVerified: true
                            });
                            await botUser.save();
                        }

                        const botResponse = new Message({
                            messageId: uuidv4(),
                            chat: chat._id,
                            sender: botUser._id,
                            senderType: 'bot',
                            content: "Thank you for your message! Please wait patiently while I connect you with one of our support team members. They will be with you shortly.",
                            messageType: 'bot_response'
                        });

                        await botResponse.save();
                        await botResponse.populate('sender', 'name email role');

                        // Update chat with bot response
                        chat.lastMessage = botResponse._id;
                        chat.lastMessageAt = botResponse.createdAt;
                        await chat.save();

                        // Emit bot response to chat
                        socketService.emitToChat(chatId, 'new_message', {
                            message: botResponse,
                            chatId
                        });
                    } catch (error) {
                        console.error('Error sending bot response:', error);
                    }
                }, 1000);
            }
        }
        
        await chat.save();

        // Populate sender info for response
        await message.populate('sender', 'name email role');

        // Emit WebSocket event for real-time updates
        socketService.emitToChat(chatId, 'new_message', {
            message,
            chatId
        });

        // Notify admin room if it's a support chat and customer sent message
        if (chat.type === 'support' && isCustomer) {
            socketService.emitToAdmin('new_support_message', {
                chat,
                message
            });

            // Send notification to admins about new chat message
            try {
                await notificationService.sendNewChatMessageNotification(chat, message);
            } catch (notificationError) {
                console.error('Error sending new chat message notification:', notificationError);
                // Don't fail the message sending if notification fails
            }
        }

        res.status(201).json({
            success: true,
            message: 'Message sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Assign chat to admin
export const assignChatToAdmin = async (req, res) => {
    try {
        const { chatId } = req.params;
        const adminId = req.user._id;

        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (chat.type !== 'support') {
            return res.status(400).json({
                success: false,
                message: 'Only support chats can be assigned to admin'
            });
        }

        chat.admin = adminId;
        chat.status = 'active';
        await chat.save();

        // Create system message
        const systemMessage = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: adminId,
            senderType: 'admin',
            content: `${req.user.name} has joined the conversation`,
            messageType: 'system'
        });

        await systemMessage.save();

        // Emit WebSocket events for real-time updates
        socketService.emitToChat(chatId, 'chat_assigned', {
            chat,
            message: systemMessage
        });

        socketService.emitToUser(chat.customer.toString(), 'admin_joined', {
            chat,
            adminName: req.user.name
        });

        res.status(200).json({
            success: true,
            message: 'Chat assigned successfully',
            data: chat
        });

    } catch (error) {
        console.error('Error assigning chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update chat status
export const updateChatStatus = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { status } = req.body;

        if (!['active', 'waiting', 'resolved', 'closed'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        chat.status = status;
        await chat.save();

        res.status(200).json({
            success: true,
            message: 'Chat status updated successfully',
            data: chat
        });

    } catch (error) {
        console.error('Error updating chat status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// End chat (customer leaves)
export const endChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const customerId = req.user._id;

        // Find chat
        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Check if customer has access to this chat
        if (chat.customer._id.toString() !== customerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update status to ended
        chat.status = 'ended';
        chat.endedAt = new Date();
        chat.updatedAt = new Date();
        await chat.save();

        // Create system message to notify that chat has ended
        const endMessage = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: customerId,
            senderType: 'customer',
            content: 'Customer has ended the conversation',
            messageType: 'system'
        });

        await endMessage.save();

        // Update chat with last message
        chat.lastMessage = endMessage._id;
        chat.lastMessageAt = endMessage.createdAt;
        await chat.save();

        // Notify admin if they're connected
        if (chat.admin) {
            socketService.emitToAdmin('customer_left_chat', {
                chat,
                message: 'Customer has ended the conversation'
            });
        }

        // Emit WebSocket event to chat room
        socketService.emitToChat(chatId, 'chat_ended', {
            chat,
            message: endMessage
        });

        res.status(200).json({
            success: true,
            message: 'Chat ended successfully',
            data: chat
        });

    } catch (error) {
        console.error('Error ending chat:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Get FAQs
export const getFAQs = async (req, res) => {
    try {
        const { category, search } = req.query;

        const filter = { isActive: true };
        if (category) filter.category = category;

        let query = FAQ.find(filter);

        if (search) {
            query = query.or([
                { question: { $regex: search, $options: 'i' } },
                { answer: { $regex: search, $options: 'i' } },
                { keywords: { $in: [new RegExp(search, 'i')] } }
            ]);
        }

        const faqs = await query.sort({ priority: -1, createdAt: -1 });

        res.status(200).json({
            success: true,
            data: faqs
        });

    } catch (error) {
        console.error('Error fetching FAQs:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Create FAQ (admin only)
export const createFAQ = async (req, res) => {
    try {
        const { question, answer, category, keywords = [], priority = 0 } = req.body;

        const faq = new FAQ({
            question,
            answer,
            category,
            keywords,
            priority
        });

        await faq.save();

        res.status(201).json({
            success: true,
            message: 'FAQ created successfully',
            data: faq
        });

    } catch (error) {
        console.error('Error creating FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Update FAQ (admin only)
export const updateFAQ = async (req, res) => {
    try {
        const { faqId } = req.params;
        const updateData = req.body;

        const faq = await FAQ.findByIdAndUpdate(
            faqId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'FAQ updated successfully',
            data: faq
        });

    } catch (error) {
        console.error('Error updating FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Delete FAQ (admin only)
export const deleteFAQ = async (req, res) => {
    try {
        const { faqId } = req.params;

        const faq = await FAQ.findByIdAndDelete(faqId);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'FAQ deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting FAQ:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

// Send FAQ response (bot response)
export const sendFAQResponse = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { faqId } = req.body;

        // Find chat
        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        // Find FAQ
        const faq = await FAQ.findById(faqId);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

        // Find or create bot user
        let botUser = await User.findOne({ role: 'bot' });
        if (!botUser) {
            botUser = new User({
                name: 'FAQ Assistant',
                email: 'bot@roselmeat.com',
                password: 'bot_password_123',
                role: 'bot',
                isVerified: true
            });
            await botUser.save();
        }

        // Create bot message
        const message = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: botUser._id,
            senderType: 'bot',
            content: faq.answer,
            messageType: 'bot_response',
            faqReference: faq._id
        });

        await message.save();
        await message.populate('sender', 'name email role');

        // Update chat
        chat.lastMessage = message._id;
        chat.lastMessageAt = message.createdAt;
        await chat.save();

        // Update FAQ usage stats
        faq.viewCount += 1;
        faq.lastUsed = new Date();
        await faq.save();

        // Emit WebSocket event for real-time updates
        socketService.emitToChat(chatId, 'new_message', {
            message,
            chatId
        });

        res.status(201).json({
            success: true,
            message: 'FAQ response sent successfully',
            data: message
        });

    } catch (error) {
        console.error('Error sending FAQ response:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};
