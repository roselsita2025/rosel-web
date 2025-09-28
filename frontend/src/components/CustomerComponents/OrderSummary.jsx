import { motion } from "framer-motion";
import { cartStore } from "../../store/cartStore";
import { MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { useState } from "react";
import toast from "react-hot-toast";
import axios from "axios";
const OrderSummary = ({ hideActions = false }) => {
  
    const {total, subtotal, cart} = cartStore();
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();
    const [isValidatingStock, setIsValidatingStock] = useState(false);

    const formattedSubtotal = subtotal.toFixed(2);
    const formattedTotal = total.toFixed(2);

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  
	const handleCheckout = async () => {
		// Require login and customer role for checkout
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}
		if (user?.role === 'admin') {
			return;
		}

		// Validate stock before proceeding to checkout
		setIsValidatingStock(true);
		try {
			await validateStockBeforeCheckout();
			// Navigate to Information page for checkout process
			navigate('/information');
		} catch (error) {
			console.error('Stock validation failed:', error);
			// Error message is already shown by validateStockBeforeCheckout
		} finally {
			setIsValidatingStock(false);
		}
	};

	const validateStockBeforeCheckout = async () => {
		try {
			// Get fresh product data for all items in cart
			const productIds = cart.map(item => item._id);
			const response = await axios.get(`${API_URL}/products/batch`, {
				params: { ids: productIds.join(',') }
			});

			const products = response.data.products || response.data;
			const stockIssues = [];

			// Check each cart item against current stock
			for (const cartItem of cart) {
				const product = products.find(p => p._id === cartItem._id);
				if (!product) {
					stockIssues.push({
						name: cartItem.name,
						issue: 'Product no longer available'
					});
					continue;
				}

				const cartQuantity = cartItem.cartQuantity || cartItem.quantity;
				
				if (product.quantity <= 0) {
					stockIssues.push({
						name: cartItem.name,
						issue: 'Out of stock'
					});
				} else if (cartQuantity > product.quantity) {
					stockIssues.push({
						name: cartItem.name,
						issue: `Only ${product.quantity} available (you have ${cartQuantity} in cart)`
					});
				}
			}

			// If there are stock issues, show error and prevent checkout
			if (stockIssues.length > 0) {
				const errorMessage = stockIssues.length === 1 
					? `${stockIssues[0].name}: ${stockIssues[0].issue}`
					: `Stock issues found:\n${stockIssues.map(issue => `• ${issue.name}: ${issue.issue}`).join('\n')}`;
				
				toast.error(errorMessage, { duration: 5000 });
				throw new Error('Stock validation failed');
			}

		} catch (error) {
			if (error.response?.status === 404) {
				// Batch endpoint not available, try individual requests
				await validateStockIndividually();
			} else {
				throw error;
			}
		}
	};

	const validateStockIndividually = async () => {
		const stockIssues = [];

		for (const cartItem of cart) {
			try {
				const response = await axios.get(`${API_URL}/products/${cartItem._id}`);
				const product = response.data;

				const cartQuantity = cartItem.cartQuantity || cartItem.quantity;
				
				if (product.quantity <= 0) {
					stockIssues.push({
						name: cartItem.name,
						issue: 'Out of stock'
					});
				} else if (cartQuantity > product.quantity) {
					stockIssues.push({
						name: cartItem.name,
						issue: `Only ${product.quantity} available (you have ${cartQuantity} in cart)`
					});
				}
			} catch (error) {
				stockIssues.push({
					name: cartItem.name,
					issue: 'Unable to verify stock'
				});
			}
		}

		if (stockIssues.length > 0) {
			const errorMessage = stockIssues.length === 1 
				? `${stockIssues[0].name}: ${stockIssues[0].issue}`
				: `Stock issues found:\n${stockIssues.map(issue => `• ${issue.name}: ${issue.issue}`).join('\n')}`;
			
			toast.error(errorMessage, { duration: 5000 });
			throw new Error('Stock validation failed');
		}
	};

    return (
        <motion.div
			className='space-y-4 rounded-lg border border-gray-300 p-4 shadow-md sm:p-6 bg-[#fffefc]'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
		>
            <p className='text-xl font-bold text-[#860809] font-libre'>Order Summary</p>

            <div className='space-y-4'>
                {/* Item Breakdown */}
                <div className='space-y-3'>
                    <h4 className='text-sm font-medium text-[#a31f17] font-alice'>Items ({cart.length})</h4>
                    <div className='space-y-2 max-h-48 overflow-y-auto'>
                        {cart.map((item) => {
                            const itemQuantity = item.cartQuantity || item.quantity;
                            const itemTotal = item.price * itemQuantity;
                            return (
                                <div key={item._id} className='flex items-center justify-between text-sm'>
                                    <div className='flex-1 min-w-0'>
                                        <p className='font-medium truncate text-[#030105] font-alice'>
                                            {item.name}
                                        </p>
                                        <p className='text-xs text-[#a31f17] font-libre'>
                                            {itemQuantity} × ₱{item.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <div className='ml-2 font-medium text-[#030105] font-libre'>
                                        ₱{itemTotal.toFixed(2)}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className='space-y-2 border-t border-[#860809] pt-3'>
                    <dl className='flex items-center justify-between gap-4'>
                        <dt className='text-base font-normal text-[#a31f17] font-alice'>Subtotal</dt>
							<dd className='text-base font-medium text-[#030105] font-libre'>₱{formattedSubtotal}</dd>
                    </dl>

                    <dl className='flex items-center justify-between gap-4 border-t border-[#860809] pt-2'>
							<dt className='text-base font-bold text-[#030105] font-alice'>Total</dt>
							<dd className='text-base font-bold text-[#860809] font-libre'>₱{formattedTotal}</dd>
					</dl>

                </div>

                {!hideActions && (
                    <>
                        <motion.button
                            className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors focus:outline-none focus:ring-4 focus:ring-[#a31f17] font-alice ${
                                isValidatingStock || cart.length === 0 || user?.role === 'admin'
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#860809] hover:opacity-90'
                            }`}
                            whileHover={!isValidatingStock && cart.length > 0 && user?.role !== 'admin' ? { scale: 1.05 } : {}}
                            whileTap={!isValidatingStock && cart.length > 0 && user?.role !== 'admin' ? { scale: 0.95 } : {}}
                            onClick={handleCheckout}
                            disabled={isValidatingStock || cart.length === 0 || user?.role === 'admin'}
                        >
                            {isValidatingStock ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Checking Stock...
                                </>
                            ) : (
                                'Proceed to Checkout'
                            )}
                        </motion.button>
                        
                        <div className='flex items-center justify-center gap-2'>
                            <span className='text-sm font-normal text-[#a31f17] font-libre'>or</span>
                            <Link
                                to='/products'
                                className='inline-flex items-center gap-2 text-sm font-medium underline transition-colors hover:opacity-80 text-[#860809] font-alice'
                            >
                                Continue Shopping
                                <MoveRight size={16} />
                            </Link>
                        </div>
                    </>
                )}

            </div>

        </motion.div>
    )
}

export default OrderSummary