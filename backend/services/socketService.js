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
            next();
        } catch (error) {
            console.error('❌ Socket authentication error:', error.message);
            next(new Error('Authentication error: Invalid token'));
        }
    }

    handleConnection(socket) {
        this.connectedUsers.set(socket.userId, socket.id);
        this.userSockets.set(socket.id, socket.userId);

        socket.join(`user_${socket.userId}`);

        if (socket.user.role === 'admin') {
            socket.join('admin_room');
        }

        socket.emit('connection_status', { 
            connected: true, 
            userId: socket.userId,
            role: socket.user.role 
        });
        

        socket.on('join_chat', (chatId) => {
            socket.join(`chat_${chatId}`);
        });

        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat_${chatId}`);
        });

        socket.on('send_message', async (data) => {
            try {
                await this.handleNewMessage(socket, data);
            } catch (error) {
                console.error('Error handling new message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

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

        socket.on('assign_chat', async (data) => {
            try {
                await this.handleChatAssignment(socket, data);
            } catch (error) {
                console.error('Error handling chat assignment:', error);
                socket.emit('error', { message: 'Failed to assign chat' });
            }
        });

        socket.on('disconnect', (reason) => {
            this.connectedUsers.delete(socket.userId);
            this.userSockets.delete(socket.id);
        });
    }

    async handleNewMessage(socket, data) {
        const { chatId, content, messageType = 'text' } = data;

        const chat = await Chat.findOne({ chatId }).populate('customer admin');
        if (!chat) {
            socket.emit('error', { message: 'Chat not found' });
            return;
        }

        const isCustomer = chat.customer._id.toString() === socket.userId;
        const isAdmin = chat.admin && chat.admin._id.toString() === socket.userId;
        const isAdminUser = socket.user.role === 'admin';

        if (!isCustomer && !isAdmin && !isAdminUser) {
            socket.emit('error', { message: 'Access denied' });
            return;
        }

        if (chat.status === 'ended') {
            socket.emit('error', { message: 'This conversation has ended. No new messages can be sent.' });
            return;
        }

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
                            messageId: require('uuid').v4(),
                            chat: chat._id,
                            sender: botUser._id,
                            senderType: 'bot',
                            content: "Thank you for your message! Please wait patiently while I connect you with one of our support team members. They will be with you shortly.",
                            messageType: 'bot_response'
                        });

                        await botResponse.save();
                        await botResponse.populate('sender', 'name email role');

                        chat.lastMessage = botResponse._id;
                        chat.lastMessageAt = botResponse.createdAt;
                        await chat.save();

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

        this.io.to(`chat_${chatId}`).emit('new_message', {
            message,
            chatId
        });

        if (chat.type === 'support' && isCustomer) {
            this.io.to('admin_room').emit('new_support_message', {
                chat,
                message
            });
        }

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

        chat.admin = socket.userId;
        chat.status = 'active';
        await chat.save();

        const systemMessage = new Message({
            messageId: require('uuid').v4(),
            chat: chat._id,
            sender: socket.userId,
            senderType: 'admin',
            content: `${socket.user.name} has joined the conversation`,
            messageType: 'system'
        });

        await systemMessage.save();

        this.io.to(`chat_${chatId}`).emit('chat_assigned', {
            chat,
            message: systemMessage
        });

        this.io.to(`user_${chat.customer._id}`).emit('admin_joined', {
            chat,
            adminName: socket.user.name
        });

    }

    isUserOnline(userId) {
        return this.connectedUsers.has(userId);
    }

    getUserSocket(userId) {
        const socketId = this.connectedUsers.get(userId);
        return socketId ? this.io.sockets.sockets.get(socketId) : null;
    }

    emitToUser(userId, event, data) {
        const socketId = this.connectedUsers.get(userId);
        if (socketId) {
            this.io.to(socketId).emit(event, data);
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
