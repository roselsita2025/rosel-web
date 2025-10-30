import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { cartStore } from "../../store/cartStore";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || import.meta.env.STRIPE_PUBLISHABLE_KEY);

const PaymentPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const { cart, clearCart, coupon: cartCoupon, isCouponApplied: cartIsCouponApplied } = cartStore();

    const [checkoutData, setCheckoutData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'customer') {
            navigate('/');
            return;
        }

        const savedCheckoutData = sessionStorage.getItem('checkoutData');
        if (!savedCheckoutData) {
            toast.error('Checkout information not found. Please start over.');
            navigate('/carts');
            return;
        }

        setCheckoutData(JSON.parse(savedCheckoutData));
    }, [isAuthenticated, user, navigate]);

    const handlePayment = async () => {
        if (!checkoutData) {
            toast.error('Checkout data not found');
            return;
        }

        setIsProcessing(true);
        setPaymentError(null);

        try {
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe failed to load. Please check your internet connection and try again.');
            }

            const subtotal = checkoutData.cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || item.quantity)), 0);
            const taxAmount = 0;
            const voucherDiscount = checkoutData.coupon ? 
                (checkoutData.coupon.type === 'percent' ? subtotal * (checkoutData.coupon.amount / 100) : Math.min(checkoutData.coupon.amount, subtotal)) : 
                0;
            const deliveryFee = checkoutData.selectedShipping === 'lalamove' && checkoutData.lalamoveQuote 
                ? parseFloat(
                    checkoutData.lalamoveQuote.quotation?.priceBreakdown?.total || 
                    checkoutData.lalamoveQuote.quotation?.total || 
                    checkoutData.lalamoveQuote.quotation?.price || 
                    checkoutData.lalamoveQuote.quotation?.data?.priceBreakdown?.total ||
                    checkoutData.lalamoveQuote.quotation?.data?.total ||
                    0
                ) 
                : 0;
            const correctTotal = subtotal - voucherDiscount + deliveryFee;

            const paymentData = {
                products: checkoutData.cart,
                couponCode: (checkoutData.coupon?.code || cartCoupon?.code) || null,
                shippingInfo: checkoutData.shippingInfo,
                shippingMethod: checkoutData.selectedShipping,
                lalamoveQuote: checkoutData.lalamoveQuote,
                finalTotal: correctTotal,
                taxAmount: taxAmount,
                subtotal: subtotal
            };

            console.log('Payment data being sent:', paymentData);

            const response = await axios.post(`${API_URL}/payments/create-checkout-session`, paymentData, {
                timeout: 30000 // 30 second timeout
            });
            
            console.log('Payment response:', response.data);

            if (response.data.success && response.data.id) {
                const result = await stripe.redirectToCheckout({
                    sessionId: response.data.id,
                });

                if (result.error) {
                    throw new Error(result.error.message);
                }
            } else {
                throw new Error(response.data.message || response.data.error || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response?.data,
                status: error.response?.status
            });
            
            let errorMessage = 'Payment failed. Please try again.';
            
            if (error.code === 'ECONNABORTED') {
                errorMessage = 'Request timeout. Please check your connection and try again.';
            } else if (error.response?.data?.error) {
                errorMessage = error.response.data.error;
            } else if (error.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error.message) {
                errorMessage = error.message;
            }
            
            setPaymentError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleBackToShipping = () => {
        navigate('/shipping-options');
    };

    if (!isAuthenticated || user?.role !== 'customer' || !checkoutData) {
        return null;
    }

    const { shippingInfo, selectedShipping, lalamoveQuote, finalTotal, cart: cartItems, coupon: checkoutCoupon, isCouponApplied: checkoutIsCouponApplied } = checkoutData;
    
    const coupon = checkoutCoupon || cartCoupon;
    const isCouponApplied = checkoutIsCouponApplied || cartIsCouponApplied;
    
    console.log('Payment page coupon data:', { 
        checkoutCoupon, 
        checkoutIsCouponApplied, 
        cartCoupon, 
        cartIsCouponApplied, 
        finalCoupon: coupon, 
        finalIsCouponApplied: isCouponApplied 
    });
    const subtotal = cartItems.reduce((sum, item) => sum + ((item.unitPrice || item.price) * (item.cartQuantity || item.quantity)), 0);
    const taxAmount = 0;
    const deliveryFee = selectedShipping === 'lalamove' && lalamoveQuote 
        ? parseFloat(
            lalamoveQuote.quotation?.priceBreakdown?.total || 
            lalamoveQuote.quotation?.total || 
            lalamoveQuote.quotation?.price || 
            lalamoveQuote.quotation?.data?.priceBreakdown?.total ||
            lalamoveQuote.quotation?.data?.total ||
            0
        ) 
        : 0;
    
    const voucherDiscount = coupon ? 
        (coupon.type === 'percent' ? subtotal * (coupon.amount / 100) : Math.min(coupon.amount, subtotal)) : 
        0;
    const calculatedDiscount = subtotal - (finalTotal - deliveryFee);
    const hasDiscount = calculatedDiscount > 0 || voucherDiscount > 0;

    return (
        <div className='min-h-screen pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8 md:pb-12 lg:pb-16 bg-[#f8f3ed]'>
            <div className='mx-auto max-w-screen-xl px-3 sm:px-4 md:px-6 lg:px-8 2xl:px-0'>
                {/* Header */}
                <motion.div
                    className='mb-4 sm:mb-6 md:mb-8'
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={handleBackToShipping}
                        className='inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80 mb-3 sm:mb-4 text-[#860809] font-alice'
                    >
                        <ArrowLeft className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                        Back to Shipping Options
                    </button>
                    
                    <h1 className='text-2xl sm:text-3xl font-bold text-[#860809] font-libre'>
                        Payment
                    </h1>
                    <p className='text-xs sm:text-sm mt-1.5 sm:mt-2 text-[#a31f17] font-alice'>
                        Step 3 of 3 - Complete your order
                    </p>
                </motion.div>

                <div className='grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3'>
                    {/* Left Side - Order Details */}
                    <motion.div
                        className='lg:col-span-2 space-y-4 sm:space-y-6'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Shipping Information */}
                        <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#860809] font-libre'>
                                Shipping Information
                            </h2>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6'>
                                <div>
                                    <h3 className='text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>Contact</h3>
                                    <div className='space-y-1 text-xs sm:text-sm text-[#030105] font-libre'>
                                        <div className='break-all'>{shippingInfo.email}</div>
                                        <div>{shippingInfo.phone}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className='text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 text-[#a31f17] font-alice'>Delivery Address</h3>
                                    <div className='text-xs sm:text-sm text-[#030105] font-libre'>
                                        <div>{shippingInfo.firstName} {shippingInfo.lastName}</div>
                                        <div>{shippingInfo.address}</div>
                                        <div>{shippingInfo.barangay}, {shippingInfo.city}</div>
                                        <div>{shippingInfo.province} {shippingInfo.postalCode}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Method */}
                        <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#860809] font-libre'>
                                Shipping Method
                            </h2>
                            
                            <div className='flex items-center justify-between gap-3 p-3 sm:p-4 rounded-lg bg-[#f8f3ed]'>
                                <div className='flex items-center gap-2 sm:gap-3 flex-1 min-w-0'>
                                    <div className='w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-[#860809] flex-shrink-0'>
                                        {selectedShipping === 'pickup' ? (
                                            <CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-white' />
                                        ) : (
                                            <CheckCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 text-white' />
                                        )}
                                    </div>
                                    <div className='flex-1 min-w-0'>
                                        <h3 className='font-medium text-[#030105] font-alice text-sm sm:text-base'>
                                            {selectedShipping === 'pickup' ? 'Pick Up in Store' : 'Lalamove Delivery'}
                                        </h3>
                                        <p className='text-xs sm:text-sm text-[#a31f17] font-libre truncate'>
                                            {selectedShipping === 'pickup' 
                                                ? 'Free pickup at our location' 
                                                : `${lalamoveQuote?.serviceType} • ${lalamoveQuote?.distance?.toFixed(1) || 0}km`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className='text-right flex-shrink-0'>
                                    <div className='font-semibold text-[#860809] font-libre text-sm sm:text-base'>
                                        {selectedShipping === 'pickup' 
                                            ? 'FREE' 
                                            : `₱${deliveryFee.toFixed(2)}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#860809] font-libre'>
                                Order Items
                            </h2>
                            
                            <div className='space-y-3 sm:space-y-4'>
                                {cartItems.map((item) => {
                                    const itemPrice = item.unitPrice || item.price;
                                    const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
                                    
                                    return (
                                        <div key={`${item._id}-${item.weightOptionId || 'default'}`} className='flex items-center gap-2 sm:gap-3 md:gap-4 p-2.5 sm:p-3 rounded-lg bg-[#f8f3ed]'>
                                            <img 
                                                src={item.image} 
                                                alt={item.name}
                                                className='w-14 h-14 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0'
                                            />
                                            <div className='flex-1 min-w-0'>
                                                <h3 className='font-medium text-[#030105] font-alice text-sm sm:text-base'>{item.name}{weightInfo}</h3>
                                                <p className='text-xs sm:text-sm text-[#a31f17] font-libre'>
                                                    Quantity: {item.cartQuantity || item.quantity} • ₱{itemPrice.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} each
                                                </p>
                                            </div>
                                            <div className='text-right flex-shrink-0'>
                                                <div className='font-semibold text-[#860809] font-libre text-sm sm:text-base'>
                                                    ₱{(itemPrice * (item.cartQuantity || item.quantity)).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Payment Summary */}
                    <motion.div
                        className='space-y-4 sm:space-y-6'
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-[#860809] font-libre'>
                                Payment Summary
                            </h2>
                            
                            <div className='space-y-2.5 sm:space-y-3'>
                                {/* Products */}
                                <div className='space-y-1.5 sm:space-y-2'>
                                    <h3 className='text-xs sm:text-sm font-medium text-[#a31f17] font-alice'>Products</h3>
                                    {cartItems.map((item) => {
                                        const itemPrice = item.unitPrice || item.price; // Use unitPrice for weight-based products
                                        const itemTotal = itemPrice * (item.cartQuantity || item.quantity);
                                        const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
                                        
                                        return (
                                            <div key={`${item._id}-${item.weightOptionId || 'default'}`} className='flex justify-between text-xs sm:text-sm gap-2'>
                                                <span className='text-[#030105] font-alice flex-1 min-w-0'>
                                                    {item.name}{weightInfo} × {item.cartQuantity || item.quantity}
                                                </span>
                                                <span className='text-[#030105] font-libre flex-shrink-0'>₱{itemTotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Subtotal */}
                                <div className='flex justify-between text-xs sm:text-sm gap-2'>
                                    <span className='text-[#030105] font-alice'>subtotal</span>
                                    <span className='text-[#030105] font-libre flex-shrink-0'>₱{subtotal.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                </div>

                                {/* Tax removed */}

                                {/* Voucher */}
                                {voucherDiscount > 0 ? (
                                    <div className='flex justify-between text-xs sm:text-sm gap-2'>
                                        <span className='text-[#030105] font-alice'>
                                            voucher {coupon ? `(${coupon.code})` : ''}
                                        </span>
                                        <span className='text-green-600 font-libre flex-shrink-0'>
                                            -₱{voucherDiscount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ) : null}

                                {/* Subtotal after discount */}
                                {voucherDiscount > 0 ? (
                                    <div className='flex justify-between text-xs sm:text-sm gap-2'>
                                        <span className='text-[#030105] font-alice'>subtotal</span>
                                        <span className='text-[#030105] font-libre flex-shrink-0'>
                                            ₱{(subtotal - voucherDiscount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ) : null}

                                {/* Shipping */}
                                <div className='flex justify-between text-xs sm:text-sm gap-2'>
                                    <span className='text-[#030105] font-alice'>shipping</span>
                                    <span className='text-[#030105] font-libre flex-shrink-0'>
                                        {selectedShipping === 'pickup' ? 'FREE' : `₱${deliveryFee.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                    </span>
                                </div>

                                {/* Total */}
                                <div className='border-t border-gray-300 pt-2 sm:pt-3'>
                                    <div className='flex justify-between font-semibold text-base sm:text-lg gap-2'>
                                        <span className='text-[#030105] font-alice'>total</span>
                                        <span className='text-[#860809] font-libre flex-shrink-0'>
                                            ₱{(subtotal - voucherDiscount + deliveryFee).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className='rounded-lg border border-gray-300 p-4 sm:p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                <CreditCard className='w-4 h-4 sm:w-5 sm:h-5' />
                                Payment Method
                            </h2>
                            
                            <div className='space-y-2.5 sm:space-y-3'>
                                <div className='p-3 sm:p-4 rounded-lg border-2 border-blue-200 bg-blue-50'>
                                    <div className='flex items-center gap-2 sm:gap-3'>
                                        <CreditCard className='w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0' style={{ color: '#1e40af' }} />
                                        <div className='flex-1 min-w-0'>
                                            <h3 className='font-medium text-[#1e40af] font-alice text-sm sm:text-base'>Credit/Debit Card</h3>
                                            <p className='text-xs sm:text-sm text-[#1e3a8a] font-libre'>
                                                Secure payment powered by Stripe
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className='text-xs text-[#a31f17] font-libre'>
                                    You will be redirected to Stripe's secure payment page to complete your purchase.
                                </div>
                            </div>
                        </div>

                        {/* Error Message */}
                        {paymentError && (
                            <div className='rounded-lg border border-red-300 p-3 sm:p-4 bg-red-50'>
                                <div className='flex items-center gap-2'>
                                    <AlertCircle className='w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0' style={{ color: '#ef4444' }} />
                                    <span className='text-xs sm:text-sm font-medium text-red-600 font-alice'>
                                        Payment Error
                                    </span>
                                </div>
                                <p className='text-xs sm:text-sm mt-1 text-red-600 font-libre'>
                                    {paymentError}
                                </p>
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className='w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 rounded-lg text-white font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-4 disabled:opacity-50 bg-[#860809] font-alice text-sm sm:text-base'
                        >
                            {isProcessing ? (
                                <>
                                    <Loader className='w-4 h-4 sm:w-5 sm:h-5 animate-spin' />
                                    <span className='hidden sm:inline'>Processing Payment...</span>
                                    <span className='sm:hidden'>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <CreditCard className='w-4 h-4 sm:w-5 sm:h-5' />
                                    <span className='hidden sm:inline'>Pay ₱{(subtotal - voucherDiscount + deliveryFee).toFixed(2)}</span>
                                    <span className='sm:hidden'>Pay ₱{(subtotal - voucherDiscount + deliveryFee).toFixed(2)}</span>
                                </>
                            )}
                        </button>

                        {/* Security Notice */}
                        <div className='text-center text-xs text-[#a31f17] font-libre'>
                            <div className='flex items-center justify-center gap-2 mb-1'>
                                <CheckCircle className='w-3 h-3 sm:w-3.5 sm:h-3.5' />
                                <span className='font-alice'>Secure SSL encrypted payment</span>
                            </div>
                            <div className='font-alice'>Your payment information is safe and secure</div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
