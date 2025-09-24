import { ArrowRight, CheckCircle, HandHeart, Package, Clock, Mail, Truck } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cartStore } from "../../store/cartStore";
import axios from "axios";
import Confetti from "react-confetti";

const API_URL= import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

const PurchaseSuccessPage = () => {
    const [isProcessing, setIsProcessing] = useState(true);
    const {clearCart} = cartStore();
    const [error, setError] = useState(null);
    const [orderDetails, setOrderDetails] = useState(null);
    const hasProcessed = useRef(false);

	useEffect(() => {
		const handleCheckoutSuccess = async (sessionId) => {
			// Prevent double processing
			if (hasProcessed.current) {
				console.log("Session already processed, skipping...");
				setIsProcessing(false);
				return;
			}

			hasProcessed.current = true;

			try {
				const response = await axios.post(`${API_URL}/payments/checkout-success`, {
					sessionId,
				});
				clearCart();
				// Store order details if available
				if (response.data.orderId) {
					// Fetch complete order details including shipping method and Lalamove details
					const orderResponse = await axios.get(`${API_URL}/orders/tracking/${response.data.orderId}`);
					if (orderResponse.data.success) {
						setOrderDetails(orderResponse.data.data);
					} else {
						setOrderDetails({ orderId: response.data.orderId });
					}
				}
			} catch (error) {
				console.log(error);
				// Reset the flag on error so user can retry
				hasProcessed.current = false;
			} finally {
				setIsProcessing(false);
			}
		};

		const sessionId = new URLSearchParams(window.location.search).get("session_id");
		if (sessionId) {
			handleCheckoutSuccess(sessionId);
		} else {
			setIsProcessing(false);
			setError("No session ID found in the URL");
		}
	}, []); // Remove clearCart dependency to prevent re-runs

    if (isProcessing) {
        return (
            <div className='min-h-screen pt-24 pb-8 md:pt-32 md:pb-16 flex items-center justify-center' style={{ backgroundColor: '#f8f3ed' }}>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4' style={{ borderColor: '#901414' }}></div>
                    <p className='text-lg' style={{ color: '#82695b' }}>Processing your order...</p>
                </div>
            </div>
        );
    }

	if (error) {
        return (
            <div className='min-h-screen pt-24 pb-8 md:pt-32 md:pb-16 flex items-center justify-center' style={{ backgroundColor: '#f8f3ed' }}>
                <div className='text-center'>
                    <p className='text-lg text-red-600'>Error: {error}</p>
                </div>
            </div>
        );
    }

  return (
    <div className='min-h-screen pt-24 pb-8 md:pt-32 md:pb-16' style={{ backgroundColor: '#f8f3ed' }}>
        <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            gravity={0.1}
            style={{ zIndex: 99 }}
            numberOfPieces={700}
            recycle={false}
        />

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
                            <CheckCircle className='w-12 h-12' style={{ color: '#feffff' }} />
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
                    Purchase Successful!
                </h1>
                <p 
                    className='text-lg md:text-xl max-w-2xl mx-auto'
                    style={{ color: '#82695b' }}
                >
                    Thank you for your order! We're processing it now and will send you updates.
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
                        Order Confirmation
                    </h2>
                </div>

                {/* Card Content */}
                <div className='px-8 py-8'>
                    <div className='grid md:grid-cols-2 gap-8'>
                        {/* Left Column - Order Details */}
                        <div className='space-y-6'>
                            <div className='flex items-start gap-4'>
                                <div 
                                    className='w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
                                    style={{ backgroundColor: '#f8f3ed' }}
                                >
                                    <Package size={20} style={{ color: '#901414' }} />
                                </div>
                                <div>
                                    <h3 
                                        className='font-semibold mb-2'
                                        style={{ color: '#901414' }}
                                    >
                                        Order Processed
                                    </h3>
                                    <p 
                                        className='text-sm'
                                        style={{ color: '#82695b' }}
                                    >
                                        Your order has been successfully placed and is being prepared.
                                    </p>
                                </div>
                            </div>

                            <div className='flex items-start gap-4'>
                                <div 
                                    className='w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0'
                                    style={{ backgroundColor: '#f8f3ed' }}
                                >
                                    <Mail size={20} style={{ color: '#901414' }} />
                                </div>
                                <div>
                                    <h3 
                                        className='font-semibold mb-2'
                                        style={{ color: '#901414' }}
                                    >
                                        Email Confirmation
                                    </h3>
                                    <p 
                                        className='text-sm'
                                        style={{ color: '#82695b' }}
                                    >
                                        Check your email for order details and tracking information.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Order Info */}
                        <div 
                            className='p-6 rounded-xl'
                            style={{ backgroundColor: '#f8f3ed' }}
                        >
                            <h3 
                                className='text-lg font-semibold mb-4'
                                style={{ color: '#901414' }}
                            >
                                Order Information
                            </h3>
                            <div className='space-y-3'>
                                <div className='flex items-center justify-between'>
                                    <span 
                                        className='text-sm'
                                        style={{ color: '#82695b' }}
                                    >
                                        Order Number:
                                    </span>
                                    <span 
                                        className='text-sm font-semibold'
                                        style={{ color: '#901414' }}
                                    >
                                        {orderDetails?.orderNumber ? `#${orderDetails.orderNumber}` : '#PROCESSING'}
                                    </span>
                                </div>
                                <div className='flex items-center justify-between'>
                                    <span 
                                        className='text-sm'
                                        style={{ color: '#82695b' }}
                                    >
                                        Status:
                                    </span>
                                    <span 
                                        className='text-sm font-semibold'
                                        style={{ color: '#901414' }}
                                    >
                                        Processing
                                    </span>
                                </div>
                                {/* Only show estimated delivery for Lalamove orders */}
                                {orderDetails?.shippingMethod === 'lalamove' && orderDetails?.lalamoveDetails?.duration && (
                                    <div className='flex items-center justify-between'>
                                        <span 
                                            className='text-sm'
                                            style={{ color: '#82695b' }}
                                        >
                                            Estimated Delivery:
                                        </span>
                                        <span 
                                            className='text-sm font-semibold'
                                            style={{ color: '#901414' }}
                                        >
                                            {Math.ceil(orderDetails.lalamoveDetails.duration / 60)} minutes
                                        </span>
                                    </div>
                                )}
                            </div>
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
                    to="/track-orders"
                    className='flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg'
                    style={{ backgroundColor: '#901414', color: '#feffff' }}
                >
                    <Package size={20} />
                    Track Your Orders
                </Link>
                
                <Link
                    to="/products"
                    className='flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg'
                    style={{ backgroundColor: '#ffd901', color: '#901414' }}
                >
                    <ArrowRight size={20} />
                    Continue Shopping
                </Link>
            </motion.div>

            {/* Thank You Message */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className='text-center mt-12'
            >
                <p 
                    className='text-lg font-medium'
                    style={{ color: '#901414' }}
                >
                    Thank you for choosing Rosel Frozen Meats!
                </p>
                <p 
                    className='text-sm mt-2'
                    style={{ color: '#82695b' }}
                >
                    We appreciate your trust and look forward to serving you again.
                </p>
            </motion.div>
        </div>
    </div>
  )
}

export default PurchaseSuccessPage