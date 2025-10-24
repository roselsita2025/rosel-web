import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Bell, 
    Package, 
    ShoppingCart, 
    Gift, 
    RefreshCw, 
    Filter, 
    Search, 
    Check, 
    X, 
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Trash2,
    CheckCheck,
    ArrowLeft,
    Home
} from 'lucide-react';
import Footer from '../../components/Footer.jsx';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useAuthStore } from '../../store/authStore.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';

const NotificationCenterPage = () => {
    const { user } = useAuthStore();
    const {
        notifications,
        unreadCount,
        pagination,
        filters,
        isLoading,
        error,
        message,
        isConnected,
        fetchNotifications,
        initializeSocket,
        disconnectSocket,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        setFilters,
        clearFilters,
        clearError,
        clearMessage,
        formatTimeAgo,
        getPriorityColor,
        getCategoryIcon,
        getCategoryColor
    } = useNotificationStore();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedNotifications, setSelectedNotifications] = useState([]);
    const [showFilters, setShowFilters] = useState(false);

    // Initialize socket and fetch notifications on component mount
    useEffect(() => {
        if (user && user.isVerified) {
            console.log('🔔 CustomerNotificationCenter: Initializing for user:', user);
            
            // Get token from localStorage or cookies
            const token = localStorage.getItem('token') || document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];
            
            if (token) {
                console.log('🔌 Initializing notification socket for customer center...');
                initializeSocket(token);
            }
            
            // Fetch initial notifications
            fetchNotifications(1, 20, filters);
        } else {
            // Disconnect socket if user is not authenticated
            disconnectSocket();
        }
        
        // Cleanup on unmount
        return () => {
            disconnectSocket();
        };
    }, [user, initializeSocket, disconnectSocket, fetchNotifications, filters]);

    // Clear messages after 3 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => {
                clearMessage();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [message, clearMessage]);

    // Handle filter change
    const handleFilterChange = (key, value) => {
        setFilters({ [key]: value });
        setCurrentPage(1); // Reset to first page when filtering
    };

    // Handle search
    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset to first page when searching
        // For now, we'll implement client-side search
        // In a real app, you might want to implement server-side search
    };

    // Handle page change
    const handlePageChange = (page) => {
        fetchNotifications(page, 20, filters);
    };

    // Handle mark as read
    const handleMarkAsRead = async (notificationId) => {
        try {
            await markAsRead(notificationId);
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Handle mark all as read
    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    // Handle delete notification
    const handleDeleteNotification = async (notificationId) => {
        try {
            await deleteNotification(notificationId);
        } catch (error) {
            console.error('Error deleting notification:', error);
        }
    };

    // Handle select notification
    const handleSelectNotification = (notificationId) => {
        setSelectedNotifications(prev => 
            prev.includes(notificationId) 
                ? prev.filter(id => id !== notificationId)
                : [...prev, notificationId]
        );
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectedNotifications.length === notifications.length) {
            setSelectedNotifications([]);
        } else {
            setSelectedNotifications(notifications.map(n => n.notificationId));
        }
    };

    // Get category icon component
    const getCategoryIconComponent = (category) => {
        const iconProps = { className: "w-4 h-4 sm:w-5 sm:h-5" };
        switch (category) {
            case 'promotions':
                return <Gift {...iconProps} />;
            case 'orders':
                return <ShoppingCart {...iconProps} />;
            case 'requests':
                return <RefreshCw {...iconProps} />;
            default:
                return <Bell {...iconProps} />;
        }
    };

    // Get action URL
    const getActionUrl = (notification) => {
        if (notification.actionUrl) {
            return notification.actionUrl;
        }

        switch (notification.type) {
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

    // Filter notifications based on search term
    const filteredNotifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user || !user.isVerified) {
        return <LoadingSpinner />;
    }

    return (
        <>
            <div className="min-h-screen bg-[#f8f3ed] pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8">
                <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
                    {/* Back to Home Link */}
                    <div className="mb-3 sm:mb-4">
                        <Link 
                            to="/"
                            className="inline-flex items-center text-[#901414] hover:text-[#a31f17] transition-colors duration-300 text-sm sm:text-base"
                        >
                            <Home className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                            Back to Home
                        </Link>
                    </div>

                    {/* Header */}
                    <div className="mb-6 sm:mb-8">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-[#860809] font-libre">Notifications</h1>
                                <p className="text-[#030105] mt-1 font-alice text-sm sm:text-base">
                                    Stay updated with your orders, requests, and promotions
                                </p>
                            </div>
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={handleMarkAllAsRead}
                                        className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice text-xs sm:text-sm whitespace-nowrap"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="hidden sm:inline">Mark all as read</span>
                                        <span className="sm:hidden">Mark all read</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
                    <div className="bg-[#fffefc] rounded-lg p-4 sm:p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-blue-100 rounded-full flex-shrink-0">
                                <Bell className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Total Notifications</p>
                                <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">{pagination.totalNotifications}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#fffefc] rounded-lg p-4 sm:p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-red-100 rounded-full flex-shrink-0">
                                <Bell className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Unread</p>
                                <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">{unreadCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#fffefc] rounded-lg p-4 sm:p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-2 sm:p-3 bg-green-100 rounded-full flex-shrink-0">
                                <CheckCheck className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
                            </div>
                            <div className="ml-3 sm:ml-4 flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Read</p>
                                <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">
                                    {pagination.totalNotifications - unreadCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4 sm:p-6 mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm sm:text-base"
                                />
                            </div>
                        </form>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center justify-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg hover:bg-[#f8f3ed] transition-colors font-alice text-sm sm:text-base whitespace-nowrap"
                        >
                            <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span>Filters</span>
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice">Category</label>
                                    <select
                                        value={filters.category ?? ''}
                                        onChange={(e) => handleFilterChange('category', e.target.value === '' ? null : e.target.value)}
                                        className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm sm:text-base"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="promotions">Promotions</option>
                                        <option value="orders">Orders</option>
                                        <option value="requests">Requests</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice">Status</label>
                                    <select
                                        value={filters.isRead === null ? '' : filters.isRead.toString()}
                                        onChange={(e) => handleFilterChange('isRead', e.target.value === '' ? null : e.target.value === 'true')}
                                        className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm sm:text-base"
                                    >
                                        <option value="">All</option>
                                        <option value="false">Unread</option>
                                        <option value="true">Read</option>
                                    </select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice">Priority</label>
                                    <select
                                        value={filters.priority || ''}
                                        onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                                        className="w-full px-2.5 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm sm:text-base"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-3 sm:mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="text-xs sm:text-sm text-[#a31f17] hover:text-[#860809] font-alice"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 flex items-center justify-between text-sm sm:text-base">
                        <span className="flex-1">{error}</span>
                        <button onClick={clearError} className="ml-2 text-red-500 hover:text-red-700 flex-shrink-0">
                            <X className="w-4 h-4 sm:w-4 sm:h-4" />
                        </button>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg mb-4 sm:mb-6 text-sm sm:text-base">
                        {message}
                    </div>
                )}

                {/* Notifications List */}
                <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300">
                    {/* Header */}
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3 sm:space-x-4">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-[#901414] focus:ring-[#901414]"
                                />
                                <span className="text-xs sm:text-sm text-[#a31f17] font-libre">
                                    {selectedNotifications.length > 0 
                                        ? `${selectedNotifications.length} selected`
                                        : `${filteredNotifications.length} notifications`
                                    }
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Notifications */}
                    {isLoading ? (
                        <div className="p-6 sm:p-8 text-center">
                            <LoadingSpinner />
                            <p className="text-[#a31f17] mt-2 font-libre text-sm sm:text-base">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-6 sm:p-8 text-center">
                            <Bell className="mx-auto text-gray-300 mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12" />
                            <h3 className="text-base sm:text-lg font-medium text-[#860809] mb-2 font-alice">No notifications found</h3>
                            <p className="text-[#a31f17] font-libre text-sm sm:text-base">
                                {searchTerm || Object.values(filters).some(f => f !== null)
                                    ? 'Try adjusting your search or filters'
                                    : 'You\'ll see notifications about your orders, requests, and promotions here'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.notificationId}
                                    className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start gap-2 sm:gap-3 md:gap-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.includes(notification.notificationId)}
                                            onChange={() => handleSelectNotification(notification.notificationId)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-[#901414] focus:ring-[#901414] flex-shrink-0"
                                        />

                                        {/* Category Icon */}
                                        <div className={`p-2 sm:p-3 rounded-full flex-shrink-0 ${getCategoryColor(notification.category)}`}>
                                            {getCategoryIconComponent(notification.category)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-medium text-[#860809] mb-1 font-libre">
                                                        {notification.title}
                                                    </h3>
                                                    <p className="text-[#a31f17] mb-2 sm:mb-3 font-libre text-sm sm:text-base">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-500">
                                                        <span className="whitespace-nowrap">{formatTimeAgo(notification.createdAt)}</span>
                                                        {notification.priority !== 'medium' && (
                                                            <span className={`px-2 py-0.5 sm:py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                                                                {notification.priority}
                                                            </span>
                                                        )}
                                                        <span className="capitalize whitespace-nowrap">{notification.category}</span>
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-1.5 sm:gap-2 sm:ml-4 flex-shrink-0">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.notificationId)}
                                                            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check className="w-4 h-4 sm:w-4 sm:h-4" />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteNotification(notification.notificationId)}
                                                        className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 className="w-4 h-4 sm:w-4 sm:h-4" />
                                                    </button>
                                                    {notification.actionUrl && (
                                                        <Link
                                                            to={getActionUrl(notification)}
                                                            className="p-1.5 sm:p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-[#901414] transition-colors"
                                                            title="View details"
                                                        >
                                                            <MoreHorizontal className="w-4 h-4 sm:w-4 sm:h-4" />
                                                        </Link>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                </div>
            </div>
            </div>
            <Footer />
        </>
    );
};

export default NotificationCenterPage;
