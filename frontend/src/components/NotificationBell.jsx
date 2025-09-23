import { Bell, Package, TrendingUp, ShoppingCart, Users, Gift, RefreshCw, X, Check, MoreHorizontal } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useNotificationStore } from '../store/notificationStore.js';
import { useAuthStore } from '../store/authStore.js';

const NotificationBell = () => {
    const { user } = useAuthStore();
    const {
        summary,
        unreadCount,
        isLoading,
        error,
        isConnected,
        fetchNotificationSummary,
        initializeSocket,
        disconnectSocket,
        markAsRead,
        deleteNotification,
        formatTimeAgo,
        getPriorityColor,
        getCategoryIcon,
        getCategoryColor
    } = useNotificationStore();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingAction, setIsLoadingAction] = useState(false);
    const dropdownRef = useRef(null);
    const initializedRef = useRef(false);

    // Memoize the initialization function to prevent unnecessary re-runs
    const initializeNotifications = useCallback(async () => {
        if (user && user.isVerified && !initializedRef.current) {
            console.log('🔔 NotificationBell: Initializing for user:', user);
            initializedRef.current = true;
            
            // Get token from localStorage or cookies
            const token = localStorage.getItem('token') || document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];
            
            if (token) {
                console.log('🔌 Initializing notification socket...');
                initializeSocket(token);
            }
            
            // Fetch initial notifications
            fetchNotificationSummary();
        } else if (!user || !user.isVerified) {
            // Reset initialization flag when user logs out
            initializedRef.current = false;
            // Disconnect socket if user is not authenticated
            disconnectSocket();
        }
    }, [user?.id, user?.isVerified]); // Only depend on user ID and verification status

    // Initialize socket and fetch notifications on component mount
    useEffect(() => {
        initializeNotifications();
        
        // Cleanup on unmount
        return () => {
            disconnectSocket();
        };
    }, [initializeNotifications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Handle mark as read
    const handleMarkAsRead = async (notificationId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsLoadingAction(true);
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // Handle delete notification
    const handleDeleteNotification = async (notificationId, e) => {
        e.preventDefault();
        e.stopPropagation();
        
        setIsLoadingAction(true);
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        } finally {
            setIsLoadingAction(false);
        }
    };

    // Get category icon component
    const getCategoryIconComponent = (category) => {
        const iconProps = { size: 16 };
        switch (category) {
            case 'inventory':
                return <Package {...iconProps} />;
            case 'sales':
                return <TrendingUp {...iconProps} />;
            case 'orders':
                return <ShoppingCart {...iconProps} />;
            case 'customers':
                return <Users {...iconProps} />;
            case 'promotions':
                return <Gift {...iconProps} />;
            case 'requests':
                return <RefreshCw {...iconProps} />;
            default:
                return <Bell {...iconProps} />;
        }
    };

    // Get action URL based on notification type
    const getActionUrl = (notification) => {
        if (notification.actionUrl) {
            return notification.actionUrl;
        }

        // Default URLs based on notification type
        switch (notification.type) {
            case 'inventory_alert':
                return '/manage-products';
            case 'order_alert':
                return '/orders-history';
            case 'customer_alert':
                if (notification.subcategory === 'new_request') {
                    return '/admin/replacement-requests';
                } else if (notification.subcategory === 'chat_message') {
                    return '/admin/chat-management';
                }
                return '/admin/replacement-requests';
            case 'promotion':
                return '/products';
            case 'order_notification':
                return '/track-orders';
            case 'request_notification':
                return '/replacement-requests';
            default:
                return '/';
        }
    };

    if (!user || !user.isVerified) {
        return null;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Bell Button */}
            <button
                onClick={() => {
                    console.log('🔔 Notification bell clicked, current state:', { isDropdownOpen, unreadCount, summary });
                    setIsDropdownOpen(!isDropdownOpen);
                    if (!isDropdownOpen) {
                        console.log('🔄 Fetching fresh notifications...');
                        fetchNotificationSummary();
                    }
                }}
                className="relative p-2 rounded hover:bg-[#f7e9b8] text-[#901414] hover:text-[#810e0e] transition-colors duration-200 group"
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 bg-[#901414] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium group-hover:bg-[#a31f17] transition duration-300 ease-in-out">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* Connection status indicator */}
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full ${
                    isConnected ? 'bg-green-500' : 'bg-gray-400'
                }`} title={isConnected ? 'Connected' : 'Disconnected'} />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 flex flex-col">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <span className="text-xs text-gray-500">
                                        {unreadCount} unread
                                    </span>
                                )}
                                <button
                                    onClick={() => {
                                        console.log('🔄 Refreshing notifications...');
                                        fetchNotificationSummary();
                                    }}
                                    className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-blue-600"
                                    title="Refresh notifications"
                                >
                                    <RefreshCw size={14} />
                                </button>
                                <button
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="p-1 hover:bg-gray-200 rounded"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                        {isLoading ? (
                            <div className="p-4 text-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#ffd901] mx-auto"></div>
                                <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                            </div>
                        ) : error ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-red-500">{error}</p>
                            </div>
                        ) : summary.recentNotifications.length === 0 ? (
                            <div className="p-4 text-center">
                                <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {summary.recentNotifications.map((notification) => (
                                    <div
                                        key={notification.notificationId}
                                        className={`p-3 hover:bg-gray-50 transition-colors duration-150 ${
                                            !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                        }`}
                                    >
                                        <div className="flex items-start space-x-3">
                                            {/* Category Icon */}
                                            <div className={`p-2 rounded-full ${getCategoryColor(notification.category)}`}>
                                                {getCategoryIconComponent(notification.category)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                            {notification.title}
                                                        </p>
                                                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <span className="text-xs text-gray-400">
                                                                {formatTimeAgo(notification.createdAt)}
                                                            </span>
                                                            {notification.priority !== 'medium' && (
                                                                <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(notification.priority)}`}>
                                                                    {notification.priority}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center space-x-1 ml-2">
                                                        {!notification.isRead && (
                                                            <button
                                                                onClick={(e) => handleMarkAsRead(notification.notificationId, e)}
                                                                disabled={isLoadingAction}
                                                                className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-green-600 transition-colors"
                                                                title="Mark as read"
                                                            >
                                                                <Check size={14} />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={(e) => handleDeleteNotification(notification.notificationId, e)}
                                                            disabled={isLoadingAction}
                                                            className="p-1 hover:bg-gray-200 rounded text-gray-400 hover:text-red-600 transition-colors"
                                                            title="Delete"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            <Link
                                to={user.role === 'admin' ? '/admin/notifications' : '/notifications'}
                                className="text-sm text-[#901414] hover:text-[#860809] font-medium"
                                onClick={() => setIsDropdownOpen(false)}
                            >
                                View all notifications
                            </Link>
                            {summary.recentNotifications.length > 0 && (
                                <button
                                    onClick={() => setIsDropdownOpen(false)}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
