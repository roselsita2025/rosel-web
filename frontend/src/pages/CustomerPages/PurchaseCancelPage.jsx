import { XCircle, ArrowLeft, RefreshCw, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import axiosInstance from "../../lib/axios";

const PurchaseCancelPage = () => {
	const [searchParams] = useSearchParams();
	const sessionId = searchParams.get('session_id');

	// Clean up temporary order when component mounts
	useEffect(() => {
		const cleanupCancelledPayment = async () => {
			if (sessionId) {
				try {
					console.log('Cleaning up cancelled payment for session:', sessionId);
					await axiosInstance.post('/api/payment/cancel', { sessionId });
					console.log('Payment cancellation cleanup completed');
				} catch (error) {
					console.error('Error cleaning up cancelled payment:', error);
					// Don't show error to user as this is background cleanup
				}
			}
		};

		cleanupCancelledPayment();
	}, [sessionId]);

	return (
		<div className='min-h-screen pt-24 pb-8 md:pt-32 md:pb-16' style={{ backgroundColor: '#f8f3ed' }}>
			<div className='max-w-4xl mx-auto px-4'>
				{/* Header Section */}
				<motion.div
					initial={{ opacity: 0, y: -20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6 }}
					className='text-center mb-12'
				>
					<div className='flex justify-center mb-6'>
						<div className='relative'>
							<div 
								className='w-24 h-24 rounded-full flex items-center justify-center shadow-lg'
								style={{ backgroundColor: '#901414' }}
							>
								<XCircle className='w-12 h-12' style={{ color: '#feffff' }} />
							</div>
							{/* Decorative ring */}
							<div 
								className='absolute inset-0 rounded-full border-4 opacity-20'
								style={{ borderColor: '#ffd901' }}
							></div>
						</div>
					</div>
					<h1 
						className='text-4xl md:text-5xl font-bold mb-4'
						style={{ color: '#901414' }}
					>
						Purchase Cancelled
					</h1>
					<p 
						className='text-lg md:text-xl max-w-2xl mx-auto'
						style={{ color: '#82695b' }}
					>
						Your order has been cancelled. No charges have been made to your account.
					</p>
				</motion.div>

				{/* Main Content Card */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.2 }}
					className='bg-white rounded-2xl shadow-xl overflow-hidden mb-8'
					style={{ backgroundColor: '#feffff' }}
				>
					{/* Card Header */}
					<div 
						className='px-8 py-6 border-b'
						style={{ borderColor: '#f8f3ed' }}
					>
						<h2 
							className='text-2xl font-semibold text-center'
							style={{ color: '#901414' }}
						>
							What happened?
						</h2>
					</div>

					{/* Card Content */}
					<div className='px-8 py-8'>
						<div className='grid md:grid-cols-2 gap-8'>
							{/* Left Column - Information */}
							<div className='space-y-6'>
								<div className='flex items-start gap-4'>
									<div 
										className='w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
										style={{ backgroundColor: '#f8f3ed' }}
									>
										<XCircle size={20} style={{ color: '#901414' }} />
									</div>
									<div>
										<h3 
											className='font-semibold mb-2'
											style={{ color: '#901414' }}
										>
											Payment Cancelled
										</h3>
										<p 
											className='text-sm'
											style={{ color: '#82695b' }}
										>
											You chose to cancel the payment process. No money has been charged to your account.
										</p>
									</div>
								</div>

								<div className='flex items-start gap-4'>
									<div 
										className='w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
										style={{ backgroundColor: '#f8f3ed' }}
									>
										<RefreshCw size={20} style={{ color: '#901414' }} />
									</div>
									<div>
										<h3 
											className='font-semibold mb-2'
											style={{ color: '#901414' }}
										>
											Try Again
										</h3>
										<p 
											className='text-sm'
											style={{ color: '#82695b' }}
										>
											You can always return to your cart and complete your purchase when you're ready.
										</p>
									</div>
								</div>
							</div>

							{/* Right Column - Support */}
							<div 
								className='p-6 rounded-xl'
								style={{ backgroundColor: '#f8f3ed' }}
							>
								<div className='flex items-center gap-3 mb-4'>
									<MessageCircle size={24} style={{ color: '#901414' }} />
									<h3 
										className='text-lg font-semibold'
										style={{ color: '#901414' }}
									>
										Need Help?
									</h3>
								</div>
								<p 
									className='text-sm mb-4'
									style={{ color: '#82695b' }}
								>
									If you encountered any issues during checkout or have questions about your order, 
									our support team is here to help.
								</p>
								<Link
									to="/contactus"
									className='inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors hover:opacity-90'
									style={{ backgroundColor: '#901414', color: '#feffff' }}
								>
									<MessageCircle size={16} />
									Contact Support
								</Link>
							</div>
						</div>
					</div>
				</motion.div>

				{/* Action Buttons */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
					className='flex flex-col sm:flex-row gap-4 justify-center'
				>
					<Link
						to="/carts"
						className='flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg'
						style={{ backgroundColor: '#ffd901', color: '#901414' }}
					>
						<RefreshCw size={20} />
						Return to Cart
					</Link>
					
					<Link
						to="/products"
						className='flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg'
						style={{ backgroundColor: '#901414', color: '#feffff' }}
					>
						<ArrowLeft size={20} />
						Continue Shopping
					</Link>
				</motion.div>

				{/* Footer Message */}
				<motion.div
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.6, delay: 0.6 }}
					className='text-center mt-12'
				>
					<p 
						className='text-sm'
						style={{ color: '#82695b' }}
					>
						Thank you for considering Rosel Frozen Meats. We hope to serve you soon!
					</p>
				</motion.div>
			</div>
		</div>
	);
};

export default PurchaseCancelPage;