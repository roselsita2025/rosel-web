import { create } from 'zustand';

const usePOSStore = create((set, get) => ({
  // State
  loading: false,
  error: null,
  recentTransactions: [],

  // Actions
  createTransaction: async (transactionData) => {
    set({ loading: true, error: null });
    
    try {
      // Creating transaction
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pos/transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(transactionData),
      });

      // Response received

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        throw new Error(`Server error: Received ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to process transaction');
      }

      set({ loading: false });
      return { success: true, data: data.data };
    } catch (error) {
      console.error('POS Transaction Error:', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to process transaction' 
      });
      return { success: false, error: error.message };
    }
  },

  getRecentTransactions: async (limit = 10, timeframe = null, date = null, start = null, end = null) => {
    set({ loading: true, error: null });
    
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      
      if (timeframe) {
        params.append('timeframe', timeframe);
        
        if (timeframe === 'custom') {
          if (date) {
            params.append('date', date);
          } else if (start && end) {
            params.append('start', start);
            params.append('end', end);
          }
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pos/transactions?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
      });

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Received HTML instead of JSON:', text.substring(0, 200));
        throw new Error(`Server error: Received ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transactions');
      }

      set({ 
        loading: false, 
        recentTransactions: data.data 
      });
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get Transactions Error:', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to fetch transactions' 
      });
      return { success: false, error: error.message };
    }
  },

  getTransaction: async (transactionId) => {
    set({ loading: true, error: null });
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/pos/transaction/${transactionId}`, {
        method: 'GET',
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transaction');
      }

      set({ loading: false });
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Get Transaction Error:', error);
      set({ 
        loading: false, 
        error: error.message || 'Failed to fetch transaction' 
      });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),
}));

export { usePOSStore };
