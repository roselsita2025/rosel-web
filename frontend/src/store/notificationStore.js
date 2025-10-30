import { create } from 'zustand';
import axios from 'axios';
import { io } from 'socket.io-client';

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/notifications";
axios.defaults.withCredentials = true;

const loadSoundSettings = () => {
    const soundEnabled = localStorage.getItem('notificationSoundEnabled');
    const soundVolume = localStorage.getItem('notificationSoundVolume');
    
    return {
        soundEnabled: soundEnabled !== null ? soundEnabled === 'true' : true,
        soundVolume: soundVolume !== null ? parseFloat(soundVolume) : 0.5
    };
};

const initialSoundSettings = loadSoundSettings();

export const useNotificationStore = create((set, get) => ({
    socket: null,
    isConnected: false,
    notifications: [],
    unreadCount: 0,
    categoryCounts: {},
    isLoading: false,
    error: null,
    message: null,
    
    pagination: {
        currentPage: 1,
        totalPages: 0,
        totalNotifications: 0,
        hasNextPage: false,
        hasPrevPage: false
    },
    
    filters: {
        category: null,
        isRead: null,
        priority: null
    },
    
    summary: {
        recentNotifications: [],
        categoryCounts: {},
        totalUnread: 0
    },
    
    soundEnabled: initialSoundSettings.soundEnabled,
    soundVolume: initialSoundSettings.soundVolume,

    playNotificationSound: async () => {
        const { soundEnabled, soundVolume } = get();
        
        if (!soundEnabled) return;

        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const audioContext = new AudioContext();
            
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            
            const oscillator1 = audioContext.createOscillator();
            const oscillator2 = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator1.type = 'sine';
            oscillator1.frequency.setValueAtTime(800, audioContext.currentTime);
            
            oscillator2.type = 'sine';
            oscillator2.frequency.setValueAtTime(600, audioContext.currentTime);
            
            oscillator1.connect(gainNode);
            oscillator2.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            gainNode.gain.setValueAtTime(soundVolume * 0.3, audioContext.currentTime);
            
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
            
            oscillator1.start(audioContext.currentTime);
            oscillator2.start(audioContext.currentTime);
            
            oscillator1.stop(audioContext.currentTime + 0.3);
            oscillator2.stop(audioContext.currentTime + 0.3);
            
            setTimeout(() => {
                audioContext.close();
            }, 500);
        } catch (error) {
            console.error('Error playing notification sound:', error);
        }
    },

    setSoundEnabled: (enabled) => {
        set({ soundEnabled: enabled });
        localStorage.setItem('notificationSoundEnabled', enabled.toString());
    },

    setSoundVolume: (volume) => {
        set({ soundVolume: Math.max(0, Math.min(1, volume)) });
        localStorage.setItem('notificationSoundVolume', volume.toString());
    },

    initializeSocket: (existingSocket) => {
        const socket = existingSocket || io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            withCredentials: true
        });

        socket.on('connect', () => {
            set({ isConnected: true });
        });

        socket.on('disconnect', (reason) => {
            set({ isConnected: false });
        });

        socket.on('connect_error', (error) => {
            console.error('Notification socket connection error:', error.message);
            set({ isConnected: false, error: error.message });
        });        

        socket.on('new_notification', (data) => {
            const { notification } = data;
            
            const { notifications, unreadCount, summary, playNotificationSound } = get();
            
            const updatedNotifications = [notification, ...notifications];
            
            const newUnreadCount = unreadCount + 1;
            
            const updatedRecentNotifications = [notification, ...summary.recentNotifications].slice(0, 5);
            
            const updatedCategoryCounts = {
                ...summary.categoryCounts,
                [notification.category]: (summary.categoryCounts[notification.category] || 0) + 1
            };

            const newSummary = {
                recentNotifications: updatedRecentNotifications,
                categoryCounts: updatedCategoryCounts,
                totalUnread: newUnreadCount
            };

            set({
                notifications: updatedNotifications,
                unreadCount: newUnreadCount,
                summary: newSummary
            });

            playNotificationSound();
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
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

            const response = await axios.get(`${API_URL}?${params}`);
            const { notifications, pagination, unreadCount } = response.data.data;

            set({
                notifications,
                pagination,
                unreadCount,
                isLoading: false
            });
            
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
            const response = await axios.get(`${API_URL}/summary`);
            const { recentNotifications, categoryCounts, totalUnread } = response.data.data;

            set({
                summary: {
                    recentNotifications,
                    categoryCounts,
                    totalUnread
                },
                unreadCount: totalUnread
            });
            
            return { recentNotifications, categoryCounts, totalUnread };
        } catch (error) {
            console.error('❌ Error fetching notification summary:', error);
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

    addNotification: (notification) => {
        const { notifications, unreadCount, summary } = get();
        
        const updatedNotifications = [notification, ...notifications];
        
        const newUnreadCount = unreadCount + 1;
        
        const updatedRecentNotifications = [notification, ...summary.recentNotifications].slice(0, 5);
        
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

    setFilters: (newFilters) => {
        set({
            filters: { ...get().filters, ...newFilters }
        });
    },

    clearFilters: () => {
        set({
            filters: {
                category: null,
                isRead: null,
                priority: null
            }
        });
    },

    clearError: () => {
        set({ error: null });
    },

    clearMessage: () => {
        set({ message: null });
    },

    getNotificationById: (notificationId) => {
        const { notifications } = get();
        return notifications.find(notification => notification.notificationId === notificationId);
    },

    getNotificationsByCategory: (category) => {
        const { notifications } = get();
        return notifications.filter(notification => notification.category === category);
    },

    getUnreadNotifications: () => {
        const { notifications } = get();
        return notifications.filter(notification => !notification.isRead);
    },

    getNotificationsByPriority: (priority) => {
        const { notifications } = get();
        return notifications.filter(notification => notification.priority === priority);
    },

    formatTimeAgo: (date) => {
        const now = new Date();
        const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return new Date(date).toLocaleDateString();
    },

    getPriorityColor: (priority) => {
        const colors = {
            low: 'text-green-600 bg-green-100',
            medium: 'text-blue-600 bg-blue-100',
            high: 'text-orange-600 bg-orange-100',
            urgent: 'text-red-600 bg-red-100'
        };
        return colors[priority] || colors.medium;
    },

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
