import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, HeadphonesIcon, Minimize2, Maximize2 } from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';
import Chatbot from './Chatbot.jsx';
import SupportChat from './SupportChat.jsx';

const ChatModal = () => {
    const { 
        isChatOpen, 
        isMinimized,
        chatType, 
        closeChat, 
        minimizeChat,
        restoreChat,
        openChat,
        getCustomerChats
    } = useChatStore();
    const { user, isAuthenticated } = useAuthStore();

    // Socket connection is now handled globally in App.jsx

    useEffect(() => {
        if (isAuthenticated && isChatOpen) {
            // Load customer chats when chat opens
            getCustomerChats();
        }
    }, [isAuthenticated, isChatOpen, getCustomerChats]);

    const handleOptionSelect = (type) => {
        openChat(type);
    };

    const renderChatContent = () => {
        switch (chatType) {
            case 'chatbot':
                return <Chatbot />;
            case 'support':
                return <SupportChat />;
            case 'selection':
            default:
                return (
                    <div className="p-6">
                        <div className="text-center mb-6">
                            <h3 className="text-xl font-bold text-[#030105] mb-2">
                                How can we help you?
                            </h3>
                            <p className="text-[#030105] opacity-70">
                                Choose an option below to get started
                            </p>
                        </div>

                        <div className="space-y-4">
                            {/* Chatbot Option */}
                            <motion.button
                                onClick={() => handleOptionSelect('chatbot')}
                                className="w-full p-4 bg-[#f7e9b8] hover:bg-[#f0d896] 
                                         rounded-lg border border-[#f7e9b8] 
                                         transition-all duration-200 
                                         flex items-center space-x-4 group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-12 h-12 bg-[#860809] rounded-full 
                                             flex items-center justify-center
                                             group-hover:bg-[#a31f17] transition-colors">
                                    <MessageCircle className="w-6 h-6 text-[#fffefc]" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-semibold text-[#030105] mb-1">
                                        AI Assistant
                                    </h4>
                                    <p className="text-sm text-[#030105] opacity-70">
                                        Get help with products, orders, and more
                                    </p>
                                </div>
                            </motion.button>

                            {/* Support Option */}
                            <motion.button
                                onClick={() => handleOptionSelect('support')}
                                className="w-full p-4 bg-[#f7e9b8] hover:bg-[#f0d896] 
                                         rounded-lg border border-[#f7e9b8] 
                                         transition-all duration-200 
                                         flex items-center space-x-4 group"
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                            >
                                <div className="w-12 h-12 bg-[#860809] rounded-full 
                                             flex items-center justify-center
                                             group-hover:bg-[#a31f17] transition-colors">
                                    <HeadphonesIcon className="w-6 h-6 text-[#fffefc]" />
                                </div>
                                <div className="text-left flex-1">
                                    <h4 className="font-semibold text-[#030105] mb-1">
                                        Customer Support
                                    </h4>
                                    <p className="text-sm text-[#030105] opacity-70">
                                        Chat with our support team for personalized help
                                    </p>
                                </div>
                            </motion.button>
                        </div>

                        <div className="mt-6 p-4 bg-[#fffefc] rounded-lg border border-[#f7e9b8]">
                            <p className="text-sm text-[#030105] opacity-70 text-center">
                                💡 <strong>Tip:</strong> Try our AI Assistant first for quick help, 
                                or contact support for personalized assistance.
                            </p>
                        </div>
                    </div>
                );
        }
    };

    if (!isChatOpen) return null;

    // Minimized state
    if (isMinimized) {
        return (
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="fixed bottom-6 right-6 z-50"
            >
                <div className="bg-[#860809] text-[#fffefc] rounded-lg shadow-lg p-4 min-w-[300px]">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                            <MessageCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                {chatType === 'chatbot' ? 'AI Assistant' : 
                                 chatType === 'support' ? 'Support Chat' : 
                                 'Customer Support'}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={restoreChat}
                                className="w-6 h-6 hover:bg-[#a31f17] rounded flex items-center justify-center transition-colors"
                            >
                                <Maximize2 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={closeChat}
                                className="w-6 h-6 hover:bg-[#a31f17] rounded flex items-center justify-center transition-colors"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs opacity-80">
                        Chat is minimized. Click to restore.
                    </p>
                </div>
            </motion.div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black bg-opacity-50 z-50 
                         flex items-center justify-center p-4"
                onClick={(e) => {
                    if (e.target === e.currentTarget) {
                        closeChat();
                    }
                }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-[#fffefc] rounded-2xl shadow-2xl 
                             w-full max-w-md max-h-[90vh] overflow-hidden
                             border border-[#f7e9b8]"
                >
                    {/* Header */}
                    <div className="bg-[#860809] text-[#fffefc] p-4 
                                 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-[#fffefc] bg-opacity-20 
                                         rounded-full flex items-center justify-center">
                                <MessageCircle className="w-4 h-4" />
                            </div>
                            <div>
                                <h2 className="font-bold text-lg">
                                    {chatType === 'chatbot' ? 'AI Assistant' :
                                     chatType === 'support' ? 'Customer Support' :
                                     'Customer Support'}
                                </h2>
                                <p className="text-sm opacity-90">
                                    {chatType === 'chatbot' ? 'Your helpful shopping companion' :
                                     chatType === 'support' ? 'Chat with our team' :
                                     'How can we help?'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                onClick={minimizeChat}
                                className="w-8 h-8 bg-[#fffefc] bg-opacity-20 
                                         hover:bg-opacity-30 rounded-full 
                                         flex items-center justify-center
                                         transition-all duration-200"
                            >
                                <Minimize2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={closeChat}
                                className="w-8 h-8 bg-[#fffefc] bg-opacity-20 
                                         hover:bg-opacity-30 rounded-full 
                                         flex items-center justify-center
                                         transition-all duration-200"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                        {renderChatContent()}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ChatModal;
