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

    // State
    const [checkoutData, setCheckoutData] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentError, setPaymentError] = useState(null);

    useEffect(() => {
        // Redirect if not authenticated or not customer
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'customer') {
            navigate('/');
            return;
        }

        // Load checkout data from sessionStorage
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
            // Calculate correct total including tax
            const subtotal = checkoutData.cart.reduce((sum, item) => sum + (item.price * (item.cartQuantity || item.quantity)), 0);
            const taxRate = 0.12; // 12% tax
            const taxAmount = subtotal * taxRate;
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
            const correctTotal = subtotal + taxAmount - voucherDiscount + deliveryFee;

            // Prepare payment data
            const paymentData = {
                products: checkoutData.cart,
                couponCode: checkoutData.coupon?.code || null,
                shippingInfo: checkoutData.shippingInfo,
                shippingMethod: checkoutData.selectedShipping,
                lalamoveQuote: checkoutData.lalamoveQuote,
                finalTotal: correctTotal,
                taxAmount: taxAmount,
                subtotal: subtotal
            };

            console.log('Payment data being sent:', paymentData);

            // Create checkout session with Stripe
            const stripe = await stripePromise;
            const response = await axios.post(`${API_URL}/payments/create-checkout-session`, paymentData);
            
            console.log('Payment response:', response.data);

            if (response.data.success) {
                const session = response.data;
                
                // Redirect to Stripe Checkout
                const result = await stripe.redirectToCheckout({
                    sessionId: session.id,
                });

                if (result.error) {
                    setPaymentError(result.error.message);
                    toast.error('Payment failed: ' + result.error.message);
                }
            } else {
                throw new Error(response.data.message || 'Failed to create payment session');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setPaymentError(error.response?.data?.message || error.message || 'Payment failed');
            toast.error('Payment failed. Please try again.');
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
    
    // Use checkout data first, fallback to cart store
    const coupon = checkoutCoupon || cartCoupon;
    const isCouponApplied = checkoutIsCouponApplied || cartIsCouponApplied;
    
    // Debug log to check coupon data
    console.log('Payment page coupon data:', { 
        checkoutCoupon, 
        checkoutIsCouponApplied, 
        cartCoupon, 
        cartIsCouponApplied, 
        finalCoupon: coupon, 
        finalIsCouponApplied: isCouponApplied 
    });
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.cartQuantity || item.quantity)), 0);
    const taxRate = 0.12; // 12% tax
    const taxAmount = subtotal * taxRate;
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
    
    // Calculate discount amount - voucher applies to subtotal only, not tax
    const voucherDiscount = coupon ? 
        (coupon.type === 'percent' ? subtotal * (coupon.amount / 100) : Math.min(coupon.amount, subtotal)) : 
        0;
    const calculatedDiscount = subtotal - (finalTotal - deliveryFee - taxAmount);
    const hasDiscount = calculatedDiscount > 0 || voucherDiscount > 0;

    return (
        <div className='min-h-screen pt-32 pb-8 md:pt-32 md:pb-16 bg-[#f8f3ed]'>
            <div className='mx-auto max-w-screen-xl px-4 2xl:px-0'>
                {/* Header */}
                <motion.div
                    className='mb-8'
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <button
                        onClick={handleBackToShipping}
                        className='inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 mb-4 text-[#860809] font-alice'
                    >
                        <ArrowLeft size={16} />
                        Back to Shipping Options
                    </button>
                    
                    <h1 className='text-3xl font-bold text-[#860809] font-libre'>
                        Payment
                    </h1>
                    <p className='text-sm mt-2 text-[#a31f17] font-alice'>
                        Step 3 of 3 - Complete your order
                    </p>
                </motion.div>

                <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                    {/* Left Side - Order Details */}
                    <motion.div
                        className='lg:col-span-2 space-y-6'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Shipping Information */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 text-[#860809] font-libre'>
                                Shipping Information
                            </h2>
                            
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                <div>
                                    <h3 className='text-sm font-medium mb-2 text-[#a31f17] font-alice'>Contact</h3>
                                    <div className='space-y-1 text-sm text-[#030105] font-libre'>
                                        <div>{shippingInfo.email}</div>
                                        <div>{shippingInfo.phone}</div>
                                    </div>
                                </div>

                                <div>
                                    <h3 className='text-sm font-medium mb-2 text-[#a31f17] font-alice'>Delivery Address</h3>
                                    <div className='text-sm text-[#030105] font-libre'>
                                        <div>{shippingInfo.firstName} {shippingInfo.lastName}</div>
                                        <div>{shippingInfo.address}</div>
                                        <div>{shippingInfo.barangay}, {shippingInfo.city}</div>
                                        <div>{shippingInfo.province} {shippingInfo.postalCode}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Method */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 text-[#860809] font-libre'>
                                Shipping Method
                            </h2>
                            
                            <div className='flex items-center justify-between p-4 rounded-lg bg-[#f8f3ed]'>
                                <div className='flex items-center gap-3'>
                                    <div className='w-8 h-8 rounded-full flex items-center justify-center bg-[#860809]'>
                                        {selectedShipping === 'pickup' ? (
                                            <CheckCircle size={16} className='text-white' />
                                        ) : (
                                            <CheckCircle size={16} className='text-white' />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className='font-medium text-[#030105] font-alice'>
                                            {selectedShipping === 'pickup' ? 'Pick Up in Store' : 'Lalamove Delivery'}
                                        </h3>
                                        <p className='text-sm text-[#a31f17] font-libre'>
                                            {selectedShipping === 'pickup' 
                                                ? 'Free pickup at our location' 
                                                : `${lalamoveQuote?.serviceType} • ${lalamoveQuote?.distance?.toFixed(1) || 0}km`
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className='text-right'>
                                    <div className='font-semibold text-[#860809] font-libre'>
                                        {selectedShipping === 'pickup' 
                                            ? 'FREE' 
                                            : `₱${deliveryFee.toFixed(2)}`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 text-[#860809] font-libre'>
                                Order Items
                            </h2>
                            
                            <div className='space-y-4'>
                                {cartItems.map((item) => (
                                    <div key={item._id} className='flex items-center gap-4 p-3 rounded-lg bg-[#f8f3ed]'>
                                        <img 
                                            src={item.image} 
                                            alt={item.name}
                                            className='w-16 h-16 rounded-lg object-cover'
                                        />
                                        <div className='flex-1'>
                                            <h3 className='font-medium text-[#030105] font-alice'>{item.name}</h3>
                                            <p className='text-sm text-[#a31f17] font-libre'>
                                                Quantity: {item.cartQuantity || item.quantity} • ₱{item.price} each
                                            </p>
                                        </div>
                                        <div className='text-right'>
                                            <div className='font-semibold text-[#860809] font-libre'>
                                                ₱{(item.price * (item.cartQuantity || item.quantity)).toFixed(2)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Payment Summary */}
                    <motion.div
                        className='space-y-6'
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 text-[#860809] font-libre'>
                                Payment Summary
                            </h2>
                            
                            <div className='space-y-3'>
                                {/* Products */}
                                <div className='space-y-2'>
                                    <h3 className='text-sm font-medium text-[#a31f17] font-alice'>Products</h3>
                                    {cartItems.map((item) => {
                                        const itemTotal = item.price * (item.cartQuantity || item.quantity);
                                        return (
                                            <div key={item._id} className='flex justify-between text-sm'>
                                                <span className='text-[#030105] font-alice'>
                                                    {item.name} × {item.cartQuantity || item.quantity}
                                                </span>
                                                <span className='text-[#030105] font-libre'>₱{itemTotal.toFixed(2)}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Subtotal */}
                                <div className='flex justify-between text-sm'>
                                    <span className='text-[#030105] font-alice'>subtotal</span>
                                    <span className='text-[#030105] font-libre'>₱{subtotal.toFixed(2)}</span>
                                </div>

                                {/* Tax */}
                                <div className='flex justify-between text-sm'>
                                    <span className='text-[#030105] font-alice'>tax (12%)</span>
                                    <span className='text-[#030105] font-libre'>₱{taxAmount.toFixed(2)}</span>
                                </div>

                                {/* Voucher */}
                                {voucherDiscount > 0 ? (
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-[#030105] font-alice'>
                                            voucher {coupon ? `(${coupon.code})` : ''}
                                        </span>
                                        <span className='text-green-600 font-libre'>
                                            -₱{voucherDiscount.toFixed(2)}
                                        </span>
                                    </div>
                                ) : null}

                                {/* Subtotal after discount */}
                                {voucherDiscount > 0 ? (
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-[#030105] font-alice'>subtotal</span>
                                        <span className='text-[#030105] font-libre'>
                                            ₱{(subtotal + taxAmount - voucherDiscount).toFixed(2)}
                                        </span>
                                    </div>
                                ) : null}

                                {/* Shipping */}
                                <div className='flex justify-between text-sm'>
                                    <span className='text-[#030105] font-alice'>shipping</span>
                                    <span className='text-[#030105] font-libre'>
                                        {selectedShipping === 'pickup' ? 'FREE' : `₱${deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>

                                {/* Total */}
                                <div className='border-t border-gray-300 pt-3'>
                                    <div className='flex justify-between font-semibold text-lg'>
                                        <span className='text-[#030105] font-alice'>total</span>
                                        <span className='text-[#860809] font-libre'>
                                            ₱{(subtotal + taxAmount - voucherDiscount + deliveryFee).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                <CreditCard size={20} />
                                Payment Method
                            </h2>
                            
                            <div className='space-y-3'>
                                <div className='p-4 rounded-lg border-2 border-blue-200 bg-blue-50'>
                                    <div className='flex items-center gap-3'>
                                        <CreditCard size={20} style={{ color: '#1e40af' }} />
                                        <div>
                                            <h3 className='font-medium text-[#1e40af] font-alice'>Credit/Debit Card</h3>
                                            <p className='text-sm text-[#1e3a8a] font-libre'>
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
                            <div className='rounded-lg border border-red-300 p-4 bg-red-50'>
                                <div className='flex items-center gap-2'>
                                    <AlertCircle size={16} style={{ color: '#ef4444' }} />
                                    <span className='text-sm font-medium text-red-600 font-alice'>
                                        Payment Error
                                    </span>
                                </div>
                                <p className='text-sm mt-1 text-red-600 font-libre'>
                                    {paymentError}
                                </p>
                            </div>
                        )}

                        {/* Pay Button */}
                        <button
                            onClick={handlePayment}
                            disabled={isProcessing}
                            className='w-full flex items-center justify-center gap-2 px-6 py-4 rounded-lg text-white font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-4 disabled:opacity-50 bg-[#860809] font-alice'
                        >
                            {isProcessing ? (
                                <>
                                    <Loader size={20} className='animate-spin' />
                                    Processing Payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    Pay ₱{(subtotal + taxAmount - voucherDiscount + deliveryFee).toFixed(2)}
                                </>
                            )}
                        </button>

                        {/* Security Notice */}
                        <div className='text-center text-xs text-[#a31f17] font-libre'>
                            <div className='flex items-center justify-center gap-2 mb-1'>
                                <CheckCircle size={12} />
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
