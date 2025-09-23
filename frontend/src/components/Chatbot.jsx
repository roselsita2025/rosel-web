import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Bot, 
    User, 
    ArrowLeft, 
    Package, 
    Search, 
    HelpCircle, 
    Tag,
    ShoppingCart,
    Truck,
    MessageCircle,
    Gift
} from 'lucide-react';
import { useChatStore } from '../store/chatStore.js';
import { useNavigate } from 'react-router-dom';

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const navigate = useNavigate();
    
    const { 
        currentChat, 
        createChat, 
        sendMessage,
        openChat,
        clearMessages
    } = useChatStore();

    useEffect(() => {
        // Initialize chatbot with welcome message
        initializeChatbot();
    }, []);

    useEffect(() => {
        // Scroll to bottom when new messages arrive
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const initializeChatbot = async () => {
        try {
            // Create a new chatbot chat session
            const chat = await createChat('chatbot');
            
            // Add welcome message
            const welcomeMessage = {
                id: Date.now(),
                senderType: 'bot',
                content: "Hello! I'm your AI assistant. How can I help you today?",
                createdAt: new Date(),
                options: [
                    { id: 'browse-products', text: 'Browse Products', icon: Package },
                    { id: 'check-order', text: 'Check Order Status', icon: Truck },
                    { id: 'replacement-status', text: 'Replacement Request Status', icon: HelpCircle },
                    { id: 'ask-question', text: 'Ask a Question', icon: MessageCircle }
                ]
            };
            
            setMessages([welcomeMessage]);
        } catch (error) {
            console.error('Error initializing chatbot:', error);
        }
    };

    const handleOptionClick = async (optionId, optionText) => {
        // Add user message
        const userMessage = {
            id: Date.now(),
            senderType: 'customer',
            content: optionText,
            createdAt: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        // Simulate bot response delay
        setTimeout(() => {
            const botResponse = getBotResponse(optionId, optionText);
            setMessages(prev => [...prev, botResponse]);
            setIsLoading(false);
        }, 1000);
    };

    const getBotResponse = (optionId, optionText) => {
        const responses = {
            'browse-products': {
                content: "Great! I can help you browse our products. What category are you interested in?",
                options: [
                    { id: 'pork', text: 'Pork', icon: Package },
                    { id: 'beef', text: 'Beef', icon: Package },
                    { id: 'chicken', text: 'Chicken', icon: Package },
                    { id: 'sliced', text: 'Sliced', icon: Package },
                    { id: 'processed', text: 'Processed', icon: Package },
                    { id: 'ground', text: 'Ground', icon: Package },
                    { id: 'all-products', text: 'View All Products', icon: ShoppingCart }
                ]
            },
            'check-order': {
                content: "I can help you check your order status. Please provide your order number or I can take you to the order tracking page.",
                options: [
                    { id: 'track-orders', text: 'Go to Track Orders', icon: Truck },
                    { id: 'contact-support', text: 'Contact Support', icon: MessageCircle }
                ]
            },
            'replacement-status': {
                content: "I can help you check your replacement request status. You can view all your replacement requests and their current status.",
                options: [
                    { id: 'view-replacement-requests', text: 'View My Replacement Requests', icon: HelpCircle },
                    { id: 'new-replacement-request', text: 'Create New Request', icon: MessageCircle },
                    { id: 'contact-support', text: 'Contact Support', icon: MessageCircle }
                ]
            },
            'ask-question': {
                content: "I'm here to answer your questions! What would you like to know?",
                options: [
                    { id: 'delivery-info', text: 'Delivery Information', icon: Truck },
                    { id: 'payment-info', text: 'Payment Methods', icon: Package },
                    { id: 'return-policy', text: 'Return Policy', icon: Package },
                    { id: 'contact-support', text: 'Contact Support', icon: MessageCircle }
                ]
            },
            'pork': {
                content: "Our pork products are fresh and high-quality! Let me take you to our pork selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'beef': {
                content: "Our beef products are premium quality! Let me take you to our beef selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'chicken': {
                content: "Our chicken products are fresh and delicious! Let me take you to our chicken selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'sliced': {
                content: "Our sliced products are perfectly cut and ready to cook! Let me take you to our sliced selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'processed': {
                content: "Our processed foods are delicious and convenient! Let me take you to our processed selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'ground': {
                content: "Our ground products are perfect for cooking! Let me take you to our ground selection.",
                options: [
                    { id: 'browse-products', text: 'Back to Categories', icon: ArrowLeft }
                ]
            },
            'all-products': {
                content: "Perfect! Let me take you to our product catalog.",
                options: [
                    { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
                ]
            },
            'view-replacement-requests': {
                content: "I'll take you to your replacement requests page where you can view all your requests and their status.",
                options: [
                    { id: 'replacement-status', text: 'Back to Replacement Options', icon: ArrowLeft }
                ]
            },
            'new-replacement-request': {
                content: "I'll take you to create a new replacement request. You can submit a request for any product that needs to be replaced.",
                options: [
                    { id: 'replacement-status', text: 'Back to Replacement Options', icon: ArrowLeft }
                ]
            },
            'track-orders': {
                content: "I'll take you to the order tracking page where you can check your order status.",
                options: [
                    { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
                ]
            },
            'delivery-info': {
                content: "We offer fast and reliable delivery! Our delivery times are typically 1-3 business days. We deliver to most areas in the Philippines.",
                options: [
                    { id: 'ask-question', text: 'Ask Another Question', icon: HelpCircle },
                    { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
                ]
            },
            'payment-info': {
                content: "We accept various payment methods including credit cards, debit cards, GCash, PayMaya, and cash on delivery.",
                options: [
                    { id: 'ask-question', text: 'Ask Another Question', icon: HelpCircle },
                    { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
                ]
            },
            'return-policy': {
                content: "We offer a 7-day return policy for unopened products. Please contact our support team for return requests.",
                options: [
                    { id: 'ask-question', text: 'Ask Another Question', icon: HelpCircle },
                    { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
                ]
            },
        };

        const response = responses[optionId] || {
            content: "I'm not sure how to help with that. Let me connect you with our support team.",
            options: [
                { id: 'contact-support', text: 'Contact Support', icon: MessageCircle },
                { id: 'browse-products', text: 'Back to Main Menu', icon: ArrowLeft }
            ]
        };

        return {
            id: Date.now(),
            senderType: 'bot',
            content: response.content,
            createdAt: new Date(),
            options: response.options
        };
    };

    const handleNavigation = (optionId) => {
        switch (optionId) {
            case 'all-products':
                navigate('/products');
                // Close chat after navigation
                setTimeout(() => {
                    useChatStore.getState().closeChat();
                }, 100);
                break;
            case 'pork':
            case 'beef':
            case 'chicken':
            case 'sliced':
            case 'processed':
            case 'ground':
                navigate(`/category/${optionId}`);
                // Close chat after navigation
                setTimeout(() => {
                    useChatStore.getState().closeChat();
                }, 100);
                break;
            case 'track-orders':
                navigate('/track-orders');
                // Close chat after navigation
                setTimeout(() => {
                    useChatStore.getState().closeChat();
                }, 100);
                break;
            case 'view-replacement-requests':
                navigate('/replacement-requests');
                // Close chat after navigation
                setTimeout(() => {
                    useChatStore.getState().closeChat();
                }, 100);
                break;
            case 'new-replacement-request':
                navigate('/replacement-request/new');
                // Close chat after navigation
                setTimeout(() => {
                    useChatStore.getState().closeChat();
                }, 100);
                break;
            case 'contact-support':
                openChat('support');
                break;
            default:
                break;
        }
    };

    const handleBackToSelection = () => {
        openChat('selection');
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header with back button */}
            <div className="p-4 border-b border-[#f7e9b8] bg-[#f7e9b8]">
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
                        <h3 className="font-bold text-[#030105]">AI Assistant</h3>
                        <p className="text-sm text-[#030105] opacity-70">
                            Your helpful shopping companion
                        </p>
                    </div>
                </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <AnimatePresence>
                    {messages.map((message, index) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`flex ${message.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`flex items-start space-x-2 max-w-[80%] ${message.senderType === 'customer' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    message.senderType === 'customer' 
                                        ? 'bg-[#860809]' 
                                        : 'bg-[#f7e9b8]'
                                }`}>
                                    {message.senderType === 'customer' ? (
                                        <User className="w-4 h-4 text-[#fffefc]" />
                                    ) : (
                                        <Bot className="w-4 h-4 text-[#030105]" />
                                    )}
                                </div>
                                <div className={`px-4 py-2 rounded-lg ${
                                    message.senderType === 'customer'
                                        ? 'bg-[#860809] text-[#fffefc]'
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
                    ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="flex items-start space-x-2 max-w-[80%]">
                            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-[#f7e9b8]">
                                <Bot className="w-4 h-4 text-[#030105]" />
                            </div>
                            <div className="px-4 py-2 rounded-lg bg-[#f7e9b8] text-[#030105]">
                                <div className="flex space-x-1">
                                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" />
                                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                    <div className="w-2 h-2 bg-[#860809] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Options for the last bot message */}
                {messages.length > 0 && messages[messages.length - 1].senderType === 'bot' && messages[messages.length - 1].options && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="max-w-[80%]">
                            <div className="grid grid-cols-1 gap-2">
                                {messages[messages.length - 1].options.map((option, index) => (
                                    <motion.button
                                        key={option.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => {
                                            handleOptionClick(option.id, option.text);
                                            handleNavigation(option.id);
                                        }}
                                        className="flex items-center space-x-3 p-3 bg-[#f7e9b8] hover:bg-[#f0d896] 
                                                 rounded-lg border border-[#f7e9b8] 
                                                 transition-all duration-200 text-left
                                                 group"
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                    >
                                        <div className="w-8 h-8 bg-[#860809] rounded-full 
                                                     flex items-center justify-center
                                                     group-hover:bg-[#a31f17] transition-colors">
                                            <option.icon className="w-4 h-4 text-[#fffefc]" />
                                        </div>
                                        <span className="text-[#030105] font-medium">{option.text}</span>
                                    </motion.button>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Need more help section */}
            <div className="p-4 border-t border-[#f7e9b8] bg-[#fffefc]">
                <div className="text-center">
                    <p className="text-sm text-[#030105] opacity-70 mb-3">
                        Need human assistance?
                    </p>
                    <button
                        onClick={() => openChat('support')}
                        className="bg-[#860809] hover:bg-[#a31f17] text-[#fffefc] 
                                 px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                        Contact Support
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chatbot;
