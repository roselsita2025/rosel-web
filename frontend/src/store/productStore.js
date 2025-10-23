import {create} from "zustand";
import toast from "react-hot-toast";
import axios from "axios";

const API_URL= import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

export const productStore = create((set, get) => ({
    products: [],
    categories: [],
    loading: false,
    searchResults: [],
    suggestions: [],
    lastScannedBarcode: "",
    
    setProducts: (products) => set({ products }),
    setLastScannedBarcode: (code) => set({ lastScannedBarcode: code }),
    
    // Validation helpers
    checkNameExists: (name, excludeProductId = null) => {
        const { products } = get();
        const trimmedName = String(name || '').trim().toLowerCase();
        if (!trimmedName) return false;
        return products.some(p => 
            p.name.toLowerCase() === trimmedName && 
            p._id !== excludeProductId
        );
    },
    
    checkBarcodeExists: (barcode, excludeProductId = null) => {
        const { products } = get();
        const trimmedBarcode = String(barcode || '').trim();
        if (!trimmedBarcode) return false;
        return products.some(p => 
            p.barcode && 
            p.barcode === trimmedBarcode && 
            p._id !== excludeProductId
        );
    },
    
    checkWeightOptionBarcodeExists: (barcode, excludeProductId = null, excludeWeightOptionId = null) => {
        const { products } = get();
        const trimmedBarcode = String(barcode || '').trim();
        if (!trimmedBarcode) return false;
        
        // Check in all products' weight options
        for (const product of products) {
            if (product._id === excludeProductId) {
                // For the same product, check excluding the specific weight option
                if (product.weightOptions && Array.isArray(product.weightOptions)) {
                    const conflict = product.weightOptions.some(opt => 
                        opt.barcode === trimmedBarcode && 
                        String(opt._id) !== String(excludeWeightOptionId)
                    );
                    if (conflict) return true;
                }
            } else {
                // For other products, check all weight options
                if (product.weightOptions && Array.isArray(product.weightOptions)) {
                    const conflict = product.weightOptions.some(opt => 
                        opt.barcode === trimmedBarcode
                    );
                    if (conflict) return true;
                }
            }
        }
        
        // Also check if it conflicts with any product-level barcode
        return products.some(p => 
            p.barcode === trimmedBarcode && 
            p._id !== excludeProductId
        );
    },
    
    createProduct: async (productData) => {
        set({ loading: true });
        try {
            const res = await axios.post(`${API_URL}/products`, productData);
            set((prevState) => ({
                products: [...prevState.products, res.data.product],
                loading: false,
            }));
            return { success: true, product: res.data.product };
        } catch (error) {
            set({ loading: false });
            const errorMessage = error.response?.data?.message || error.response?.data?.error || "Failed to create product";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    fetchProductByBarcode: async (barcode) => {
        if (!barcode || String(barcode).trim() === "") return null;
        set({ loading: true });
        try {
            const response = await axios.get(`${API_URL}/products/barcode/${encodeURIComponent(String(barcode).trim())}`);
            const product = response.data?.product;
            const matchedWeightOptionId = response.data?.matchedWeightOptionId || null;
            
            if (product) {
                set((prevState) => {
                    const exists = prevState.products.some((p) => p._id === product._id);
                    return { 
                        products: exists 
                            ? prevState.products.map(p => p._id === product._id ? product : p) 
                            : [product, ...prevState.products], 
                        loading: false 
                    };
                });
            } else {
                set({ loading: false });
            }
            
            // Return both product and matchedWeightOptionId
            return product ? { product, matchedWeightOptionId } : null;
        } catch (error) {
            set({ loading: false });
            return null;
        }
    },

    fetchAllProducts: async (forceRefresh = false) => {
		const { loading, products } = get();
		
		// Prevent duplicate calls if already loading or products already exist (unless force refresh)
		if (loading || (!forceRefresh && products && products.length > 0)) {
			// Skipping fetch - already loading or products exist
			return;
		}
		
		set({ loading: true });
		try {
			// Try to get all products for customers first, fallback to featured if not authenticated
			const response = await axios.get(`${API_URL}/products/all`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			console.error("productStore: Error fetching products:", error);
			console.error("productStore: Error response:", error.response);
			console.error("productStore: Error status:", error.response?.status);
			console.error("productStore: Error data:", error.response?.data);
			
			// If unauthorized (401) or forbidden (403), fallback to featured products for guests
			if (error.response?.status === 401 || error.response?.status === 403) {
				try {
					const featuredResponse = await axios.get(`${API_URL}/products/featured`);
					set({ products: featuredResponse.data, loading: false });
				} catch (featuredError) {
					console.error("productStore: Error fetching featured products:", featuredError);
					set({ error: "Failed to fetch products", loading: false });
					toast.error("Failed to load products");
				}
			} else {
				set({ error: "Failed to fetch products", loading: false });
				toast.error(error.response?.data?.error || error.message || "Failed to fetch products");
			}
		}
    },

    refreshProducts: async () => {
        // Force refresh products by calling fetchAllProducts with forceRefresh = true
        return get().fetchAllProducts(true);
    },

	fetchProductsByCategory: async (category) => {
		set({ loading: true });
		try {
			const response = await axios.get(`${API_URL}/products/category/${category}`);
			set({ products: response.data.products, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			toast.error(error.response.data.error || "Failed to fetch products");
		}
	},

    deleteProduct: async (productId) => {
		set({ loading: true });
		try {
			await axios.delete(`${API_URL}/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.filter((product) => product._id !== productId),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to delete product");
		}
	},

    toggleFeaturedProduct: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.patch(`${API_URL}/products/${productId}`);
			set((prevProducts) => ({
				products: prevProducts.products.map((product) =>
					product._id === productId ? { ...product, isFeatured: response.data.isFeatured } : product
				),
				loading: false,
			}));
		} catch (error) {
			set({ loading: false });
			toast.error(error.response.data.error || "Failed to update product");
		}
    },
        
    fetchFeaturedProducts: async () => {
		set({ loading: true });
		try {
			const response = await axios.get(`${API_URL}/products/featured`);
			set({ products: response.data, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch products", loading: false });
			// Error fetching featured products
		}
	},

    searchProducts: async ({ q = "", category = "", minPrice = "", maxPrice = "", inStock = "", sort = "createdAt", order = "desc", page = 1, limit = 20 } = {}) => {
        set({ loading: true });
        try {
            const params = new URLSearchParams();
            if (q) params.append("q", q);
            if (category) params.append("category", category);
            if (minPrice !== "" && minPrice !== null) params.append("minPrice", minPrice);
            if (maxPrice !== "" && maxPrice !== null) params.append("maxPrice", maxPrice);
            if (inStock !== "") params.append("inStock", inStock);
            if (sort) params.append("sort", sort);
            if (order) params.append("order", order);
            if (page) params.append("page", page);
            if (limit) params.append("limit", limit);

            const response = await axios.get(`${API_URL}/products/search?${params.toString()}`);
            set({ searchResults: response.data.products || [], loading: false });
            return response.data;
        } catch (error) {
            set({ loading: false });
            toast.error(error.response?.data?.message || "Failed to search products");
            throw error;
        }
    },

    fetchSuggestions: async (q, limit = 5) => {
        if (!q || q.trim() === "") {
            set({ suggestions: [] });
            return [];
        }
        try {
            const params = new URLSearchParams({ q, limit: String(limit) });
            const response = await axios.get(`${API_URL}/products/suggest?${params.toString()}`);
            const suggestions = response.data?.suggestions || [];
            set({ suggestions });
            return suggestions;
        } catch (error) {
            // Silent fail for suggestions
            return [];
        }
    },

	fetchAllCategories: async () => {
		set({ loading: true });
		try {
			const response = await axios.get(`${API_URL}/products/categories`);
			set({ categories: response.data.categories, loading: false });
		} catch (error) {
			set({ error: "Failed to fetch categories", loading: false });
			// Error fetching categories
		}
	},

	fetchProductById: async (productId) => {
		set({ loading: true });
		try {
			const response = await axios.get(`${API_URL}/products/${productId}`);
			// Add the single product to the products array if not already present
			set((prevState) => {
				const existingProduct = prevState.products.find(p => p._id === productId);
				if (!existingProduct) {
					return {
						products: [...prevState.products, response.data.product],
						loading: false
					};
				}
				return { loading: false };
			});
		} catch (error) {
			set({ error: "Failed to fetch product", loading: false });
			toast.error(error.response?.data?.error || "Failed to fetch product");
		}
	},

	updateProductQuantity: async (productId, quantity) => {
		set({ loading: true });
		try {
			const response = await axios.put(`${API_URL}/products/quantity/update`, {
				productId,
				quantity
			});
			set((prevState) => ({
				products: prevState.products.map((product) =>
					product._id === productId ? response.data.product : product
				),
				loading: false
			}));
			toast.success(response.data.message);
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update quantity");
		}
	},

	addProductQuantity: async (productId, quantityToAdd) => {
		set({ loading: true });
		try {
			const response = await axios.put(`${API_URL}/products/quantity/add`, {
				productId,
				quantityToAdd
			});
			set((prevState) => ({
				products: prevState.products.map((product) =>
					product._id === productId ? response.data.product : product
				),
				loading: false
			}));
			toast.success(response.data.message);
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to add quantity");
		}
	},

	removeProductQuantity: async (productId, quantityToRemove, reason = null) => {
		set({ loading: true });
		try {
			const response = await axios.put(`${API_URL}/products/quantity/remove`, {
				productId,
				quantityToRemove,
				reason
			});
			set((prevState) => ({
				products: prevState.products.map((product) =>
					product._id === productId ? response.data.product : product
				),
				loading: false
			}));
			toast.success(response.data.message);
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to remove quantity");
		}
	},

	updateProduct: async (productId, payload) => {
		set({ loading: true });
		try {
			const response = await axios.put(`${API_URL}/products/${productId}`, payload);
			if (response.data?.product) {
				set((prevState) => ({
					products: prevState.products.map((product) =>
						product._id === productId ? response.data.product : product
					),
					loading: false
				}));
				toast.success("Product updated");
				return { success: true, product: response.data.product };
			} else {
				// Possibly trashed (deleted)
				set((prevState) => ({
					products: prevState.products.filter((p) => p._id !== productId),
					loading: false
				}));
				toast.success(response.data?.message || "Product removed");
				return { success: true };
			}
		} catch (error) {
			set({ loading: false });
			const errorMessage = error.response?.data?.message || "Failed to update product";
			toast.error(errorMessage);
			return { success: false, error: errorMessage };
		}
	},

    // ==================== Weight Options (Admin) ====================
    addWeightOption: async (productId, { weightKg, stockUnits, barcode }) => {
        set({ loading: true });
        try {
            const payload = { weightKg, stockUnits };
            if (barcode && barcode.trim()) {
                payload.barcode = barcode.trim();
            }
            
            const response = await axios.post(`${API_URL}/products/${productId}/weights`, payload);
            const updated = response.data?.product;
            if (updated) {
                set((prevState) => ({
                    products: prevState.products.map((p) => (p._id === productId ? updated : p)),
                    loading: false,
                }));
                toast.success("Weight option added");
                return { success: true };
            } else {
                set({ loading: false });
                return { success: false };
            }
        } catch (error) {
            set({ loading: false });
            const errorMessage = error.response?.data?.message || "Failed to add weight option";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    // ==================== Base Price Per Kg (Admin) ====================
    updateBasePricePerKg: async (productId, basePricePerKg) => {
        set({ loading: true });
        try {
            const response = await axios.patch(`${API_URL}/products/${productId}/base-price`, { basePricePerKg });
            const updated = response.data?.product;
            if (updated) {
                set((prevState) => ({
                    products: prevState.products.map((p) => (p._id === productId ? updated : p)),
                    loading: false,
                }));
            } else {
                set({ loading: false });
            }
        } catch (error) {
            set({ loading: false });
            throw error;
        }
    },

    updateWeightOptionStock: async (productId, weightOptionId, newStockUnits) => {
        set({ loading: true });
        try {
            const response = await axios.patch(`${API_URL}/products/${productId}/weights/${weightOptionId}`, { stockUnits: newStockUnits });
            const updated = response.data?.product;
            if (updated) {
                set((prevState) => ({
                    products: prevState.products.map((p) => (p._id === productId ? updated : p)),
                    loading: false,
                }));
                toast.success("Stock updated");
                return { success: true };
            } else {
                set({ loading: false });
                return { success: false };
            }
        } catch (error) {
            set({ loading: false });
            const errorMessage = error.response?.data?.message || "Failed to update stock";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },
    
    updateWeightOption: async (productId, weightOptionId, updates) => {
        set({ loading: true });
        try {
            const payload = {};
            if (typeof updates.weightKg !== 'undefined') payload.weightKg = updates.weightKg;
            if (typeof updates.stockUnits !== 'undefined') payload.stockUnits = updates.stockUnits;
            if (typeof updates.barcode !== 'undefined') {
                payload.barcode = updates.barcode && updates.barcode.trim() ? updates.barcode.trim() : undefined;
            }
            
            const response = await axios.patch(`${API_URL}/products/${productId}/weights/${weightOptionId}`, payload);
            const updated = response.data?.product;
            if (updated) {
                set((prevState) => ({
                    products: prevState.products.map((p) => (p._id === productId ? updated : p)),
                    loading: false,
                }));
                toast.success("Weight option updated");
                return { success: true };
            } else {
                set({ loading: false });
                return { success: false };
            }
        } catch (error) {
            set({ loading: false });
            const errorMessage = error.response?.data?.message || "Failed to update weight option";
            toast.error(errorMessage);
            return { success: false, error: errorMessage };
        }
    },

    }));