import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/chat";
axios.defaults.withCredentials = true;

export const useChatStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    chats: [],
    currentChat: null,
    messages: [],
    faqs: [],
    isLoading: false,
    error: null,
    message: null,
    
    isChatOpen: false,
    isMinimized: false,
    chatType: null, // 'chatbot' or 'support'
    isTyping: false,
    typingUsers: [],
    
    initializeSocket: () => {
        
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            withCredentials: true  // Use HTTP-only cookies for authentication
        });

        socket.on('connect', () => {
            set({ isConnected: true });
        });

        socket.on('disconnect', (reason) => {
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            set({ isConnected: false, error: error.message });
        });

        socket.on('connection_status', (data) => {
            set({ isConnected: data.connected });
        });

        socket.on('new_message', (data) => {
            const { messages, currentChat } = get();
            if (currentChat && data.chatId === currentChat.chatId) {
                set({ 
                    messages: [...messages, data.message]
                });
            }
        });

        socket.on('user_typing', (data) => {
            const { typingUsers } = get();
            const existingUser = typingUsers.find(u => u.userId === data.userId);
            if (!existingUser) {
                set({ typingUsers: [...typingUsers, data] });
            }
        });

        socket.on('user_stopped_typing', (data) => {
            const { typingUsers } = get();
            set({ 
                typingUsers: typingUsers.filter(u => u.userId !== data.userId)
            });
        });

        socket.on('chat_assigned', (data) => {
            const { chats } = get();
            const updatedChats = chats.map(chat => 
                chat._id === data.chat._id ? data.chat : chat
            );
            set({ chats: updatedChats, currentChat: data.chat });
        });

        socket.on('admin_joined', (data) => {
            const { currentChat } = get();
            if (currentChat && currentChat.chatId === data.chat.chatId) {
                set({ 
                    currentChat: data.chat,
                    message: `${data.adminName} has joined the conversation` 
                });
            }
        });

        socket.on('chat_status_updated', (data) => {
            const { chats, currentChat } = get();
            const updatedChats = chats.map(chat => 
                chat.chatId === data.chatId ? data.chat : chat
            );
            
            let updatedCurrentChat = currentChat;
            if (currentChat && currentChat.chatId === data.chatId) {
                updatedCurrentChat = data.chat;
            }
            
            set({ 
                chats: updatedChats,
                currentChat: updatedCurrentChat
            });
        });

        socket.on('error', (error) => {
            set({ error: error.message });
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    createChat: async (type, customerDetails = {}) => {
        set({ isLoading: true, error: null });
        try {
            if (type === 'chatbot') {
                const mockChat = {
                    _id: `chatbot_${Date.now()}`,
                    chatId: `chatbot_${Date.now()}`,
                    type: 'chatbot',
                    status: 'active',
                    customer: null, // Chatbot doesn't need customer reference
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                
                set({ 
                    currentChat: mockChat,
                    chatType: type,
                    isLoading: false
                });
                
                return mockChat;
            }
            
            const response = await axios.post(`${API_URL}/create`, {
                type,
                customerDetails
            });
            
            const newChat = response.data.data;
            const { chats } = get();
            
            set({ 
                chats: [newChat, ...chats],
                currentChat: newChat,
                chatType: type,
                isLoading: false
            });
            
            return newChat;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to create chat',
                isLoading: false 
            });
            throw error;
        }
    },

    getCustomerChats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/customer`);
            set({ 
                chats: response.data.data,
                isLoading: false 
            });
            return response.data.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch chats',
                isLoading: false 
            });
            throw error;
        }
    },

    endChat: async (chatId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.put(`${API_URL}/${chatId}/end`);
            set({ isLoading: false });
            return response.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to end chat',
                isLoading: false 
            });
            throw error;
        }
    },

    getChatMessages: async (chatId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${chatId}/messages`);
            const { chat, messages } = response.data.data;
            
            set({ 
                currentChat: chat,
                messages: messages,
                isLoading: false 
            });
            
            const { socket } = get();
            if (socket) {
                socket.emit('join_chat', chatId);
            }
            
            return { chat, messages };
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch messages',
                isLoading: false 
            });
            throw error;
        }
    },

    sendMessage: async (chatId, content, messageType = 'text') => {
        try {
            const response = await axios.post(`${API_URL}/${chatId}/messages`, {
                content,
                messageType
            });
            
            const newMessage = response.data.data;
            
            return newMessage;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to send message'
            });
            throw error;
        }
    },

    sendFAQResponse: async (chatId, faqId) => {
        try {
            const response = await axios.post(`${API_URL}/${chatId}/faq-response`, {
                faqId
            });
            
            const botMessage = response.data.data;
            
            return botMessage;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to send FAQ response'
            });
            throw error;
        }
    },

    getFAQs: async (category = null, search = null) => {
        set({ isLoading: true, error: null });
        try {
            const params = {};
            if (category) params.category = category;
            if (search) params.search = search;
            
            const response = await axios.get(`${API_URL}/faqs`, { params });
            set({ 
                faqs: response.data.data,
                isLoading: false 
            });
            return response.data.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch FAQs',
                isLoading: false 
            });
            throw error;
        }
    },

    getAdminChats: async (status = null, page = 1, limit = 20) => {
        set({ isLoading: true, error: null });
        try {
            const params = { page, limit };
            if (status) params.status = status;
            
            const response = await axios.get(`${API_URL}/admin/chats`, { params });
            set({ 
                chats: response.data.data.chats,
                isLoading: false 
            });
            return response.data.data;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to fetch admin chats',
                isLoading: false 
            });
            throw error;
        }
    },

    assignChatToAdmin: async (chatId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/${chatId}/assign`);
            const updatedChat = response.data.data;
            
            const { chats } = get();
            const updatedChats = chats.map(chat => 
                chat._id === updatedChat._id ? updatedChat : chat
            );
            
            set({ 
                chats: updatedChats,
                currentChat: updatedChat,
                isLoading: false 
            });
            
            return updatedChat;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to assign chat',
                isLoading: false 
            });
            throw error;
        }
    },

    updateChatStatus: async (chatId, status) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/${chatId}/status`, { status });
            const updatedChat = response.data.data;
            
            const { chats } = get();
            const updatedChats = chats.map(chat => 
                chat._id === updatedChat._id ? updatedChat : chat
            );
            
            set({ 
                chats: updatedChats,
                currentChat: updatedChat,
                isLoading: false 
            });
            
            return updatedChat;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to update chat status',
                isLoading: false 
            });
            throw error;
        }
    },

    openChat: (type) => {
        set({ 
            isChatOpen: true, 
            chatType: type,
            error: null,
            message: null
        });
    },

    closeChat: () => {
        const { socket, currentChat } = get();
        
        if (socket && currentChat) {
            socket.emit('leave_chat', currentChat.chatId);
        }
        
        set({ 
            isChatOpen: false,
            isMinimized: false,
            chatType: null,
            currentChat: null,
            messages: [],
            typingUsers: [],
            error: null,
            message: null
        });
    },

    minimizeChat: () => {
        set({ isMinimized: true });
    },

    restoreChat: () => {
        set({ isMinimized: false });
    },

    setCurrentChat: (chat) => {
        set({ currentChat: chat });
    },

    clearMessages: () => {
        set({ messages: [] });
    },

    startTyping: (chatId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('typing_start', { chatId });
        }
    },

    stopTyping: (chatId) => {
        const { socket } = get();
        if (socket) {
            socket.emit('typing_stop', { chatId });
        }
    },

    clearError: () => {
        set({ error: null });
    },

    clearMessage: () => {
        set({ message: null });
    },

    getChatById: (chatId) => {
        const { chats } = get();
        return chats.find(chat => chat.chatId === chatId);
    },

    getUnreadCount: () => {
        const { chats } = get();
        return chats.filter(chat => 
            chat.status !== 'ended' &&
            (chat.status === 'waiting' || 
            (chat.lastMessage && !chat.lastMessage.isRead))
        ).length;
    },

    getPendingChatsCount: () => {
        const { chats } = get();
        return chats.filter(chat => chat.status === 'waiting').length;
    },
    
    fetchPendingChatsCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/chats?status=waiting&limit=1`);
            const count = response.data.data.pagination?.totalChats || response.data.data.pagination?.total || 0;
            return count;
        } catch (error) {
            console.error('Error fetching pending chats count:', error);
            try {
                const fallbackResponse = await axios.get(`${API_URL}/admin/chats`);
                const count = fallbackResponse.data.data.chats?.filter(chat => 
                    chat.status === 'waiting'
                ).length || 0;
                return count;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return 0;
            }
        }
    }
}));
