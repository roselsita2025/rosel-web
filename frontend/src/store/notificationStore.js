import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/notifications";
axios.defaults.withCredentials = true;

export const useNotificationStore = create((set, get) => ({
    // State
    socket: null,
    isConnected: false,
    notifications: [],
    unreadCount: 0,
    categoryCounts: {},
    isLoading: false,
    error: null,
    message: null,
    
    // Pagination state
    pagination: {
        currentPage: 1,
        totalPages: 0,
        totalNotifications: 0,
        hasNextPage: false,
        hasPrevPage: false
    },
    
    // Filters
    filters: {
        category: null,
        isRead: null,
        priority: null
    },
    
    // Summary for dropdown
    summary: {
        recentNotifications: [],
        categoryCounts: {},
        totalUnread: 0
    },

    // Actions
    initializeSocket: (token) => {
        console.log('🔌 Initializing notification socket with token:', token ? 'Token present' : 'No token');
        
        const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            auth: {
                token: token
            }
        });

        socket.on('connect', () => {
            console.log('✅ Connected to notification server with socket ID:', socket.id);
            set({ isConnected: true });
        });

        socket.on('disconnect', (reason) => {
            console.log('❌ Disconnected from notification server. Reason:', reason);
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('❌ Notification socket connection error:', error);
            set({ isConnected: false, error: error.message });
        });

        // Listen for new notifications
        socket.on('new_notification', (data) => {
            console.log('🔔 Received new notification via WebSocket:', data);
            const { notification } = data;
            
            // Add notification to the store
            const { notifications, unreadCount, summary } = get();
            
            // Add to main notifications list
            const updatedNotifications = [notification, ...notifications];
            
            // Update unread count
            const newUnreadCount = unreadCount + 1;
            
            // Add to recent notifications in summary
            const updatedRecentNotifications = [notification, ...summary.recentNotifications].slice(0, 5);
            
            // Update category counts
            const updatedCategoryCounts = {
                ...summary.categoryCounts,
                [notification.category]: (summary.categoryCounts[notification.category] || 0) + 1
            };

            set({
                notifications: updatedNotifications,
                unreadCount: newUnreadCount,
                summary: {
                    recentNotifications: updatedRecentNotifications,
                    categoryCounts: updatedCategoryCounts,
                    totalUnread: newUnreadCount
                }
            });
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            console.log('🔌 Disconnecting notification socket');
            socket.disconnect();
            set({ socket: null, isConnected: false });
        }
    },

    fetchNotifications: async (page = 1, limit = 20, filters = {}) => {
        set({ isLoading: true, error: null });
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...filters
            });

            console.log('🔔 Fetching notifications with params:', params.toString());
            const response = await axios.get(`${API_URL}?${params}`);
            console.log('📊 Notifications response:', response.data);
            const { notifications, pagination, unreadCount } = response.data.data;

            set({
                notifications,
                pagination,
                unreadCount,
                isLoading: false
            });

            console.log('✅ Notifications updated:', { notifications: notifications.length, pagination, unreadCount });
            return { notifications, pagination, unreadCount };
        } catch (error) {
            console.error('❌ Error fetching notifications:', error);
            set({
                error: error.response?.data?.message || 'Failed to fetch notifications',
                isLoading: false
            });
            throw error;
        }
    },

    fetchNotificationSummary: async () => {
        try {
            console.log('🔔 Fetching notification summary...');
            const response = await axios.get(`${API_URL}/summary`);
            console.log('📊 Notification summary response:', response.data);
            const { recentNotifications, categoryCounts, totalUnread } = response.data.data;

            set({
                summary: {
                    recentNotifications,
                    categoryCounts,
                    totalUnread
                },
                unreadCount: totalUnread
            });

            console.log('✅ Notification summary updated:', { recentNotifications, categoryCounts, totalUnread });
            return { recentNotifications, categoryCounts, totalUnread };
        } catch (error) {
            console.error('❌ Error fetching notification summary:', error);
            // Don't throw error for summary fetch as it's not critical
        }
    },

    fetchNotificationStats: async () => {
        try {
            const response = await axios.get(`${API_URL}/stats`);
            const stats = response.data.data;
            return stats;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to fetch notification stats'
            });
            throw error;
        }
    },

    markAsRead: async (notificationId) => {
        try {
            const response = await axios.patch(`${API_URL}/${notificationId}/read`);
            const updatedNotification = response.data.data;

            // Update local state
            const { notifications, unreadCount } = get();
            const updatedNotifications = notifications.map(notification =>
                notification.notificationId === notificationId
                    ? { ...notification, isRead: true, readAt: new Date() }
                    : notification
            );

            set({
                notifications: updatedNotifications,
                unreadCount: Math.max(0, unreadCount - 1)
            });

            // Update summary if this notification was in recent notifications
            const { summary } = get();
            const updatedRecentNotifications = summary.recentNotifications.map(notification =>
                notification.notificationId === notificationId
                    ? { ...notification, isRead: true, readAt: new Date() }
                    : notification
            );

            set({
                summary: {
                    ...summary,
                    recentNotifications: updatedRecentNotifications,
                    totalUnread: Math.max(0, summary.totalUnread - 1)
                }
            });

            return updatedNotification;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to mark notification as read'
            });
            throw error;
        }
    },

    markAllAsRead: async () => {
        try {
            const response = await axios.patch(`${API_URL}/mark-all-read`);
            const { modifiedCount } = response.data.data;

            // Update local state
            const { notifications } = get();
            const updatedNotifications = notifications.map(notification => ({
                ...notification,
                isRead: true,
                readAt: new Date()
            }));

            set({
                notifications: updatedNotifications,
                unreadCount: 0,
                summary: {
                    ...get().summary,
                    totalUnread: 0,
                    recentNotifications: get().summary.recentNotifications.map(notification => ({
                        ...notification,
                        isRead: true,
                        readAt: new Date()
                    }))
                }
            });

            return modifiedCount;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to mark all notifications as read'
            });
            throw error;
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            await axios.delete(`${API_URL}/${notificationId}`);

            // Update local state
            const { notifications, unreadCount } = get();
            const notificationToDelete = notifications.find(n => n.notificationId === notificationId);
            const updatedNotifications = notifications.filter(
                notification => notification.notificationId !== notificationId
            );

            set({
                notifications: updatedNotifications,
                unreadCount: notificationToDelete && !notificationToDelete.isRead 
                    ? Math.max(0, unreadCount - 1) 
                    : unreadCount
            });

            // Update summary
            const { summary } = get();
            const updatedRecentNotifications = summary.recentNotifications.filter(
                notification => notification.notificationId !== notificationId
            );

            set({
                summary: {
                    ...summary,
                    recentNotifications: updatedRecentNotifications,
                    totalUnread: notificationToDelete && !notificationToDelete.isRead 
                        ? Math.max(0, summary.totalUnread - 1) 
                        : summary.totalUnread
                }
            });

            return true;
        } catch (error) {
            set({
                error: error.response?.data?.message || 'Failed to delete notification'
            });
            throw error;
        }
    },

    // Add new notification (for real-time updates)
    addNotification: (notification) => {
        const { notifications, unreadCount, summary } = get();
        
        // Add to main notifications list
        const updatedNotifications = [notification, ...notifications];
        
        // Update unread count
        const newUnreadCount = unreadCount + 1;
        
        // Add to recent notifications in summary
        const updatedRecentNotifications = [notification, ...summary.recentNotifications].slice(0, 5);
        
        // Update category counts
        const updatedCategoryCounts = {
            ...summary.categoryCounts,
            [notification.category]: (summary.categoryCounts[notification.category] || 0) + 1
        };

        set({
            notifications: updatedNotifications,
            unreadCount: newUnreadCount,
            summary: {
                recentNotifications: updatedRecentNotifications,
                categoryCounts: updatedCategoryCounts,
                totalUnread: newUnreadCount
            }
        });
    },

    // Update filters
    setFilters: (newFilters) => {
        set({
            filters: { ...get().filters, ...newFilters }
        });
    },

    // Clear filters
    clearFilters: () => {
        set({
            filters: {
                category: null,
                isRead: null,
                priority: null
            }
        });
    },

    // Clear error
    clearError: () => {
        set({ error: null });
    },

    // Clear message
    clearMessage: () => {
        set({ message: null });
    },

    // Get notification by ID
    getNotificationById: (notificationId) => {
        const { notifications } = get();
        return notifications.find(notification => notification.notificationId === notificationId);
    },

    // Get notifications by category
    getNotificationsByCategory: (category) => {
        const { notifications } = get();
        return notifications.filter(notification => notification.category === category);
    },

    // Get unread notifications
    getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter(notification => !notification.isRead);
    },

    // Get notifications by priority
    getNotificationsByPriority: (priority) => {
        const { notifications } = get();
        return notifications.filter(notification => notification.priority === priority);
    },

    // Format time ago
    formatTimeAgo: (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    },

    // Get priority color
    getPriorityColor: (priority) => {
        const colors = {
            low: 'text-green-600 bg-green-100',
            medium: 'text-blue-600 bg-blue-100',
            high: 'text-orange-600 bg-orange-100',
            urgent: 'text-red-600 bg-red-100'
        };
        return colors[priority] || colors.medium;
    },

    // Get category icon
    getCategoryIcon: (category) => {
        const icons = {
            inventory: 'Package',
            sales: 'TrendingUp',
            orders: 'ShoppingCart',
            customers: 'Users',
            promotions: 'Gift',
            requests: 'RefreshCw'
        };
        return icons[category] || 'Bell';
    },

    // Get category color
    getCategoryColor: (category) => {
        const colors = {
            inventory: 'text-blue-600 bg-blue-100',
            sales: 'text-green-600 bg-green-100',
            orders: 'text-purple-600 bg-purple-100',
            customers: 'text-orange-600 bg-orange-100',
            promotions: 'text-pink-600 bg-pink-100',
            requests: 'text-indigo-600 bg-indigo-100'
        };
        return colors[category] || 'text-gray-600 bg-gray-100';
    }
}));
