import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const useOrderStore = create((set, get) => ({
    // State
    orders: [],
    currentOrder: null,
    orderStats: null,
    isLoading: false,
    error: null,
    
    // Actions
    fetchOrders: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.status) queryParams.append('status', params.status);
            
            const response = await axios.get(`${API_URL}/orders?${queryParams.toString()}`);
            
            set({ 
                orders: response.data.data.orders,
                pagination: response.data.data.pagination,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error fetching orders:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to fetch orders',
                isLoading: false 
            });
            throw error;
        }
    },
    
    fetchOrderDetails: async (orderId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/orders/${orderId}`);
            
            set({ 
                currentOrder: response.data.data,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order details:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to fetch order details',
                isLoading: false 
            });
            throw error;
        }
    },
    
    fetchOrderTracking: async (orderId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/orders/${orderId}/tracking`);
            
            set({ 
                currentOrder: response.data.data,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order tracking:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to fetch order tracking',
                isLoading: false 
            });
            throw error;
        }
    },
    
    fetchOrderStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/orders/stats`);
            
            set({ 
                orderStats: response.data.data,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error fetching order stats:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to fetch order statistics',
                isLoading: false 
            });
            throw error;
        }
    },
    
    clearError: () => set({ error: null }),
    
    clearCurrentOrder: () => set({ currentOrder: null }),
    
    // Helper function to get status color
    getStatusColor: (status) => {
        const statusColors = {
            'PENDING': 'text-yellow-600 bg-yellow-100',
            'ORDER_RECEIVED': 'text-blue-600 bg-blue-100',
            'ORDER_PREPARING': 'text-orange-600 bg-orange-100',
            'ORDER_PREPARED': 'text-purple-600 bg-purple-100',
            'PROCESSING': 'text-blue-600 bg-blue-100',
            'ASSIGNING_DRIVER': 'text-orange-600 bg-orange-100',
            'ON_GOING': 'text-purple-600 bg-purple-100',
            'PICKED_UP': 'text-indigo-600 bg-indigo-100',
            'COMPLETED': 'text-green-600 bg-green-100',
            'CANCELED': 'text-red-600 bg-red-100',
            'REJECTED': 'text-red-600 bg-red-100',
            'EXPIRED': 'text-gray-600 bg-gray-100',
            'READY_FOR_PICKUP': 'text-emerald-600 bg-emerald-100'
        };
        return statusColors[status] || 'text-gray-600 bg-gray-100';
    },
    
    // Helper function to get status icon
    getStatusIcon: (status) => {
        const statusIcons = {
            'PENDING': '⏳',
            'ORDER_RECEIVED': '📥',
            'ORDER_PREPARING': '👨‍🍳',
            'ORDER_PREPARED': '📦',
            'PROCESSING': '🔄',
            'ASSIGNING_DRIVER': '👤',
            'ON_GOING': '🚗',
            'PICKED_UP': '📦',
            'COMPLETED': '✅',
            'CANCELED': '❌',
            'REJECTED': '🚫',
            'EXPIRED': '⏰',
            'READY_FOR_PICKUP': '🏪'
        };
        return statusIcons[status] || '❓';
    },
    
    // Helper function to get status description
    getStatusDescription: (status) => {
        const statusDescriptions = {
            'PENDING': 'Your order is being processed',
            'ORDER_RECEIVED': 'Your order has been received and is being reviewed',
            'ORDER_PREPARING': 'Your order is being prepared by our team',
            'ORDER_PREPARED': 'Your order has been prepared and is ready for delivery',
            'PROCESSING': 'Your order is being processed',
            'ASSIGNING_DRIVER': 'Looking for a delivery driver',
            'ON_GOING': 'Driver is on the way to pick up your order',
            'PICKED_UP': 'Your order has been picked up and is on the way',
            'COMPLETED': 'Your order has been delivered successfully',
            'CANCELED': 'Your order has been cancelled',
            'REJECTED': 'Your order delivery was rejected',
            'EXPIRED': 'Your order has expired',
            'READY_FOR_PICKUP': 'Your order is ready for pickup'
        };
        return statusDescriptions[status] || 'Unknown status';
    }
}));

export { useOrderStore };
