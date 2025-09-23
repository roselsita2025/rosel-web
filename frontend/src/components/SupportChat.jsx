import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, ArrowLeft, Phone, User as UserIcon, AlertCircle, MessageCircle } from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';

const SupportChat = () => {
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isWaitingForAdmin, setIsWaitingForAdmin] = useState(false);
    const [adminConnected, setAdminConnected] = useState(false);
    const [showEndChatDialog, setShowEndChatDialog] = useState(false);
    const messagesEndRef = useRef(null);
    const typingTimeoutRef = useRef(null);
    const chatInitialized = useRef(false);

    const { 
        currentChat, 
        messages, 
        isLoading, 
        error, 
        createChat, 
        getChatMessages,
        sendMessage,
        startTyping,
        stopTyping,
        typingUsers,
        openChat,
        endChat,
        isConnected,
        socket
    } = useChatStore();
    
    const { user } = useAuthStore();

    useEffect(() => {
        // Initialize support chat if none exists
        if (!currentChat || currentChat.type !== 'support') {
            if (!chatInitialized.current) {
                initializeSupportChat();
                chatInitialized.current = true;
            }
        } else {
            // Load existing chat messages
            getChatMessages(currentChat.chatId);
            // Join the chat room for real-time updates
            if (socket) {
                socket.emit('join_chat', currentChat.chatId);
            }
        }
    }, [currentChat?.chatId]); // Only depend on chatId to prevent infinite loop

    // Separate effect for admin status updates
    useEffect(() => {
        if (currentChat && currentChat.type === 'support') {
            // Check if admin is connected
            if (currentChat.admin) {
                setAdminConnected(true);
                setIsWaitingForAdmin(false);
            } else {
                setAdminConnected(false);
                setIsWaitingForAdmin(true);
            }
        }
    }, [currentChat?.admin]);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Listen for admin connection events
        if (socket) {
            socket.on('admin_joined', (data) => {
                setAdminConnected(true);
                setIsWaitingForAdmin(false);
            });

            return () => {
                socket.off('admin_joined');
            };
        }
    }, [socket]);

    const initializeSupportChat = async () => {
        try {
            const chat = await createChat('support');
            
            // Join the chat room after creating it
            if (socket && chat) {
                socket.emit('join_chat', chat.chatId);
            }
            
            // Set initial state
            setIsWaitingForAdmin(true);
            setAdminConnected(false);
        } catch (error) {
            console.error('Error creating support chat:', error);
        }
    };


    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!message.trim() || !currentChat) return;

        try {
            await sendMessage(currentChat.chatId, message, 'text');
            setMessage('');
            stopTyping(currentChat.chatId);
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleTyping = (e) => {
        setMessage(e.target.value);
        
        if (!isTyping && currentChat) {
            setIsTyping(true);
            startTyping(currentChat.chatId);
        }

        // Clear existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set new timeout to stop typing
        typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
            if (currentChat) {
                stopTyping(currentChat.chatId);
            }
        }, 1000);
    };

    const handleBackToSelection = () => {
        if (currentChat && currentChat.type === 'support') {
            setShowEndChatDialog(true);
        } else {
            openChat('selection');
        }
    };

    const handleEndChat = async () => {
        try {
            if (currentChat) {
                // End the conversation
                await endChat(currentChat.chatId);
            }
            setShowEndChatDialog(false);
            openChat('selection');
        } catch (error) {
            console.error('Error ending chat:', error);
        }
    };

    const handleCancelEndChat = () => {
        setShowEndChatDialog(false);
    };

    const getTypingIndicator = () => {
        const otherTypingUsers = typingUsers.filter(u => u.userId !== user?._id);
        if (otherTypingUsers.length === 0) return null;

        return (
            <div className="flex items-center space-x-2 text-sm text-[#030105] opacity-70 px-4 py-2">
                <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
                <span>
                    {otherTypingUsers.length === 1 
                        ? `${otherTypingUsers[0].userName} is typing...`
                        : `${otherTypingUsers.length} people are typing...`
                    }
                </span>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-[#f7e9b8] bg-[#f7e9b8]">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <button
                            onClick={handleBackToSelection}
                            className="w-8 h-8 bg-[#860809] hover:bg-[#a31f17] 
                                     rounded-full flex items-center justify-center
                                     transition-colors duration-200"
                        >
                            <ArrowLeft className="w-4 h-4 text-[#fffefc]" />
                        </button>
                        <div>
                            <h3 className="font-bold text-[#030105]">Customer Support</h3>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <p className="text-sm text-[#030105] opacity-70">
                                    {isConnected ? 'Connected' : 'Connecting...'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {isWaitingForAdmin && !adminConnected && (
                        <div className="flex items-center space-x-2 bg-[#a31f17] text-[#fffefc] px-3 py-1 rounded-full">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Connecting to admin...</span>
                        </div>
                    )}
                    {adminConnected && (
                        <div className="flex items-center space-x-2 bg-green-600 text-[#fffefc] px-3 py-1 rounded-full">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Admin connected</span>
                        </div>
                    )}
                </div>
            </div>


            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: '400px' }}>
                {isLoading && messages.length === 0 ? (
                    <div className="flex justify-center items-center py-8">
                        <div className="w-6 h-6 border-2 border-[#901414] border-t-transparent 
                                     rounded-full animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-8">
                        <p className="text-[#860809] font-medium">Error loading chat</p>
                        <p className="text-sm text-[#030105] opacity-70 mt-1">{error}</p>
                    </div>
                ) : (
                    <>
                        <AnimatePresence>
                            {messages.map((message, index) => {
                                // Handle system messages differently
                                if (message.messageType === 'system') {
                                    return (
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.1 }}
                                            className="flex justify-center"
                                        >
                                            <div className="bg-[#f7e9b8] text-[#030105] px-4 py-2 rounded-full text-sm opacity-80 max-w-[80%] text-center">
                                                <p className="text-xs">{message.content}</p>
                                            </div>
                                        </motion.div>
                                    );
                                }

                                // Regular messages
                                return (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`flex items-start space-x-2 max-w-[80%] ${message.senderType === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                message.senderType === 'customer' 
                                                    ? 'bg-[#860809]' 
                                                    : message.senderType === 'admin'
                                                    ? 'bg-[#a31f17]'
                                                    : 'bg-[#f7e9b8]'
                                            }`}>
                                                {message.senderType === 'customer' ? (
                                                    <User className="w-4 h-4 text-[#fffefc]" />
                                                ) : message.senderType === 'admin' ? (
                                                    <UserIcon className="w-4 h-4 text-[#fffefc]" />
                                                ) : (
                                                    <Bot className="w-4 h-4 text-[#030105]" />
                                                )}
                                            </div>
                                            <div className={`px-4 py-2 rounded-lg ${
                                                message.senderType === 'customer'
                                                    ? 'bg-[#860809] text-[#fffefc]'
                                                    : message.senderType === 'admin'
                                                    ? 'bg-[#a31f17] text-[#fffefc]'
                                                    : 'bg-[#f7e9b8] text-[#030105]'
                                            }`}>
                                                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                                                <p className={`text-xs mt-1 ${
                                                    message.senderType === 'customer' 
                                                        ? 'text-[#fffefc] opacity-70' 
                                                        : 'text-[#030105] opacity-70'
                                                }`}>
                                                    {new Date(message.createdAt).toLocaleTimeString([], { 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    })}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                        
                        {/* Typing Indicator */}
                        {getTypingIndicator()}
                        
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-[#f7e9b8] bg-[#fffefc]">
                {currentChat?.status === 'ended' ? (
                    <div className="flex items-center justify-center py-4">
                        <div className="text-center">
                            <p className="text-[#030105] opacity-70 text-sm">
                                This conversation has ended. No new messages can be sent.
                            </p>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex space-x-2">
                        <input
                            type="text"
                            value={message}
                            onChange={handleTyping}
                            placeholder={messages.length === 0 ? "Type your message to get started..." : "Type your message..."}
                            className="flex-1 px-3 py-2 border border-[#f7e9b8] rounded-lg 
                                     focus:ring-2 focus:ring-[#860809] focus:border-transparent 
                                     bg-[#fffefc] text-[#030105]"
                            disabled={!isConnected}
                        />
                        <button
                            type="submit"
                            disabled={!message.trim() || !isConnected}
                            className="w-10 h-10 bg-[#860809] hover:bg-[#a31f17] 
                                     disabled:opacity-50 disabled:cursor-not-allowed
                                     text-[#fffefc] rounded-lg flex items-center justify-center
                                     transition-colors duration-200"
                        >
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>

            {/* End Chat Confirmation Dialog */}
            <AnimatePresence>
                {showEndChatDialog && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[#fffefc] rounded-lg p-6 max-w-md w-full mx-4"
                        >
                            <div className="text-center">
                                <div className="w-16 h-16 bg-[#a31f17] rounded-full flex items-center justify-center mx-auto mb-4">
                                    <AlertCircle className="w-8 h-8 text-[#fffefc]" />
                                </div>
                                <h3 className="text-xl font-bold text-[#030105] mb-2">
                                    End Conversation?
                                </h3>
                                <p className="text-[#030105] opacity-70 mb-6">
                                    If you leave now, this conversation will end. You'll need to start a new chat if you want to contact support again.
                                </p>
                                <div className="flex space-x-3">
                                    <button
                                        onClick={handleCancelEndChat}
                                        className="flex-1 px-4 py-2 border border-[#f7e9b8] text-[#030105] 
                                                 rounded-lg hover:bg-[#f7e9b8] transition-colors duration-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleEndChat}
                                        className="flex-1 px-4 py-2 bg-[#a31f17] text-[#fffefc] 
                                                 rounded-lg hover:bg-[#860809] transition-colors duration-200"
                                    >
                                        End Chat
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupportChat;
