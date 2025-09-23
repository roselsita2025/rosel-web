import { create } from "zustand";
import axios from "axios";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000/api") + "/replacement-requests";

axios.defaults.withCredentials = true;

export const useReplacementRequestStore = create((set, get) => ({
    // State
    requests: [],
    currentRequest: null,
    stats: null,
    isLoading: false,
    error: null,
    message: null,
    pagination: null,

    // Customer Actions
    createReplacementRequest: async (requestData) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const response = await axios.post(`${API_URL}`, requestData);
            set({ 
                isLoading: false, 
                message: response.data.message,
                currentRequest: response.data.data
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to create replacement request" 
            });
            throw error;
        }
    },

    getCustomerRequests: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}`, { params });
            set({ 
                requests: response.data.data.requests,
                pagination: response.data.data.pagination,
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to fetch replacement requests" 
            });
            throw error;
        }
    },

    getRequestDetails: async (requestId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/${requestId}`);
            set({ 
                currentRequest: response.data.data,
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to fetch request details" 
            });
            throw error;
        }
    },

    cancelRequest: async (requestId) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const response = await axios.patch(`${API_URL}/${requestId}/cancel`);
            set({ 
                isLoading: false, 
                message: response.data.message,
                currentRequest: response.data.data
            });
            // Update the request in the list
            const requests = get().requests;
            const updatedRequests = requests.map(req => 
                req._id === requestId ? response.data.data : req
            );
            set({ requests: updatedRequests });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to cancel request" 
            });
            throw error;
        }
    },

    // Admin Actions
    getAllRequests: async (params = {}) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/all`, { params });
            set({ 
                requests: response.data.data.requests,
                pagination: response.data.data.pagination,
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to fetch replacement requests" 
            });
            throw error;
        }
    },

    getAdminRequestDetails: async (requestId) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/${requestId}`);
            set({ 
                currentRequest: response.data.data,
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to fetch request details" 
            });
            throw error;
        }
    },

    updateRequestStatus: async (requestId, updateData) => {
        set({ isLoading: true, error: null, message: null });
        try {
            const response = await axios.patch(`${API_URL}/admin/${requestId}/status`, updateData);
            set({ 
                isLoading: false, 
                message: response.data.message,
                currentRequest: response.data.data
            });
            // Update the request in the list
            const requests = get().requests;
            const updatedRequests = requests.map(req => 
                req._id === requestId ? response.data.data : req
            );
            set({ requests: updatedRequests });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to update request status" 
            });
            throw error;
        }
    },

    getRequestStats: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axios.get(`${API_URL}/admin/stats`);
            set({ 
                stats: response.data.data,
                isLoading: false 
            });
            return response.data;
        } catch (error) {
            set({ 
                isLoading: false, 
                error: error.response?.data?.message || "Failed to fetch request statistics" 
            });
            throw error;
        }
    },

    // Utility Functions
    getStatusColor: (status) => {
        const statusColors = {
            pending: 'bg-yellow-100 text-yellow-800',
            under_review: 'bg-blue-100 text-blue-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            processing: 'bg-purple-100 text-purple-800',
            shipped: 'bg-indigo-100 text-indigo-800',
            completed: 'bg-green-100 text-green-800',
            cancelled: 'bg-gray-100 text-gray-800'
        };
        return statusColors[status] || 'bg-gray-100 text-gray-800';
    },

    getPriorityColor: (priority) => {
        const priorityColors = {
            low: 'bg-green-100 text-green-800',
            medium: 'bg-yellow-100 text-yellow-800',
            high: 'bg-orange-100 text-orange-800',
            urgent: 'bg-red-100 text-red-800'
        };
        return priorityColors[priority] || 'bg-gray-100 text-gray-800';
    },

    getStatusIcon: (status) => {
        const statusIcons = {
            pending: '⏳',
            under_review: '👀',
            approved: '✅',
            rejected: '❌',
            processing: '⚙️',
            shipped: '📦',
            completed: '🎉',
            cancelled: '🚫'
        };
        return statusIcons[status] || '❓';
    },

    getReasonText: (reason) => {
        const reasonTexts = {
            defective: 'Defective Product',
            wrong_item: 'Wrong Item Received',
            damaged_during_shipping: 'Damaged During Shipping',
            quality_issue: 'Quality Issue',
            not_as_described: 'Not As Described',
            expired_product: 'Expired Product',
            other: 'Other'
        };
        return reasonTexts[reason] || reason;
    },

    // Clear functions
    clearError: () => set({ error: null }),
    clearMessage: () => set({ message: null }),
    
    // Get pending replacement requests count
    getPendingRequestsCount: () => {
        const { requests } = get();
        return requests.filter(request => 
            request.status === 'pending' || request.status === 'under_review'
        ).length;
    },
    
    // Fetch pending replacement requests count only
    fetchPendingRequestsCount: async () => {
        try {
            const response = await axios.get(`${API_URL}/admin/all?status=pending&limit=1`);
            const pendingCount = response.data.data.pagination?.totalRequests || response.data.data.pagination?.totalOrders || response.data.data.pagination?.total || 0;
            
            // Also get under_review count
            const underReviewResponse = await axios.get(`${API_URL}/admin/all?status=under_review&limit=1`);
            const underReviewCount = underReviewResponse.data.data.pagination?.totalRequests || underReviewResponse.data.data.pagination?.totalOrders || underReviewResponse.data.data.pagination?.total || 0;
            
            const totalCount = pendingCount + underReviewCount;
            return totalCount;
        } catch (error) {
            console.error('Error fetching pending replacement requests count:', error);
            // Fallback: try to get count from existing requests
            try {
                const fallbackResponse = await axios.get(`${API_URL}/admin/all`);
                const count = fallbackResponse.data.data.requests?.filter(request => 
                    request.status === 'pending' || request.status === 'under_review'
                ).length || 0;
                return count;
            } catch (fallbackError) {
                console.error('Fallback also failed:', fallbackError);
                return 0;
            }
        }
    },
    clearCurrentRequest: () => set({ currentRequest: null }),
    clearRequests: () => set({ requests: [], pagination: null }),

    // Reset store
    reset: () => set({
        requests: [],
        currentRequest: null,
        stats: null,
        isLoading: false,
        error: null,
        message: null,
        pagination: null
    })
}));
