import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';
import { FAQ } from '../models/faq.model.js';
import { User } from '../models/user.model.js';
import { v4 as uuidv4 } from 'uuid';
import { socketService } from '../services/socketService.js';
import { notificationService } from '../services/notificationService.js';

export const createChat = async (req, res) => {
    try {
        const { type, customerDetails } = req.body;
        const customerId = req.user._id;

        if (!['faq', 'support', 'chatbot'].includes(type)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid chat type. Must be "faq", "support", or "chatbot"'
            });
        }

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

        const chatId = uuidv4();
        const newChat = new Chat({
            chatId,
            customer: customerId,
            type,
            customerDetails: customerDetails || {}
        });

        await newChat.save();

        if (type === 'support') {
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

            newChat.lastMessage = welcomeMessage._id;
            newChat.lastMessageAt = welcomeMessage.createdAt;
            await newChat.save();
        }

        if (type === 'chatbot') {
            let chatbotUser = await User.findOne({ role: 'chatbot' });
            if (!chatbotUser) {
                chatbotUser = new User({
                    name: 'Chat Assistant',
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
                content: "Hello! I'm your Chat assistant. How can I help you today?",
                messageType: 'bot_response'
            });

            await welcomeMessage.save();

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

export const getChatMessages = async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user._id;

        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isCustomer = chat.customer._id.toString() === userId.toString();
        const isAdmin = chat.admin && chat.admin._id.toString() === userId.toString();
        const isAdminUser = req.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

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

export const sendMessage = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { content, messageType = 'text' } = req.body;
        const senderId = req.user._id;

        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const isCustomer = chat.customer.toString() === senderId.toString();
        const isAdmin = chat.admin && chat.admin.toString() === senderId.toString();
        const isAdminUser = req.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        if (chat.status === 'ended') {
            return res.status(400).json({
                success: false,
                message: 'This conversation has ended. No new messages can be sent.'
            });
        }

        const message = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: senderId,
            senderType: req.user.role === 'admin' ? 'admin' : 'customer',
            content,
            messageType
        });

        await message.save();

        chat.lastMessage = message._id;
        chat.lastMessageAt = message.createdAt;
        
        if (chat.type === 'support' && chat.status === 'active' && isCustomer) {
            chat.status = 'waiting';
            
            const previousCustomerMessages = await Message.find({
                chat: chat._id,
                senderType: 'customer'
            }).countDocuments();
            
            if (previousCustomerMessages === 1) {
                setTimeout(async () => {
                    try {
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

                        // with bot response
                        chat.lastMessage = botResponse._id;
                        chat.lastMessageAt = botResponse.createdAt;
                        await chat.save();

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

        await message.populate('sender', 'name email role');

        socketService.emitToChat(chatId, 'new_message', {
            message,
            chatId
        });

        if (chat.type === 'support' && isCustomer) {
            socketService.emitToAdmin('new_support_message', {
                chat,
                message
            });

            try {
                await notificationService.sendNewChatMessageNotification(chat, message);
            } catch (notificationError) {
                console.error('Error sending new chat message notification:', notificationError);
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

        const systemMessage = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: adminId,
            senderType: 'admin',
            content: `${req.user.name} has joined the conversation`,
            messageType: 'system'
        });

        await systemMessage.save();

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

export const endChat = async (req, res) => {
    try {
        const { chatId } = req.params;
        const customerId = req.user._id;

        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        if (chat.customer._id.toString() !== customerId.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        chat.status = 'ended';
        chat.endedAt = new Date();
        chat.updatedAt = new Date();
        await chat.save();

        // to notify that chat has ended
        const endMessage = new Message({
            messageId: uuidv4(),
            chat: chat._id,
            sender: customerId,
            senderType: 'customer',
            content: 'Customer has ended the conversation',
            messageType: 'system'
        });

        await endMessage.save();

        // with last message
        chat.lastMessage = endMessage._id;
        chat.lastMessageAt = endMessage.createdAt;
        await chat.save();

        if (chat.admin) {
            socketService.emitToAdmin('customer_left_chat', {
                chat,
                message: 'Customer has ended the conversation'
            });
        }

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

export const sendFAQResponse = async (req, res) => {
    try {
        const { chatId } = req.params;
        const { faqId } = req.body;

        const chat = await Chat.findOne({ chatId });
        if (!chat) {
            return res.status(404).json({
                success: false,
                message: 'Chat not found'
            });
        }

        const faq = await FAQ.findById(faqId);
        if (!faq) {
            return res.status(404).json({
                success: false,
                message: 'FAQ not found'
            });
        }

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

        chat.lastMessage = message._id;
        chat.lastMessageAt = message.createdAt;
        await chat.save();

        faq.viewCount += 1;
        faq.lastUsed = new Date();
        await faq.save();

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
