import {create} from "zustand";
import {toast} from "react-hot-toast";
import axios from "axios";

const API_URL= import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

// Guest cart helpers
const GUEST_CART_KEY = "guest_cart";

const readGuestCart = () => {
	try {
		const raw = localStorage.getItem(GUEST_CART_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch (_) {
		return [];
	}
};

const writeGuestCart = (cart) => {
	try {
		localStorage.setItem(GUEST_CART_KEY, JSON.stringify(cart));
	} catch (_) {
		// ignore
	}
};

export const cartStore = create((set, get) => ({
	cart: [],
	coupon: null,
	total: 0,
	subtotal: 0,
	isCouponApplied: false,

	getMyCoupon: async () => {
		// No-op under global, admin-distributed coupons; kept for backward compatibility
		try { await axios.get(`${API_URL}/coupons`); } catch (_) {}
	},

	applyCoupon: async (code) => {
		try {
			const { subtotal } = get();
			const response = await axios.post(`${API_URL}/coupons/validate`, { code, subtotal });
			set({ coupon: response.data, isCouponApplied: true });
			get().calculateTotals();
		} catch (error) {
			// Handle unauthorized access gracefully for guests
			if (error?.response?.status === 401) {
				// User not authenticated, coupon validation not available for guests
			}
			throw error; // Re-throw to let the component handle the error
		}
	},

	removeCoupon: () => {
		set({ coupon: null, isCouponApplied: false });
		get().calculateTotals();
	},

	getCartItems: async () => {
		try {
			const res = await axios.get(`${API_URL}/carts`);
			set({cart: res.data});
			get().calculateTotals();
		} catch (error) {
			// Fallback to guest cart for unauthorized users or server not available
			if (error?.response?.status === 401 || error?.response?.status === 404) {
				const guestCart = readGuestCart();
				set({ cart: guestCart });
				get().calculateTotals();
			} else {
				console.error("Cart: Error fetching cart items:", error);
				// For other errors, still try to load guest cart
				const guestCart = readGuestCart();
				set({ cart: guestCart });
				get().calculateTotals();
			}
		}
	},

    addToCart: async (product) => {
        
        // Check if product is in stock
        if (product.quantity <= 0) {
            return { status: 'out_of_stock' };
        }

        // Check if adding this item would exceed available stock
        const existingItem = get().cart.find((item) => item._id === product._id);
        const currentCartQuantity = existingItem ? (existingItem.cartQuantity || existingItem.quantity) : 0;
        
        if (currentCartQuantity >= product.quantity) {
            return { status: 'maxed' };
        }

        try {
            await axios.post(`${API_URL}/carts`, { productId: product._id });
            set((prevState) => {
                const existingItem = prevState.cart.find((item) => item._id === product._id);
                const newCart = existingItem
                    ? prevState.cart.map((item) =>
                            item._id === product._id ? { ...item, cartQuantity: (item.cartQuantity || item.quantity) + 1 } : item
                      )
                    : [...prevState.cart, { ...product, cartQuantity: 1, stockQuantity: product.quantity }];
                return { cart: newCart };
            });

            get().calculateTotals();
            return { status: 'success' };
        } catch (error) {
            // Unauthorized or server not available -> guest cart fallback
            if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
                set((prevState) => {
                    const existingItemLocal = prevState.cart.find((item) => item._id === product._id);
                    const newCart = existingItemLocal
                        ? prevState.cart.map((item) =>
                        item._id === product._id ? { ...item, cartQuantity: (item.cartQuantity || item.quantity) + 1 } : item
                          )
                        : [...prevState.cart, { ...product, cartQuantity: 1, stockQuantity: product.quantity }];
                    writeGuestCart(newCart);
                    return { cart: newCart };
                });
                get().calculateTotals();
                return { status: 'success' };
            } else {
                // Error adding product to cart
                return { status: 'error', message: error?.response?.data?.message || 'Error adding product to cart' };
            }
        }
    },

	clearCart: async () => {
		set({ cart: [], coupon: null, total: 0, subtotal: 0 });
		writeGuestCart([]);
	},

	removeFromCart: async (productId) => {
		try {
			await axios.delete(`${API_URL}/carts`, { data: { productId } });
			set((prevState) => ({ cart: prevState.cart.filter((item) => item._id !== productId) }));
			get().calculateTotals();
		} catch (error) {
			if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
				set((prevState) => {
					const newCart = prevState.cart.filter((item) => item._id !== productId);
					writeGuestCart(newCart);
					return { cart: newCart };
				});
				get().calculateTotals();
			} else {
				toast.error(error.response?.data?.message || "Error removing item from cart");
			}
		}
	},

	updateQuantity: async (productId, quantity) => {
			if (quantity === 0) {
				get().removeFromCart(productId);
				return;
			}

			// Find the product to check stock
			const product = get().cart.find((item) => item._id === productId);
			if (product && quantity > (product.stockQuantity || product.quantity)) {
				toast.error("Cannot add more items. Not enough stock available");
				return;
			}

			try {
				await axios.put(`${API_URL}/carts/${productId}`, { quantity });
				set((prevState) => ({
					cart: prevState.cart.map((item) => (item._id === productId ? { ...item, cartQuantity: quantity } : item)),
				}));
				get().calculateTotals();
			} catch (error) {
				if (error?.response?.status === 401 || error?.response?.status === 403 || error?.response?.status === 404) {
					set((prevState) => {
						const newCart = prevState.cart.map((item) => (item._id === productId ? { ...item, cartQuantity: quantity } : item));
						writeGuestCart(newCart);
						return { cart: newCart };
					});
					get().calculateTotals();
				} else {
					toast.error(error.response?.data?.message || "Error updating quantity");
				}
			}
		},

		calculateTotals: () => {
			const { cart, coupon } = get();
			const subtotal = cart.reduce((sum, item) => sum + item.price * (item.cartQuantity || item.quantity), 0);
			let total = subtotal;
			
			if (coupon && get().isCouponApplied) {
				if (coupon.type === 'percent') {
					const discount = subtotal * ((coupon.amount || 0) / 100);
					total = subtotal - discount;
				} else if (coupon.type === 'fixed') {
					const discount = Math.min(coupon.amount || 0, subtotal);
					total = subtotal - discount;
				}
			}
			
			set({ subtotal, total });
		},

	// Merge guest cart items into server after login
	mergeGuestCartToServer: async () => {
		const guestCart = readGuestCart();
		if (!guestCart || guestCart.length === 0) return;
		try {
			for (const item of guestCart) {
				// Post item.cartQuantity times to keep server-side API unchanged
				for (let i = 0; i < (item.cartQuantity || item.quantity || 1); i++) {
					await axios.post(`${API_URL}/carts`, { productId: item._id });
				}
			}
			// Clear guest cart and refresh server cart
			writeGuestCart([]);
			await get().getCartItems();
		} catch (error) {
			console.error("Error merging guest cart:", error);
		}
	}
		
}));