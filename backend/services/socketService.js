import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import { Chat } from '../models/chat.model.js';
import { Message } from '../models/message.model.js';

class SocketService {
    constructor() {
        this.io = null;
        this.connectedUsers = new Map(); // userId -> socketId
        this.userSockets = new Map(); // socketId -> userId
    }

    initialize(server) {
        this.io = new Server(server, {
            cors: {
                origin: "http://localhost:5173",
                credentials: true
            }
        });

        this.io.use(this.authenticateSocket.bind(this));
        this.io.on('connection', this.handleConnection.bind(this));
    }

    async authenticateSocket(socket, next) {
        try {
            const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
            
            console.log('🔐 Socket authentication attempt:', {
                hasToken: !!token,
                socketId: socket.id,
                authToken: socket.handshake.auth.token ? 'Present' : 'Missing'
            });
            
            if (!token) {
                console.error('❌ No token provided for socket authentication');
                return next(new Error('Authentication error: No token provided'));
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId);
            
            if (!user) {
                console.error('❌ User not found for socket authentication:', decoded.userId);
                return next(new Error('Authentication error: User not found'));
            }

            socket.userId = user._id.toString();
            socket.user = user;
            console.log('✅ Socket authenticated successfully for user:', user.name, 'Role:', user.role);
            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    }

    handleConnection(socket) {
        console.log(`✅ User ${socket.user.name} (${socket.user.role}) connected with socket ${socket.id}`);
        
        // Store user connection
        this.connectedUsers.set(socket.userId, socket.id);
        this.userSockets.set(socket.id, socket.userId);

        // Join user to their personal room
        socket.join(`user_${socket.userId}`);
        console.log(`📡 User ${socket.user.name} joined personal room: user_${socket.userId}`);

        // Join admin to admin room if they're an admin
        if (socket.user.role === 'admin') {
            socket.join('admin_room');
            console.log(`👑 Admin ${socket.user.name} joined admin room`);
        }

        // Emit connection status to user
        socket.emit('connection_status', { 
            connected: true, 
            userId: socket.userId,
            role: socket.user.role 
        });
        

        // Handle joining chat rooms
        socket.on('join_chat', (chatId) => {
            socket.join(`chat_${chatId}`);
        });

        // Handle leaving chat rooms
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat_${chatId}`);
            console.log(`User ${socket.user.name} left chat ${chatId}`);
        });

        // Handle new messages
        socket.on('send_message', async (data) => {
            try {
                await this.handleNewMessage(socket, data);
            } catch (error) {
                console.error('Error handling new message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicators
        socket.on('typing_start', (data) => {
            socket.to(`chat_${data.chatId}`).emit('user_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                chatId: data.chatId
            });
        });

        socket.on('typing_stop', (data) => {
            socket.to(`chat_${data.chatId}`).emit('user_stopped_typing', {
                userId: socket.userId,
                userName: socket.user.name,
                chatId: data.chatId
            });
        });

        // Handle chat assignment
        socket.on('assign_chat', async (data) => {
            try {
                await this.handleChatAssignment(socket, data);
            } catch (error) {
                console.error('Error handling chat assignment:', error);
                socket.emit('error', { message: 'Failed to assign chat' });
            }
        });

        // Handle disconnect
        socket.on('disconnect', (reason) => {
            console.log(`❌ User ${socket.user.name} disconnected. Reason: ${reason}`);
            this.connectedUsers.delete(socket.userId);
            this.userSockets.delete(socket.id);
            
            console.log(`🗑️ Removed user ${socket.user.name} from connected users`);
        });
    }

    async handleNewMessage(socket, data) {
        const { chatId, content, messageType = 'text' } = data;

        // Verify chat access
        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            socket.emit('error', { message: 'Chat not found' });
            return;
        }

        // Check if user has access to this chat
        const isCustomer = chat.customer._id.toString() === socket.userId;
        const isAdmin = chat.admin && chat.admin._id.toString() === socket.userId;
        const isAdminUser = socket.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            socket.emit('error', { message: 'Access denied' });
            return;
        }

        // Check if chat is ended - no one can send messages to ended chats
        if (chat.status === 'ended') {
            socket.emit('error', { message: 'This conversation has ended. No new messages can be sent.' });
            return;
        }

        // Create message
        const message = new Message({
            messageId: require('uuid').v4(),
            chat: chat._id,
            sender: socket.userId,
            senderType: socket.user.role === 'admin' ? 'admin' : 'customer',
            content,
            messageType
        });

        await message.save();
        await message.populate('sender', 'name email role');

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
                            messageId: require('uuid').v4(),
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
                        this.io.to(`chat_${chatId}`).emit('new_message', {
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

        // Emit message to all users in the chat room
        this.io.to(`chat_${chatId}`).emit('new_message', {
            message,
            chatId
        });

        // Notify admin room if it's a support chat and customer sent message
        if (chat.type === 'support' && isCustomer) {
            this.io.to('admin_room').emit('new_support_message', {
                chat,
                message
            });
        }

        // Notify customer if admin sent message
        if (isAdminUser && chat.customer._id.toString() !== socket.userId) {
            this.io.to(`user_${chat.customer._id}`).emit('new_message', {
                message,
                chatId
            });
        }
    }

    async handleChatAssignment(socket, data) {
        const { chatId } = data;

        if (socket.user.role !== 'admin') {
            socket.emit('error', { message: 'Only admins can assign chats' });
            return;
        }

        const chat = await Chat.findOne({ chatId }).populate('customer');
        if (!chat) {
            socket.emit('error', { message: 'Chat not found' });
            return;
        }

        if (chat.type !== 'support') {
            socket.emit('error', { message: 'Only support chats can be assigned' });
            return;
        }

        // Assign chat to admin
        chat.admin = socket.userId;
        chat.status = 'active';
        await chat.save();

        // Create system message
        const systemMessage = new Message({
            messageId: require('uuid').v4(),
            chat: chat._id,
            sender: socket.userId,
            senderType: 'admin',
            content: `${socket.user.name} has joined the conversation`,
            messageType: 'system'
        });

        await systemMessage.save();

        // Notify all users in the chat
        this.io.to(`chat_${chatId}`).emit('chat_assigned', {
            chat,
            message: systemMessage
        });

        // Notify customer
        this.io.to(`user_${chat.customer._id}`).emit('admin_joined', {
            chat,
            adminName: socket.user.name
        });

        console.log(`Chat ${chatId} assigned to admin ${socket.user.name}`);
        console.log(`Notified customer ${chat.customer._id} and chat room ${chatId}`);
    }

    // Utility methods
    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    getUserSocket(userId) {
        const socketId = this.connectedUsers.get(userId);
        return socketId ? this.io.sockets.sockets.get(socketId) : null;
    }

    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        console.log(`📡 Emitting to user ${userId}:`, { event, socketId, connected: !!socketId });
        if (socketId) {
            this.io.to(socketId).emit(event, data);
            console.log(`✅ Emitted ${event} to socket ${socketId}`);
        } else {
            console.log(`❌ User ${userId} not connected to WebSocket`);
        }
    }

    emitToAdmin(event, data) {
        this.io.to('admin_room').emit(event, data);
    }

    emitToChat(chatId, event, data) {
        this.io.to(`chat_${chatId}`).emit(event, data);
    }
}

export const socketService = new SocketService();
