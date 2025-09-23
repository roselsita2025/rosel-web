import { useState, useEffect } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../store/chatStore.js';
import { useAuthStore } from '../store/authStore.js';

const ChatFloatingButton = () => {
    const [isVisible, setIsVisible] = useState(false);
    const { isChatOpen, openChat, getUnreadCount } = useChatStore();
    const { isAuthenticated, user } = useAuthStore();
    const unreadCount = getUnreadCount();

    // Only show for non-admin users
    const shouldShow = isAuthenticated && user?.role !== 'admin';

    useEffect(() => {
        if (shouldShow) {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [shouldShow]);

    const handleClick = () => {
        if (isChatOpen) {
            // If chat is open, close it
            useChatStore.getState().closeChat();
        } else {
            // If chat is closed, open the selection modal
            openChat('selection');
        }
    };

    if (!shouldShow) return null;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20 
                    }}
                    className="fixed bottom-6 right-6 z-50"
                >
                    <motion.button
                        onClick={handleClick}
                        className={`
                            relative w-14 h-14 rounded-full shadow-lg
                            flex items-center justify-center
                            transition-all duration-300 ease-in-out
                            ${isChatOpen 
                                ? 'bg-[#860809] hover:bg-[#a31f17]' 
                                : 'bg-[#860809] hover:bg-[#a31f17] hover:scale-110'
                            }
                            group
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <AnimatePresence mode="wait">
                            {isChatOpen ? (
                                <motion.div
                                    key="close"
                                    initial={{ rotate: -90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: 90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <X className="w-6 h-6 text-[#fffefc]" />
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="chat"
                                    initial={{ rotate: 90, opacity: 0 }}
                                    animate={{ rotate: 0, opacity: 1 }}
                                    exit={{ rotate: -90, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <MessageCircle className="w-6 h-6 text-[#fffefc]" />
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Unread message indicator */}
                        {unreadCount > 0 && !isChatOpen && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="absolute -top-1 -right-1 bg-[#a31f17] text-[#fffefc] 
                                         text-xs font-bold rounded-full w-5 h-5 
                                         flex items-center justify-center
                                         border-2 border-[#fffefc]"
                            >
                                {unreadCount > 9 ? '9+' : unreadCount}
                            </motion.div>
                        )}

                        {/* Pulse animation for new messages */}
                        {unreadCount > 0 && !isChatOpen && (
                            <motion.div
                                className="absolute inset-0 rounded-full bg-[#a31f17]"
                                animate={{ 
                                    scale: [1, 1.2, 1],
                                    opacity: [0.7, 0, 0.7]
                                }}
                                transition={{ 
                                    duration: 2,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            />
                        )}

                        {/* Tooltip */}
                        <div className="absolute right-16 top-1/2 transform -translate-y-1/2
                                     bg-[#030105] text-[#fffefc] px-3 py-2 rounded-lg
                                     text-sm font-medium whitespace-nowrap
                                     opacity-0 group-hover:opacity-100
                                     transition-opacity duration-200
                                     pointer-events-none
                                     shadow-lg">
                            {isChatOpen ? 'Close Chat' : 'Need Help?'}
                            <div className="absolute right-0 top-1/2 transform translate-x-1 -translate-y-1/2
                                         w-0 h-0 border-l-4 border-l-[#030105] border-t-4 border-t-transparent
                                         border-b-4 border-b-transparent" />
                        </div>
                    </motion.button>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default ChatFloatingButton;
