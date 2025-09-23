import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const useAdminOrderStore = create((set, get) => ({
    // State
    pendingOrders: [],
    currentOrder: null,
    isLoading: false,
    error: null,
    pagination: null,
    
    // Actions
    fetchPendingOrders: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const queryParams = new URLSearchParams();
            if (params.page) queryParams.append('page', params.page);
            if (params.limit) queryParams.append('limit', params.limit);
            if (params.status) queryParams.append('status', params.status);
            
            const response = await axios.get(`${API_URL}/admin/orders/pending-actions?${queryParams.toString()}`);
            
            set({ 
                pendingOrders: response.data.data.orders,
                pagination: response.data.data.pagination,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to fetch pending orders',
                isLoading: false 
            });
            throw error;
        }
    },
    
    updateOrderStatus: async (orderId, adminStatus, notes = '') => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.patch(`${API_URL}/admin/orders/${orderId}/status`, {
                adminStatus,
                notes
            });
            
            // Update the order in the pending orders list
            const updatedOrders = get().pendingOrders.map(order => 
                order._id === orderId ? response.data.data : order
            );
            
            set({ 
                pendingOrders: updatedOrders,
                currentOrder: response.data.data,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error updating order status:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to update order status',
                isLoading: false 
            });
            throw error;
        }
    },
    
    placeLalamoveOrder: async (orderId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.post(`${API_URL}/admin/orders/${orderId}/place-lalamove`);
            
            // Update the order in the pending orders list
            const updatedOrders = get().pendingOrders.map(order => 
                order._id === orderId ? response.data.data : order
            );
            
            set({ 
                pendingOrders: updatedOrders,
                currentOrder: response.data.data,
                isLoading: false 
            });
            
            return response.data.data;
        } catch (error) {
            console.error('Error placing Lalamove order:', error);
            set({ 
                error: error.response?.data?.message || 'Failed to place Lalamove order',
                isLoading: false 
            });
            throw error;
        }
    },
    
    clearError: () => set({ error: null }),
    
    clearCurrentOrder: () => set({ currentOrder: null }),
    
    // Get pending orders count
    getPendingOrdersCount: () => {
        const { pendingOrders } = get();
        return pendingOrders.length;
    },
    
    // Fetch pending orders count only
    fetchPendingOrdersCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/orders/pending-actions?limit=1`);
            const count = response.data.data.pagination?.totalOrders || response.data.data.pagination?.total || 0;
            return count;
        } catch (error) {
            console.error('Error fetching pending orders count:', error);
            // Fallback: try to get count from existing pending orders
            try {
                const fallbackResponse = await axios.get(`${API_URL}/admin/orders/pending-actions`);
                const count = fallbackResponse.data.data.pagination?.totalOrders || fallbackResponse.data.data.pagination?.total || fallbackResponse.data.data.orders?.length || 0;
                return count;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return 0;
            }
        }
    },
    
    // Helper function to get admin status color
    getAdminStatusColor: (status) => {
        const statusColors = {
            'order_received': 'text-blue-600 bg-blue-100',
            'order_preparing': 'text-orange-600 bg-orange-100',
            'order_prepared': 'text-purple-600 bg-purple-100',
            'order_placed': 'text-green-600 bg-green-100',
            'order_picked_up': 'text-indigo-600 bg-indigo-100',
            'order_completed': 'text-emerald-600 bg-emerald-100'
        };
        return statusColors[status] || 'text-gray-600 bg-gray-100';
    },
    
    // Helper function to get admin status icon
    getAdminStatusIcon: (status) => {
        const statusIcons = {
            'order_received': '📥',
            'order_preparing': '👨‍🍳',
            'order_prepared': '📦',
            'order_placed': '🚚',
            'order_picked_up': '📦',
            'order_completed': '✅'
        };
        return statusIcons[status] || '❓';
    },
    
    // Helper function to get admin status description
    getAdminStatusDescription: (status) => {
        const statusDescriptions = {
            'order_received': 'Order received and being reviewed',
            'order_preparing': 'Order is being prepared',
            'order_prepared': 'Order has been prepared and is ready',
            'order_placed': 'Order has been placed with delivery service',
            'order_picked_up': 'Order has been picked up',
            'order_completed': 'Order has been completed'
        };
        return statusDescriptions[status] || 'Unknown status';
    },
    
    // Helper function to get next possible status
    getNextStatus: (currentStatus) => {
        const statusFlow = {
            'order_received': 'order_preparing',
            'order_preparing': 'order_prepared',
            'order_prepared': 'order_placed', // This will trigger Lalamove placement
            'order_placed': 'order_picked_up',
            'order_picked_up': 'order_completed'
        };
        return statusFlow[currentStatus] || null;
    },
    
    // Helper function to check if order needs action
    needsAction: (order) => {
        if (order.paymentStatus !== 'paid') return false;
        
        if (order.shippingMethod === 'pickup') {
            return ['order_received', 'order_preparing', 'order_prepared'].includes(order.adminStatus);
        }
        
        if (order.shippingMethod === 'lalamove') {
            if (order.lalamoveDetails?.status === 'pending_placement') {
                return ['order_received', 'order_preparing', 'order_prepared'].includes(order.adminStatus);
            }
            return false;
        }
        
        return false;
    }
}));

export { useAdminOrderStore };
