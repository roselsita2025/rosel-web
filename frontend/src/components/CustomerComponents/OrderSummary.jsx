import { motion } from "framer-motion";
import { cartStore } from "../../store/cartStore";
import { MoveRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
const OrderSummary = ({ hideActions = false }) => {
  
    const {total, subtotal, cart} = cartStore();
    const { user, isAuthenticated } = useAuthStore();
    const navigate = useNavigate();

    const formattedSubtotal = subtotal.toFixed(2);
    const formattedTotal = total.toFixed(2);
  
	const handleCheckout = () => {
		// Require login and customer role for checkout
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}
		if (user?.role === 'admin') {
			return;
		}
		// Navigate to Information page for checkout process
		navigate('/information');
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
                            className='flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#a31f17] bg-[#860809] font-alice'
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCheckout}
                            disabled={cart.length === 0 || user?.role === 'admin'}
                        >
                            Proceed to Checkout
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