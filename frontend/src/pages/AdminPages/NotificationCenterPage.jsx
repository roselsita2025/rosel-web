import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    Bell, 
    Package, 
    TrendingUp, 
    ShoppingCart, 
    Users, 
    Filter, 
    Search, 
    Check, 
    X, 
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Trash2,
    CheckCheck,
    Plus,
    Send
} from 'lucide-react';
import { useNotificationStore } from '../../store/notificationStore.js';
import { useAuthStore } from '../../store/authStore.js';
import LoadingSpinner from '../../components/LoadingSpinner.jsx';
import AdminLayout from '../../components/AdminLayout.jsx';

const AdminNotificationCenterPage = () => {
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
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Initialize socket and fetch notifications on component mount
    useEffect(() => {
        if (user && user.isVerified) {
            console.log('🔔 AdminNotificationCenter: Initializing for user:', user);
            
            // Get token from localStorage or cookies
            const token = localStorage.getItem('token') || document.cookie
                .split('; ')
                .find(row => row.startsWith('token='))
                ?.split('=')[1];
            
            if (token) {
                console.log('🔌 Initializing notification socket for admin center...');
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
        const iconProps = { size: 20 };
        switch (category) {
            case 'inventory':
                return <Package {...iconProps} />;
            case 'sales':
                return <TrendingUp {...iconProps} />;
            case 'orders':
                return <ShoppingCart {...iconProps} />;
            case 'customers':
                return <Users {...iconProps} />;
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
            default:
                return '/dashboard';
        }
    };

    // Filter notifications based on search term
    const filteredNotifications = notifications.filter(notification =>
        notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user || !user.isVerified || user.role !== 'admin') {
        return <LoadingSpinner />;
    }

    return (
        <AdminLayout>
            <div className='py-8'>
                <div className='relative z-10 container mx-auto px-4'>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center space-x-3">
                                <h1 className="text-3xl font-bold text-[#860809] font-libre">Notification Center</h1>
                                {/* Connection status indicator */}
                                <div className={`w-3 h-3 rounded-full ${
                                    isConnected ? 'bg-green-500' : 'bg-gray-400'
                                }`} title={isConnected ? 'WebSocket Connected' : 'WebSocket Disconnected'} />
                            </div>
                            <p className="text-[#030105] mt-1 font-alice">
                                Manage all system notifications and alerts
                            </p>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="flex items-center space-x-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice"
                            >
                                <Plus size={16} />
                                <span>Create Notification</span>
                            </button>
                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="flex items-center space-x-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice"
                                >
                                    <CheckCheck size={16} />
                                    <span>Mark all as read</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Bell className="text-blue-600" size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#a31f17] font-alice">Total Notifications</p>
                                <p className="text-2xl font-bold text-[#030105] font-libre">{pagination.totalNotifications}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-red-100 rounded-full">
                                <Bell className="text-red-600" size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#a31f17] font-alice">Unread</p>
                                <p className="text-2xl font-bold text-[#030105] font-libre">{unreadCount}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-green-100 rounded-full">
                                <CheckCheck className="text-green-600" size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#a31f17] font-alice">Read</p>
                                <p className="text-2xl font-bold text-[#030105] font-libre">
                                    {pagination.totalNotifications - unreadCount}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                        <div className="flex items-center">
                            <div className="p-3 bg-orange-100 rounded-full">
                                <Users className="text-orange-600" size={24} />
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#a31f17] font-alice">Active Users</p>
                                <p className="text-2xl font-bold text-[#030105] font-libre">-</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search notifications..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                                />
                            </div>
                        </form>

                        {/* Filter Toggle */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-[#f8f3ed] transition-colors font-alice"
                        >
                            <Filter size={16} />
                            <span>Filters</span>
                        </button>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                                {/* Category Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">Category</label>
                                    <select
                                        value={filters.category || ''}
                                        onChange={(e) => handleFilterChange('category', e.target.value || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                                    >
                                        <option value="">All Categories</option>
                                        <option value="inventory">Inventory</option>
                                        <option value="sales">Sales</option>
                                        <option value="orders">Orders</option>
                                        <option value="customers">Customers</option>
                                    </select>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">Type</label>
                                    <select
                                        value={filters.type || ''}
                                        onChange={(e) => handleFilterChange('type', e.target.value || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                                    >
                                        <option value="">All Types</option>
                                        <option value="inventory_alert">Inventory Alert</option>
                                        <option value="sales_alert">Sales Alert</option>
                                        <option value="order_alert">Order Alert</option>
                                        <option value="customer_alert">Customer Alert</option>
                                    </select>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">Status</label>
                                    <select
                                        value={filters.isRead === null ? '' : filters.isRead.toString()}
                                        onChange={(e) => handleFilterChange('isRead', e.target.value === '' ? null : e.target.value === 'true')}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                                    >
                                        <option value="">All</option>
                                        <option value="false">Unread</option>
                                        <option value="true">Read</option>
                                    </select>
                                </div>

                                {/* Priority Filter */}
                                <div>
                                    <label className="block text-sm font-medium text-[#a31f17] mb-2 font-alice">Priority</label>
                                    <select
                                        value={filters.priority || ''}
                                        onChange={(e) => handleFilterChange('priority', e.target.value || null)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                                    >
                                        <option value="">All Priorities</option>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={clearFilters}
                                    className="text-sm text-[#a31f17] hover:text-[#860809] font-alice"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Messages */}
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                        {error}
                        <button onClick={clearError} className="ml-2 text-red-500 hover:text-red-700">
                            <X size={16} />
                        </button>
                    </div>
                )}

                {message && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6">
                        {message}
                    </div>
                )}

                {/* Notifications List */}
                <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <input
                                    type="checkbox"
                                    checked={selectedNotifications.length === notifications.length && notifications.length > 0}
                                    onChange={handleSelectAll}
                                    className="rounded border-gray-300 text-[#a31f17] focus:ring-[#a31f17]"
                                />
                                <span className="text-sm text-[#a31f17] font-libre">
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
                        <div className="p-8 text-center">
                            <LoadingSpinner />
                            <p className="text-[#a31f17] mt-2 font-libre">Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell size={48} className="mx-auto text-gray-300 mb-4" />
                            <h3 className="text-lg font-medium text-[#860809] mb-2 font-alice">No notifications found</h3>
                            <p className="text-[#a31f17] font-libre">
                                {searchTerm || Object.values(filters).some(f => f !== null)
                                    ? 'Try adjusting your search or filters'
                                    : 'System notifications and alerts will appear here'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-200">
                            {filteredNotifications.map((notification) => (
                                <div
                                    key={notification.notificationId}
                                    className={`p-6 hover:bg-gray-50 transition-colors ${
                                        !notification.isRead ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-start space-x-4">
                                        {/* Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedNotifications.includes(notification.notificationId)}
                                            onChange={() => handleSelectNotification(notification.notificationId)}
                                            className="mt-1 rounded border-gray-300 text-[#a31f17] focus:ring-[#a31f17]"
                                        />

                                        {/* Category Icon */}
                                        <div className={`p-3 rounded-full ${getCategoryColor(notification.category)}`}>
                                            {getCategoryIconComponent(notification.category)}
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-2 mb-1">
                                                        <h3 className="text-lg font-medium text-[#860809] font-libre">
                                                            {notification.title}
                                                        </h3>
                                                        {notification.priority !== 'medium' && (
                                                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(notification.priority)}`}>
                                                                {notification.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[#a31f17] mb-3 font-libre">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span>{formatTimeAgo(notification.createdAt)}</span>
                                                        <span className="capitalize">{notification.category}</span>
                                                        <span className="capitalize">{notification.type.replace('_', ' ')}</span>
                                                        {notification.recipient && (
                                                            <span>To: {notification.recipient.name}</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center space-x-2 ml-4">
                                                    {!notification.isRead && (
                                                        <button
                                                            onClick={() => handleMarkAsRead(notification.notificationId)}
                                                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-green-600 transition-colors"
                                                            title="Mark as read"
                                                        >
                                                            <Check size={16} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDeleteNotification(notification.notificationId)}
                                                        className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                    {notification.actionUrl && (
                                                        <Link
                                                            to={getActionUrl(notification)}
                                                            className="p-2 hover:bg-gray-200 rounded-lg text-gray-400 hover:text-[#a31f17] transition-colors"
                                                            title="View details"
                                                        >
                                                            <MoreHorizontal size={16} />
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
        </AdminLayout>
    );
};

export default AdminNotificationCenterPage;
