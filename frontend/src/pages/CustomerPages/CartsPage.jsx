import { cartStore } from "../../store/cartStore.js";

import CartItem from "../../components/CustomerComponents/CartItem.jsx";
import PeopleAlsoBought from "../../components/GuestComponents/PeopleAlsoBought.jsx";
import OrderSummary from "../../components/CustomerComponents/OrderSummary.jsx";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import Footer from "../../components/Footer";




const CartsPage = () => {
    const {cart} = cartStore();
    const {isAuthenticated, user} = useAuthStore();
    const navigate = useNavigate();
  return (
    <div className='min-h-screen'>
		{/* Main Cart Section - White Background */}
		<div className='pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 md:pb-12 lg:pb-16 bg-white'>
			<div className='mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-0'>
				{/* Back to Products Link */}
				<motion.div
					className='mb-4 sm:mb-6 md:mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Link
						to='/products'
						className='inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80 text-[#860809]'
					>
						<ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
						Back to Products
					</Link>
				</motion.div>

				{cart.length === 0 ? (
					<EmptyCartUI />
				) : (
					<>
						{/* Main Two-Part Section */}
						<div className='grid grid-cols-1 gap-4 sm:gap-6 md:gap-8 lg:grid-cols-3'>
							{/* Left Side - Cart Items */}
							<motion.div
								className='lg:col-span-2'
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								<div className='space-y-3 sm:space-y-4'>
									<h2 className='text-xl sm:text-2xl font-bold text-[#860809]'>
										Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
									</h2>
									<div className='space-y-3 sm:space-y-4'>
										{cart.map((item) => (
											<CartItem key={item._id} item={item} />
										))}
									</div>
								</div>
							</motion.div>

							{/* Right Side - Order Summary */}
							<motion.div
								className='space-y-6'
								initial={{ opacity: 0, x: 20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.4 }}
							>
								<OrderSummary />
							</motion.div>
						</div>
					</>
				)}
			</div>
		</div>

		{/* People Also Bought Section - Separate Section with Light Background */}
		{cart.length > 0 && (
			<motion.section 
				className='py-8 sm:py-12 md:py-16 bg-[#f8f3ed]'
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
			>
				<div className='mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-0'>
					<PeopleAlsoBought />
				</div>
			</motion.section>
		)}
		
		{/* Footer */}
		<Footer />
	</div>
  );
};

export default CartsPage;

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center space-y-3 sm:space-y-4 py-10 sm:py-12 md:py-16'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<ShoppingCart className='h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-[#a31f17]' />
		<h3 className='text-xl sm:text-2xl font-semibold text-[#030105]'>Your cart is empty</h3>
		<p className='text-[#a31f17] text-sm sm:text-base text-center px-4'>Looks like you {"haven't"} added anything to your cart yet.</p>
		<Link
			className='mt-2 sm:mt-4 rounded-md px-4 sm:px-6 py-1.5 sm:py-2 text-white transition-colors hover:opacity-90 bg-[#860809] text-sm sm:text-base'
			to='/products'
		>
			Start Shopping
		</Link>
	</motion.div>
);