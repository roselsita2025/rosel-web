import { create } from 'zustand';
import axios from '../lib/axios';

const useDiscrepancyStore = create((set, get) => ({
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

    createWriteOff: async (writeOffData) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.post('/write-offs', writeOffData);
            
            if (response.data.success) {
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

    updateWriteOff: async (writeOffId, updateData) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.put(`/write-offs/${writeOffId}`, updateData);
            
            if (response.data.success) {
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

    deleteWriteOff: async (writeOffId) => {
        try {
            set({ loading: true, error: null });
            
            const response = await axios.delete(`/write-offs/${writeOffId}`);
            
            if (response.data.success) {
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

    getCurrentParams: () => {
        return {};
    },

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

    reset: () => set({
        loading: false,
        error: null
    })
}));

export { useDiscrepancyStore };
