import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/chat";
axios.defaults.withCredentials = true;

export const useChatStore = create((set, get) => ({
    // State
    socket: null,
    isConnected: false,
    chats: [],
    currentChat: null,
    messages: [],
    faqs: [],
    isLoading: false,
    error: null,
    message: null,
    
    // Chat UI state
    isChatOpen: false,
    isMinimized: false,
    chatType: null, // 'chatbot' or 'support'
    isTyping: false,
    typingUsers: [],
    
    // Actions
    initializeSocket: (token) => {
        console.log('Initializing socket with token:', token ? 'Token present' : 'No token');
        
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            console.log('✅ Connected to chat server with socket ID:', socket.id);
            set({ isConnected: true });
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from chat server. Reason:', reason);
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Socket connection error:', error);
            set({ isConnected: false, error: error.message });
        });

        socket.on('connection_status', (data) => {
            console.log('📡 Connection status update:', data);
            set({ isConnected: data.connected });
        });

        socket.on('new_message', (data) => {
            const { messages, currentChat } = get();
            // Only add message if it's for the current chat
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

        socket.on('error', (error) => {
            set({ error: error.message });
        });

        set({ socket });
        console.log('💾 Socket stored in state:', socket.id);
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            console.log('🔌 Disconnecting socket:', socket.id);
            socket.disconnect();
            set({ socket: null, isConnected: false });
        } else {
            console.log('⚠️ No socket to disconnect');
        }
    },

    // Chat management
    createChat: async (type, customerDetails = {}) => {
        set({ isLoading: true, error: null });
        try {
            // For chatbot, we don't need to create a server-side chat
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
            
            // Join chat room for real-time updates
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
            
            // Don't add to local state here - let WebSocket handle it
            // This prevents duplication when the new_message event fires
            
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
            
            // Don't add to local state here - let WebSocket handle it
            // This prevents duplication when the new_message event fires
            
            return botMessage;
        } catch (error) {
            set({ 
                error: error.response?.data?.message || 'Failed to send FAQ response'
            });
            throw error;
        }
    },

    // FAQ management
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

    // Admin functions
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

    // UI state management
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
        
        // Leave chat room if in one
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

    // Typing indicators
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

    // Utility functions
    clearError: () => {
        set({ error: null });
    },

    clearMessage: () => {
        set({ message: null });
    },

    // Get chat by ID
    getChatById: (chatId) => {
        const { chats } = get();
        return chats.find(chat => chat.chatId === chatId);
    },

    // Get unread message count
    getUnreadCount: () => {
        const { chats } = get();
        return chats.filter(chat => 
            chat.status !== 'ended' && // Exclude ended chats
            (chat.status === 'waiting' || 
            (chat.lastMessage && !chat.lastMessage.isRead))
        ).length;
    },

    // Get pending chats count (waiting status)
    getPendingChatsCount: () => {
        const { chats } = get();
        return chats.filter(chat => chat.status === 'waiting').length;
    },
    
    // Fetch pending chats count only
    fetchPendingChatsCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/chats?status=waiting&limit=1`);
            const count = response.data.data.pagination?.totalChats || response.data.data.pagination?.total || 0;
            return count;
        } catch (error) {
            console.error('Error fetching pending chats count:', error);
            // Fallback: try to get count from existing chats
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
