import { create } from 'zustand';
import axios from '../lib/axios';

const useDiscrepancyStore = create((set, get) => ({
    // State
    analytics: null,
    writeOffs: [],
    discrepancyDetails: [],
    pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        hasNextPage: false,
        hasPrevPage: false
    },
    loading: false,
    error: null,

    // Actions
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    // Fetch analytics data
    fetchAnalytics: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/analytics/discrepancy?${queryParams}`);
            
            if (response.data.success) {
                set({ analytics: response.data.data });
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch analytics');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Fetch write-offs
    fetchWriteOffs: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/write-offs?${queryParams}`);
            
            if (response.data.success) {
                set({ 
                    writeOffs: response.data.data.writeOffs,
                    pagination: response.data.data.pagination
                });
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch write-offs');
            }
        } catch (error) {
            console.error('Error fetching write-offs:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Create write-off
    createWriteOff: async (writeOffData) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.post('/write-offs', writeOffData);
            
            if (response.data.success) {
                // Refresh the write-offs list
                const currentParams = get().getCurrentParams();
                await get().fetchWriteOffs(currentParams);
                
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to create write-off');
            }
        } catch (error) {
            console.error('Error creating write-off:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Update write-off
    updateWriteOff: async (writeOffId, updateData) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.put(`/write-offs/${writeOffId}`, updateData);
            
            if (response.data.success) {
                // Update the write-off in the list
                set(state => ({
                    writeOffs: state.writeOffs.map(writeOff => 
                        writeOff._id === writeOffId 
                            ? { ...writeOff, ...response.data.data }
                            : writeOff
                    )
                }));
                
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to update write-off');
            }
        } catch (error) {
            console.error('Error updating write-off:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Delete write-off
    deleteWriteOff: async (writeOffId) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.delete(`/write-offs/${writeOffId}`);
            
            if (response.data.success) {
                // Remove the write-off from the list
                set(state => ({
                    writeOffs: state.writeOffs.filter(writeOff => writeOff._id !== writeOffId)
                }));
                
                return true;
            } else {
                throw new Error(response.data.message || 'Failed to delete write-off');
            }
        } catch (error) {
            console.error('Error deleting write-off:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Get write-off analytics
    getWriteOffAnalytics: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/write-offs/analytics?${queryParams}`);
            
            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch write-off analytics');
            }
        } catch (error) {
            console.error('Error fetching write-off analytics:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Get write-off trends
    getWriteOffTrends: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/write-offs/trends?${queryParams}`);
            
            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch write-off trends');
            }
        } catch (error) {
            console.error('Error fetching write-off trends:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Get write-offs by category
    getWriteOffByCategory: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/write-offs/by-category?${queryParams}`);
            
            if (response.data.success) {
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch category data');
            }
        } catch (error) {
            console.error('Error fetching category data:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Get discrepancy details
    getDiscrepancyDetails: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/analytics/discrepancy/details?${queryParams}`);
            
            if (response.data.success) {
                set({ discrepancyDetails: response.data.data.details });
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch discrepancy details');
            }
        } catch (error) {
            console.error('Error fetching discrepancy details:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Fetch discrepancy details (wrapper function)
    fetchDiscrepancyDetails: async (params = {}) => {
        try {
            set({ loading: true, error: null });
            
            const queryParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await axios.get(`/analytics/discrepancy/details?${queryParams}`);
            
            if (response.data.success) {
                set({ 
                    discrepancyDetails: response.data.data.details,
                    pagination: response.data.data.pagination
                });
                return response.data.data;
            } else {
                throw new Error(response.data.message || 'Failed to fetch discrepancy details');
            }
        } catch (error) {
            console.error('Error fetching discrepancy details:', error);
            set({ error: error.message });
            throw error;
        } finally {
            set({ loading: false });
        }
    },

    // Helper function to get current params (for refreshing data)
    getCurrentParams: () => {
        // This would need to be implemented based on how you want to track current filters
        return {};
    },

    // Clear all data
    clearData: () => set({
        analytics: null,
        writeOffs: [],
        pagination: {
            currentPage: 1,
            totalPages: 0,
            totalItems: 0,
            hasNextPage: false,
            hasPrevPage: false
        },
        error: null
    }),

    // Reset loading and error states
    reset: () => set({
        loading: false,
        error: null
    })
}));

export { useDiscrepancyStore };
