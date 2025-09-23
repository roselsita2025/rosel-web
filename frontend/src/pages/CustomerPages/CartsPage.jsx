import { cartStore } from "../../store/cartStore.js";

import CartItem from "../../components/CustomerComponents/CartItem.jsx";
import PeopleAlsoBought from "../../components/GuestComponents/PeopleAlsoBought.jsx";
import OrderSummary from "../../components/CustomerComponents/OrderSummary.jsx";

import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";




const CartsPage = () => {
    const {cart} = cartStore();
    const {isAuthenticated, user} = useAuthStore();
    const navigate = useNavigate();
  return (
    <div className='min-h-screen'>
		{/* Main Cart Section - White Background */}
		<div className='pt-24 pb-8 md:pt-32 md:pb-16 bg-white'>
			<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
				{/* Back to Products Link */}
				<motion.div
					className='mb-8'
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5 }}
				>
					<Link
						to='/products'
						className='inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 text-[#860809]'
					>
						<ArrowLeft size={16} />
						Back to Products
					</Link>
				</motion.div>

				{cart.length === 0 ? (
					<EmptyCartUI />
				) : (
					<>
						{/* Main Two-Part Section */}
						<div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
							{/* Left Side - Cart Items */}
							<motion.div
								className='lg:col-span-2'
								initial={{ opacity: 0, x: -20 }}
								animate={{ opacity: 1, x: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
							>
								<div className='space-y-4'>
									<h2 className='text-2xl font-bold text-[#860809]'>
										Your Cart ({cart.length} {cart.length === 1 ? 'item' : 'items'})
									</h2>
									<div className='space-y-4'>
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
				className='py-16 bg-[#f8f3ed]'
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
			>
				<div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
					<PeopleAlsoBought />
				</div>
			</motion.section>
		)}
	</div>
  );
};

export default CartsPage;

const EmptyCartUI = () => (
	<motion.div
		className='flex flex-col items-center justify-center space-y-4 py-16'
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
	>
		<ShoppingCart className='h-24 w-24 text-[#a31f17]' />
		<h3 className='text-2xl font-semibold text-[#030105]'>Your cart is empty</h3>
		<p className='text-[#a31f17]'>Looks like you {"haven't"} added anything to your cart yet.</p>
		<Link
			className='mt-4 rounded-md px-6 py-2 text-white transition-colors hover:opacity-90 bg-[#860809]'
			to='/products'
		>
			Start Shopping
		</Link>
	</motion.div>
);