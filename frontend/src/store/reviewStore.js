import { create } from 'zustand';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

export const useReviewStore = create((set, get) => ({
  // State
  reviews: [],
  randomReviews: [],
  stats: null,
  pagination: null,
  isLoading: false,
  isSubmitting: false,
  error: null,
  message: null,

  // Actions
  fetchReviews: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.rating) queryParams.append('rating', params.rating);
      if (params.product) queryParams.append('product', params.product);
      if (params.search) queryParams.append('search', params.search);
      
      const response = await axios.get(`${API_URL}/reviews?${queryParams.toString()}`);
      
      set({ 
        reviews: response.data.data.reviews,
        pagination: response.data.data.pagination,
        isLoading: false 
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch reviews',
        isLoading: false 
      });
      throw error;
    }
  },

  fetchRandomReviews: async (limit = 3) => {
    try {
      const response = await axios.get(`${API_URL}/reviews/random?limit=${limit}`);
      
      set({ 
        randomReviews: response.data.data,
        error: null 
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching random reviews:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch random reviews',
        randomReviews: []
      });
      throw error;
    }
  },

  fetchStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/reviews/stats`);
      
      set({ 
        stats: response.data.data,
        error: null 
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching review stats:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch review statistics',
        stats: null
      });
      throw error;
    }
  },

  submitReview: async (reviewData) => {
    set({ isSubmitting: true, error: null, message: null });
    try {
      const response = await axios.post(`${API_URL}/reviews`, reviewData);
      
      set({ 
        message: response.data.message,
        isSubmitting: false 
      });
      
      // Refresh reviews and stats after successful submission
      get().fetchReviews();
      get().fetchStats();
      get().fetchRandomReviews();
      
      return response.data;
    } catch (error) {
      console.error('Error submitting review:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to submit review',
        isSubmitting: false 
      });
      throw error;
    }
  },

  deleteReview: async (reviewId) => {
    try {
      const response = await axios.delete(`${API_URL}/reviews/${reviewId}`);
      
      set({ 
        message: response.data.message,
        error: null 
      });
      
      // Refresh reviews and stats after successful deletion
      get().fetchReviews();
      get().fetchStats();
      get().fetchRandomReviews();
      
      return response.data;
    } catch (error) {
      console.error('Error deleting review:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to delete review',
      });
      throw error;
    }
  },

  fetchUserReviews: async (userId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`${API_URL}/reviews/user/${userId}`);
      
      set({ 
        reviews: response.data.data,
        isLoading: false 
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      set({ 
        error: error.response?.data?.message || 'Failed to fetch user reviews',
        isLoading: false 
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
  clearMessage: () => set({ message: null }),

  // Helper function to get rating distribution for display
  getRatingDistribution: () => {
    const { stats } = get();
    if (!stats || !stats.ratingDistribution) {
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
    return stats.ratingDistribution;
  },

  // Helper function to get average rating
  getAverageRating: () => {
    const { stats } = get();
    return stats?.averageRating || 0;
  },

  // Helper function to get total reviews count
  getTotalReviews: () => {
    const { stats } = get();
    return stats?.totalReviews || 0;
  }
}));
