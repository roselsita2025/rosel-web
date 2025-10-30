import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    MessageCircle, 
    Clock, 
    CheckCircle, 
    XCircle, 
    User, 
    Phone, 
    AlertCircle,
    Search,
    Filter,
    MoreVertical,
    Send,
    Bot,
    Menu,
    X
} from 'lucide-react';
import { useChatStore } from '../../store/chatStore.js';
import { useAuthStore } from '../../store/authStore.js';
import AdminLayout from '../../components/AdminLayout.jsx';

const ChatManagementPage = () => {
    const [selectedChat, setSelectedChat] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [message, setMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { 
        chats, 
        messages, 
        isLoading, 
        error, 
        getAdminChats, 
        getChatMessages,
        sendMessage,
        assignChatToAdmin,
        updateChatStatus,
        isConnected,
        typingUsers,
        socket
    } = useChatStore();
    
    const { user } = useAuthStore();

    useEffect(() => {
        loadChats();
    }, []);

    useEffect(() => {
        if (socket) {
            socket.on('new_support_message', (data) => {
                console.log('New support message received:', data);
                loadChats();
            });

            socket.on('chat_assigned', (data) => {
                console.log('Chat assigned:', data);
                if (selectedChat && selectedChat.chatId === data.chat.chatId) {
                    setSelectedChat(data.chat);
                }
                loadChats();
            });

            socket.on('customer_left_chat', (data) => {
                console.log('Customer left chat:', data);
                alert(`Customer has ended the conversation for chat ${data.chat.chatId}`);
                loadChats();
            });

            socket.on('chat_status_updated', (data) => {
                console.log('Chat status updated:', data);
                if (selectedChat && selectedChat.chatId === data.chatId) {
                    setSelectedChat(data.chat);
                }
                loadChats();
            });

            return () => {
                socket.off('new_support_message');
                socket.off('chat_assigned');
                socket.off('customer_left_chat');
                socket.off('chat_status_updated');
            };
        }
    }, [socket]);

    useEffect(() => {
        if (selectedChat) {
            loadChatMessages(selectedChat.chatId);
            if (socket) {
                socket.emit('join_chat', selectedChat.chatId);
                console.log('Admin joined chat:', selectedChat.chatId);
            }
        }
    }, [selectedChat, socket]);

    const loadChats = async () => {
        try {
            await getAdminChats(statusFilter, currentPage);
        } catch (error) {
            console.error('Error loading chats:', error);
        }
    };

    const loadChatMessages = async (chatId) => {
        try {
            await getChatMessages(chatId);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const handleChatSelect = async (chat) => {
        setSidebarOpen(false); // Close sidebar on mobile when chat is selected
        
        if (!chat.admin) {
            try {
                const updatedChat = await assignChatToAdmin(chat.chatId);
                setSelectedChat(updatedChat);
            } catch (error) {
                console.error('Error assigning chat:', error);
                setSelectedChat(chat);
            }
        } else {
            setSelectedChat(chat);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        
        if (!message.trim() || !selectedChat) return;

        try {
            await sendMessage(selectedChat.chatId, message, 'text');
            setMessage('');
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleStatusChange = async (chat, newStatus) => {
        try {
            await updateChatStatus(chat.chatId, newStatus);
            loadChats(); // Refresh chat list
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'waiting':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'active':
                return <MessageCircle className="w-4 h-4 text-green-500" />;
            case 'resolved':
                return <CheckCircle className="w-4 h-4 text-blue-500" />;
            case 'closed':
                return <XCircle className="w-4 h-4 text-gray-500" />;
            case 'ended':
                return <XCircle className="w-4 h-4 text-red-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'waiting':
                return 'bg-yellow-100 text-yellow-800';
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'resolved':
                return 'bg-blue-100 text-blue-800';
            case 'closed':
                return 'bg-gray-100 text-gray-800';
            case 'ended':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredChats = chats.filter(chat => {
        const matchesSearch = !searchQuery || 
            chat.customer?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.customer?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            chat.customerDetails?.issue?.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesStatus = !statusFilter || chat.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getTypingIndicator = () => {
        if (!selectedChat) return null;
        
        const otherTypingUsers = typingUsers.filter(u => 
            u.userId !== user?._id && u.chatId === selectedChat.chatId
        );
        
        if (otherTypingUsers.length === 0) return null;

        return (
            <div className="flex items-center space-x-2 text-sm text-[#a31f17] px-4 py-2 font-alice">
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
        <AdminLayout>
            <div className="h-screen flex flex-col bg-[#f8f3ed]">
                {/* Header */}
                <div className="bg-[#fffefc] text-[#030105] px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b border-gray-300 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 hover:bg-[#f8f3ed] rounded-lg transition-colors active:scale-95"
                            >
                                <Menu className="w-5 h-5 text-[#860809]" />
                            </button>
                            
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#860809] rounded-lg flex items-center justify-center flex-shrink-0">
                                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#fffefc]" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-lg md:text-xl font-bold text-[#860809] font-libre truncate">Chat Management</h1>
                                <p className="text-xs sm:text-sm text-[#a31f17] font-alice hidden sm:block">Customer Support Conversations</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-shrink-0">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                <span className="text-xs sm:text-sm text-[#a31f17] font-alice hidden xs:inline">
                                    {isConnected ? 'Online' : 'Offline'}
                                </span>
                            </div>
                            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-[#860809] rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#fffefc]" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden relative">
                    {/* Mobile Sidebar Overlay */}
                    {sidebarOpen && (
                        <div 
                            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                            onClick={() => setSidebarOpen(false)}
                        />
                    )}
                    
                    {/* Chat List Sidebar */}
                    <div className={`
                        w-full sm:w-80 lg:w-80 
                        bg-[#fffefc] border-r border-gray-300 flex flex-col
                        fixed lg:relative inset-y-0 left-0 z-50
                        transform transition-transform duration-300 ease-in-out
                        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    `}>
                        {/* Sidebar Header */}
                        <div className="p-3 sm:p-4 border-b border-gray-300 bg-[#f8f3ed]">
                            <div className="flex items-center justify-between mb-3 sm:mb-4">
                                <h2 className="text-base sm:text-lg font-semibold text-[#860809] font-libre">Chats</h2>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs sm:text-sm text-[#a31f17] font-alice">All chats ({filteredChats.length})</span>
                                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#860809]" />
                                    {/* Mobile Close Button */}
                                    <button
                                        onClick={() => setSidebarOpen(false)}
                                        className="lg:hidden p-1 hover:bg-[#fffefc] rounded transition-colors active:scale-95"
                                    >
                                        <X className="w-4 h-4 text-[#860809]" />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Search */}
                            <div className="relative mb-3">
                                <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#860809]" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search chats..."
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm bg-[#fffefc] border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#860809] focus:border-transparent 
                                             text-[#030105] placeholder-[#a31f17] font-alice"
                                />
                            </div>
                            
                            {/* Status Filter */}
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm bg-[#fffefc] border border-gray-300 rounded-lg 
                                             focus:ring-2 focus:ring-[#860809] focus:border-transparent 
                                             text-[#030105] font-alice"
                                >
                                    <option value="">All Status</option>
                                    <option value="waiting">Waiting</option>
                                    <option value="active">Active</option>
                                    <option value="resolved">Resolved</option>
                                    <option value="closed">Closed</option>
                                    <option value="ended">Ended</option>
                                </select>
                        </div>

                        {/* Chat List */}
                        <div className="flex-1 overflow-y-auto">
                            {isLoading ? (
                                <div className="flex justify-center items-center py-8">
                                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#860809] border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : filteredChats.length === 0 ? (
                                <div className="text-center py-8 px-4">
                                    <MessageCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#860809] opacity-50 mx-auto mb-3" />
                                    <p className="text-xs sm:text-sm text-[#a31f17] font-alice">No chats found</p>
                                </div>
                            ) : (
                                <div className="p-1.5 sm:p-2">
                                    {filteredChats.map((chat) => (
                                        <motion.button
                                            key={chat._id}
                                            onClick={() => handleChatSelect(chat)}
                                            className={`w-full p-2.5 sm:p-3 rounded-lg text-left transition-all duration-200 mb-1.5 sm:mb-2 ${
                                                selectedChat?._id === chat._id
                                                    ? 'bg-[#860809] text-[#fffefc] shadow-md'
                                                    : 'bg-[#f8f3ed] hover:bg-[#a31f17] hover:text-white text-[#030105] border border-gray-300 hover:border-[#860809]'
                                            }`}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                        >
                                            <div className="flex items-start gap-2 sm:gap-3">
                                                {/* Avatar */}
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                    selectedChat?._id === chat._id ? 'bg-[#fffefc]' : 'bg-[#860809]'
                                                }`}>
                                                    <User className={`w-4 h-4 sm:w-5 sm:h-5 ${
                                                        selectedChat?._id === chat._id ? 'text-[#860809]' : 'text-[#fffefc]'
                                                    }`} />
                                                </div>
                                                
                                                {/* Chat Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className={`text-sm sm:text-base font-medium truncate font-alice ${
                                                            selectedChat?._id === chat._id ? 'text-[#fffefc]' : 'text-[#030105]'
                                                        }`}>
                                                            {chat.customer?.name || 'Unknown Customer'}
                                                        </p>
                                                        <span className={`text-[10px] sm:text-xs font-alice whitespace-nowrap ml-2 ${
                                                            selectedChat?._id === chat._id ? 'text-[#fffefc] opacity-70' : 'text-[#a31f17]'
                                                        }`}>
                                                            {new Date(chat.lastMessageAt).toLocaleTimeString([], { 
                                                                hour: '2-digit', 
                                                                minute: '2-digit' 
                                                            })}
                                                        </span>
                                                    </div>
                                                    
                                                    {chat.customerDetails?.issue && (
                                                        <p className={`text-xs sm:text-sm truncate mb-1.5 sm:mb-2 font-libre ${
                                                            selectedChat?._id === chat._id ? 'text-[#fffefc] opacity-80' : 'text-[#a31f17]'
                                                        }`}>
                                                            {chat.customerDetails.issue}
                                                        </p>
                                                    )}
                                                    
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium font-alice flex items-center gap-1 ${getStatusColor(chat.status)}`}>
                                                            {getStatusIcon(chat.status)}
                                                            <span className="capitalize">{chat.status}</span>
                                                        </span>
                                                        {!chat.admin && (
                                                            <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col bg-[#fffefc]">
                        {selectedChat ? (
                            <>
                                {/* Chat Header */}
                                <div className="p-3 sm:p-4 border-b border-gray-300 bg-[#f8f3ed]">
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#860809] rounded-full flex items-center justify-center flex-shrink-0">
                                                <User className="w-4 h-4 sm:w-5 sm:h-5 text-[#fffefc]" />
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm sm:text-base font-semibold text-[#860809] font-libre truncate">
                                                    {selectedChat.customer?.name || 'Unknown Customer'}
                                                </h3>
                                                <p className="text-xs sm:text-sm text-[#a31f17] font-alice truncate">
                                                    {selectedChat.customer?.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                                            <select
                                                value={selectedChat.status}
                                                onChange={(e) => handleStatusChange(selectedChat, e.target.value)}
                                                className="px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg 
                                                         bg-[#fffefc] text-[#030105] text-xs sm:text-sm focus:ring-2 focus:ring-[#860809] font-alice"
                                            >
                                                <option value="waiting">Waiting</option>
                                                <option value="active">Active</option>
                                                <option value="resolved">Resolved</option>
                                                <option value="closed">Closed</option>
                                                <option value="ended">Ended</option>
                                            </select>
                                            <button className="p-1.5 sm:p-2 hover:bg-[#a31f17] hover:text-white rounded-lg transition-colors active:scale-95">
                                                <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#860809]" />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Messages Area */}
                                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#fffefc]">
                                    {messages.map((message, index) => {
                                        if (message.messageType === 'system') {
                                            return (
                                                <motion.div
                                                    key={index}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    className="flex justify-center"
                                                >
                                                    <div className="bg-[#f8f3ed] text-[#a31f17] px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm max-w-[85%] sm:max-w-[80%] text-center font-alice">
                                                        <p className="text-[10px] sm:text-xs font-libre">{message.content}</p>
                                                    </div>
                                                </motion.div>
                                            );
                                        }

                                        return (
                                            <motion.div
                                                key={index}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                className={`flex ${message.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`flex items-start gap-1.5 sm:gap-2 max-w-[90%] sm:max-w-[85%] md:max-w-[70%] ${message.senderType === 'admin' ? 'flex-row-reverse' : ''}`}>
                                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        message.senderType === 'admin' 
                                                            ? 'bg-[#860809]' 
                                                            : message.senderType === 'customer'
                                                            ? 'bg-[#a31f17]'
                                                            : 'bg-[#f7e9b8]'
                                                    }`}>
                                                        {message.senderType === 'admin' ? (
                                                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#fffefc]" />
                                                        ) : message.senderType === 'customer' ? (
                                                            <User className="w-3 h-3 sm:w-4 sm:h-4 text-[#fffefc]" />
                                                        ) : (
                                                            <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-[#030105]" />
                                                        )}
                                                    </div>
                                                    <div className={`px-3 sm:px-4 py-2 sm:py-3 rounded-2xl ${
                                                        message.senderType === 'admin'
                                                            ? 'bg-[#860809] text-[#fffefc] rounded-br-md'
                                                            : message.senderType === 'customer'
                                                            ? 'bg-[#a31f17] text-[#fffefc] rounded-bl-md'
                                                            : 'bg-[#f7e9b8] text-[#030105] rounded-bl-md'
                                                    }`}>
                                                        <p className="text-xs sm:text-sm whitespace-pre-wrap font-libre break-words">{message.content}</p>
                                                        <p className={`text-[10px] sm:text-xs mt-1 font-alice ${
                                                            message.senderType === 'admin' 
                                                                ? 'text-[#fffefc] opacity-70' 
                                                                : message.senderType === 'customer'
                                                                ? 'text-[#fffefc] opacity-70'
                                                                : 'text-[#a31f17]'
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
                                    
                                    {/* Typing Indicator */}
                                    {getTypingIndicator()}
                                </div>

                                {/* Message Input */}
                                <div className="p-3 sm:p-4 border-t border-gray-300 bg-[#f8f3ed]">
                                    {selectedChat?.status === 'ended' ? (
                                        <div className="flex items-center justify-center py-3 sm:py-4">
                                            <div className="text-center">
                                                <p className="text-[#a31f17] text-xs sm:text-sm font-alice">
                                                    This conversation has ended. No new messages can be sent.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <form onSubmit={handleSendMessage} className="flex items-end gap-2 sm:gap-3">
                                            <div className="flex-1">
                                                <textarea
                                                    value={message}
                                                    onChange={(e) => setMessage(e.target.value)}
                                                    placeholder="Type a message..."
                                                    rows={1}
                                                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-2xl 
                                                             focus:ring-2 focus:ring-[#860809] focus:border-transparent 
                                                             bg-[#fffefc] text-[#030105] resize-none font-alice"
                                                    disabled={!isConnected}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSendMessage(e);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={!message.trim() || !isConnected}
                                                className="w-9 h-9 sm:w-10 sm:h-10 bg-[#860809] hover:bg-[#a31f17] active:bg-[#a31f17]
                                                         disabled:opacity-50 disabled:cursor-not-allowed
                                                         text-[#fffefc] rounded-full flex items-center justify-center
                                                         transition-colors duration-200 font-alice active:scale-95 flex-shrink-0"
                                            >
                                                <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            </button>
                                        </form>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-[#fffefc] p-4">
                                <div className="text-center max-w-sm">
                                    <MessageCircle className="w-12 h-12 sm:w-16 sm:h-16 text-[#860809] opacity-50 mx-auto mb-3 sm:mb-4" />
                                    <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre">
                                        Select a chat to start
                                    </h3>
                                    <p className="text-xs sm:text-sm text-[#a31f17] font-alice">
                                        Choose a customer support chat from the list to begin the conversation
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default ChatManagementPage;
