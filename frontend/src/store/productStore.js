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
    
    createProduct: async (productData) => {
        set({ loading: true });
        try {
            const res = await axios.post(`${API_URL}/products`, productData);
            set((prevState) => ({
                products: [...prevState.products, res.data.product],
                loading: false,
            }));
        } catch (error) {
            toast.error(error.response.data.error);
            set({ loading: false });
        }
    },

    fetchProductByBarcode: async (barcode) => {
        if (!barcode || String(barcode).trim() === "") return null;
        set({ loading: true });
        try {
            const response = await axios.get(`${API_URL}/products/barcode/${encodeURIComponent(String(barcode).trim())}`);
            const product = response.data?.product;
            if (product) {
                set((prevState) => {
                    const exists = prevState.products.some((p) => p._id === product._id);
                    return { products: exists ? prevState.products.map(p => p._id===product._id?product:p) : [product, ...prevState.products], loading: false };
                });
            } else {
                set({ loading: false });
            }
            return product || null;
        } catch (error) {
            set({ loading: false });
            return null;
        }
    },

    fetchAllProducts: async (forceRefresh = false) => {
		const { loading, products } = get();
		
		// Prevent duplicate calls if already loading or products already exist (unless force refresh)
		if (loading || (!forceRefresh && products && products.length > 0)) {
			console.log("productStore: Skipping fetch - already loading or products exist");
			return;
		}
		
		set({ loading: true });
		try {
			console.log("productStore: Fetching products from API...");
			// Try to get all products for customers first, fallback to featured if not authenticated
			const response = await axios.get(`${API_URL}/products/all`);
			console.log("productStore: API response:", response.data);
			set({ products: response.data.products, loading: false });
			console.log("productStore: Products set in store:", response.data.products);
		} catch (error) {
			console.error("productStore: Error fetching products:", error);
			console.error("productStore: Error response:", error.response);
			console.error("productStore: Error status:", error.response?.status);
			console.error("productStore: Error data:", error.response?.data);
			
			// If unauthorized (401) or forbidden (403), fallback to featured products for guests
			if (error.response?.status === 401 || error.response?.status === 403) {
				console.log("productStore: Unauthorized access, falling back to featured products");
				try {
					const featuredResponse = await axios.get(`${API_URL}/products/featured`);
					set({ products: featuredResponse.data, loading: false });
					console.log("productStore: Loaded featured products for guest user");
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
			console.log("Error fetching featured products:", error);
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
			console.log("Error fetching categories:", error);
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
			} else {
				// Possibly trashed (deleted)
				set((prevState) => ({
					products: prevState.products.filter((p) => p._id !== productId),
					loading: false
				}));
				toast.success(response.data?.message || "Product removed");
			}
		} catch (error) {
			set({ loading: false });
			toast.error(error.response?.data?.message || "Failed to update product");
		}
	},

    }));