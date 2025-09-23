import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MapPin, User, Phone, Mail, Truck, Store, Clock, DollarSign } from "lucide-react";
import { useAuthStore } from "../../store/authStore";
import { cartStore } from "../../store/cartStore";
import axios from "axios";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const ShippingOptionsPage = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const { cart, coupon, isCouponApplied, total, subtotal } = cartStore();

    // State
    const [shippingInfo, setShippingInfo] = useState(null);
    const [selectedShipping, setSelectedShipping] = useState('pickup'); // 'pickup' or 'lalamove'
    const [lalamoveQuote, setLalamoveQuote] = useState(null);
    const [isLoadingQuote, setIsLoadingQuote] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

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

        // Load shipping information from sessionStorage
        const savedShippingInfo = sessionStorage.getItem('shippingInfo');
        if (!savedShippingInfo) {
            toast.error('Shipping information not found. Please start over.');
            navigate('/carts');
            return;
        }

        setShippingInfo(JSON.parse(savedShippingInfo));
    }, [isAuthenticated, user, navigate]);

    // Fetch Lalamove quote when shippingInfo is available
    useEffect(() => {
        if (shippingInfo && cart.length > 0) {
            fetchLalamoveQuote();
        }
    }, [shippingInfo, cart]);

    const fetchLalamoveQuote = async () => {
        if (!shippingInfo || !cart.length) {
            console.log('fetchLalamoveQuote: Missing shippingInfo or cart', { shippingInfo: !!shippingInfo, cartLength: cart.length });
            return;
        }

        console.log('fetchLalamoveQuote: Starting quote request', {
            deliveryAddress: shippingInfo.fullAddress,
            cartItems: cart.map(item => ({ name: item.name, quantity: item.cartQuantity || item.quantity, price: item.price }))
        });

        setIsLoadingQuote(true);
        try {
            const response = await axios.post(`${API_URL}/lalamove/quotation`, {
                deliveryAddress: shippingInfo.fullAddress,
                cartItems: cart
            });

            console.log('fetchLalamoveQuote: Response received', response.data);

            if (response.data.success) {
                setLalamoveQuote(response.data.data);
                console.log('fetchLalamoveQuote: Quote set successfully', response.data.data);
                console.log('fetchLalamoveQuote: Quotation structure', response.data.data.quotation);
                console.log('fetchLalamoveQuote: Full quotation object', JSON.stringify(response.data.data.quotation, null, 2));
            } else {
                console.error('fetchLalamoveQuote: API returned success: false', response.data);
                toast.error(response.data.message || 'Failed to get delivery quote');
            }
        } catch (error) {
            console.error('Error fetching Lalamove quote:', error);
            console.error('Error response:', error.response?.data);
            toast.error('Failed to get delivery quote. Please try again.');
        } finally {
            setIsLoadingQuote(false);
        }
    };

    const handleShippingChange = (option) => {
        setSelectedShipping(option);
    };

    const calculateTotal = () => {
        let finalTotal = total;
        
        if (selectedShipping === 'lalamove' && lalamoveQuote) {
            // Add Lalamove delivery fee
            const deliveryFee = parseFloat(
                lalamoveQuote.quotation?.priceBreakdown?.total || 
                lalamoveQuote.quotation?.total || 
                lalamoveQuote.quotation?.price || 
                lalamoveQuote.quotation?.data?.priceBreakdown?.total ||
                lalamoveQuote.quotation?.data?.total ||
                0
            );
            finalTotal += deliveryFee;
        }
        
        return finalTotal;
    };

    const handleContinue = async () => {
        if (!shippingInfo) {
            toast.error('Shipping information not found');
            return;
        }

        setIsSubmitting(true);

        try {
            // Store shipping option and quote in sessionStorage
            const checkoutData = {
                shippingInfo,
                selectedShipping,
                lalamoveQuote: selectedShipping === 'lalamove' ? lalamoveQuote : null,
                finalTotal: calculateTotal(),
                cart,
                coupon: isCouponApplied ? coupon : null
            };

            sessionStorage.setItem('checkoutData', JSON.stringify(checkoutData));

            // Navigate to payment page
            navigate('/payment');
        } catch (error) {
            console.error('Error proceeding to payment:', error);
            toast.error('Failed to proceed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated || user?.role !== 'customer' || !shippingInfo) {
        return null;
    }

    const finalTotal = calculateTotal();
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
                        onClick={() => navigate('/information')}
                        className='inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 mb-4 text-[#860809] font-alice'
                    >
                        <ArrowLeft size={16} />
                        Back to Information
                    </button>
                    
                    <h1 className='text-3xl font-bold text-[#860809] font-libre'>
                        Shipping Options
                    </h1>
                    <p className='text-sm mt-2 text-[#a31f17] font-alice'>
                        Step 2 of 3 - Choose your shipping method
                    </p>
                </motion.div>

                <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
                    {/* Left Side - Shipping Options */}
                    <motion.div
                        className='lg:col-span-2 space-y-6'
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                    >
                        {/* Information Summary */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                <User size={20} />
                                Information Summary
                            </h2>
                            
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                                {/* Contact Information */}
                                <div>
                                    <h3 className='text-sm font-medium mb-2 text-[#a31f17] font-alice'>Contact</h3>
                                    <div className='space-y-1'>
                                        <div className='flex items-center gap-2'>
                                            <Mail size={14} style={{ color: '#860809' }} />
                                            <span className='text-sm text-[#030105] font-libre'>{shippingInfo.email}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                            <Phone size={14} style={{ color: '#860809' }} />
                                            <span className='text-sm text-[#030105] font-libre'>{shippingInfo.phone}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Shipping Address */}
                                <div>
                                    <h3 className='text-sm font-medium mb-2 text-[#a31f17] font-alice'>Ship to</h3>
                                    <div className='space-y-1'>
                                        <div className='flex items-start gap-2'>
                                            <MapPin size={14} style={{ color: '#860809' }} className='mt-0.5' />
                                            <div className='text-sm text-[#030105] font-libre'>
                                                <div>{shippingInfo.firstName} {shippingInfo.lastName}</div>
                                                <div>{shippingInfo.address}</div>
                                                <div>{shippingInfo.barangay}, {shippingInfo.city}</div>
                                                <div>{shippingInfo.province} {shippingInfo.postalCode}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Methods */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 flex items-center gap-2 text-[#860809] font-libre'>
                                <Truck size={20} />
                                Shipping Method
                            </h2>
                            
                            <div className='space-y-4'>
                                {/* Pick Up in Store */}
                                <div 
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        selectedShipping === 'pickup' 
                                            ? 'border-[#860809] bg-[#f8f3ed]' 
                                            : 'border-gray-300 hover:border-[#860809] bg-[#fffefc]'
                                    }`}
                                    onClick={() => handleShippingChange('pickup')}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                                selectedShipping === 'pickup' 
                                                    ? 'border-[#860809] bg-[#860809]' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {selectedShipping === 'pickup' && (
                                                    <div className='w-2 h-2 bg-white rounded-full mx-auto mt-0.5'></div>
                                                )}
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Store size={20} style={{ color: '#860809' }} />
                                                <div>
                                                    <h3 className='font-medium text-[#030105] font-alice'>Pick Up in Store</h3>
                                                    <p className='text-sm text-[#a31f17] font-libre'>Free pickup at our location</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            <div className='font-semibold text-green-600 font-libre'>FREE</div>
                                            <div className='text-xs text-[#a31f17] font-libre'>No additional cost</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Lalamove Delivery */}
                                <div 
                                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                                        selectedShipping === 'lalamove' 
                                            ? 'border-[#860809] bg-[#f8f3ed]' 
                                            : 'border-gray-300 hover:border-[#860809] bg-[#fffefc]'
                                    }`}
                                    onClick={() => handleShippingChange('lalamove')}
                                >
                                    <div className='flex items-center justify-between'>
                                        <div className='flex items-center gap-3'>
                                            <div className={`w-4 h-4 rounded-full border-2 ${
                                                selectedShipping === 'lalamove' 
                                                    ? 'border-[#860809] bg-[#860809]' 
                                                    : 'border-gray-300'
                                            }`}>
                                                {selectedShipping === 'lalamove' && (
                                                    <div className='w-2 h-2 bg-white rounded-full mx-auto mt-0.5'></div>
                                                )}
                                            </div>
                                            <div className='flex items-center gap-2'>
                                                <Truck size={20} style={{ color: '#860809' }} />
                                                <div>
                                                    <h3 className='font-medium text-[#030105] font-alice'>Lalamove Delivery</h3>
                                                    <p className='text-sm text-[#a31f17] font-libre'>Door-to-door delivery service</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='text-right'>
                                            {isLoadingQuote ? (
                                                <div className='flex items-center gap-2'>
                                                    <div className='w-4 h-4 border-2 border-[#f8f3ed] border-t-[#901414] rounded-full animate-spin'></div>
                                                    <span className='text-sm text-[#a31f17] font-libre'>Loading...</span>
                                                </div>
                                            ) : lalamoveQuote ? (
                                                <div>
                                                    <div className='font-semibold text-[#860809] font-libre'>
                                                        ₱{parseFloat(
                                                            lalamoveQuote.quotation?.priceBreakdown?.total || 
                                                            lalamoveQuote.quotation?.total || 
                                                            lalamoveQuote.quotation?.price || 
                                                            lalamoveQuote.quotation?.data?.priceBreakdown?.total ||
                                                            lalamoveQuote.quotation?.data?.total ||
                                                            0
                                                        ).toFixed(2)}
                                                    </div>
                                                    <div className='text-xs text-[#a31f17] font-libre'>
                                                        {lalamoveQuote.serviceType} • {lalamoveQuote.distance?.toFixed(1) || 0}km
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className='flex flex-col items-end gap-1'>
                                                    <div className='text-sm text-red-500'>Quote unavailable</div>
                                                    <button
                                                        onClick={fetchLalamoveQuote}
                                                        className='text-xs px-2 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition-colors'
                                                    >
                                                        Retry
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Lalamove Details */}
                                    {selectedShipping === 'lalamove' && lalamoveQuote && (
                                        <div className='mt-4 p-3 rounded-lg bg-[#f8f3ed]'>
                                            <div className='grid grid-cols-2 gap-4 text-sm'>
                                                <div>
                                                    <span className='font-medium text-[#030105] font-alice'>Service Type:</span>
                                                    <span className='ml-2 text-[#a31f17] font-libre'>{lalamoveQuote.serviceType}</span>
                                                </div>
                                                <div>
                                                    <span className='font-medium text-[#030105] font-alice'>Distance:</span>
                                                    <span className='ml-2 text-[#a31f17] font-libre'>{lalamoveQuote.distance?.toFixed(1) || 0} km</span>
                                                </div>
                                                <div>
                                                    <span className='font-medium text-[#030105] font-alice'>Estimated Time:</span>
                                                    <span className='ml-2 text-[#a31f17] font-libre'>{Math.round(lalamoveQuote.duration || 0)} min</span>
                                                </div>
                                                <div>
                                                    <span className='font-medium text-[#030105] font-alice'>Total Weight:</span>
                                                    <span className='ml-2 text-[#a31f17] font-libre'>{lalamoveQuote.totalWeight || 0} kg</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Side - Shipping Details */}
                    <motion.div
                        className='space-y-6'
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                    >
                        {/* Shipping Fee Summary */}
                        <div className='rounded-lg border border-gray-300 p-6 bg-[#fffefc] shadow-md'>
                            <h2 className='text-xl font-semibold mb-4 text-[#860809] font-libre'>Shipping Details</h2>
                            
                            <div className='space-y-4'>
                                {/* Product Breakdown */}
                                <div className='space-y-2'>
                                    <h3 className='text-sm font-medium text-[#a31f17] font-alice'>Products</h3>
                                    {cart.map((item) => {
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
                                <div className='flex justify-between text-sm border-t border-gray-200 pt-2'>
                                    <span className='text-[#030105] font-alice'>subtotal</span>
                                    <span className='text-[#030105] font-libre'>₱{subtotal.toFixed(2)}</span>
                                </div>

                                {/* Voucher */}
                                {isCouponApplied && coupon && (
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-[#030105] font-alice'>voucher ({coupon.code})</span>
                                        <span className='text-green-600 font-libre'>
                                            -₱{(coupon.type === 'percent' ? subtotal * (coupon.amount / 100) : Math.min(coupon.amount, subtotal)).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {/* Subtotal after discount */}
                                {isCouponApplied && coupon && (
                                    <div className='flex justify-between text-sm'>
                                        <span className='text-[#030105] font-alice'>subtotal</span>
                                        <span className='text-[#030105] font-libre'>
                                            ₱{(subtotal - (coupon.type === 'percent' ? subtotal * (coupon.amount / 100) : Math.min(coupon.amount, subtotal))).toFixed(2)}
                                        </span>
                                    </div>
                                )}

                                {/* Shipping Method */}
                                <div className='flex justify-between text-sm'>
                                    <span className='text-[#030105] font-alice'>Method</span>
                                    <span className='text-[#860809] font-libre'>
                                        {selectedShipping === 'pickup' ? 'Pick Up in Store' : 'Lalamove Delivery'}
                                    </span>
                                </div>

                                {/* Shipping Fee */}
                                <div className='flex justify-between text-sm'>
                                    <span className='text-[#030105] font-alice'>Shipping Fee</span>
                                    <span className='text-[#030105] font-libre'>
                                        {selectedShipping === 'pickup' ? 'FREE' : `₱${deliveryFee.toFixed(2)}`}
                                    </span>
                                </div>

                                {/* Lalamove Details */}
                                {selectedShipping === 'lalamove' && lalamoveQuote && (
                                    <>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-[#030105] font-alice'>Service Type</span>
                                            <span className='text-[#860809] font-libre'>{lalamoveQuote.serviceType}</span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-[#030105] font-alice'>Distance</span>
                                            <span className='text-[#860809] font-libre'>{lalamoveQuote.distance?.toFixed(1) || 0} km</span>
                                        </div>
                                        <div className='flex justify-between text-sm'>
                                            <span className='text-[#030105] font-alice'>Est. Time</span>
                                            <span className='text-[#860809] font-libre'>{Math.round(lalamoveQuote.duration || 0)} min</span>
                                        </div>
                                    </>
                                )}

                                <div className='border-t border-gray-300 pt-3'>
                                    <div className='flex justify-between font-semibold'>
                                        <span className='text-[#030105] font-alice'>Final Total</span>
                                        <span className='text-[#860809] font-libre'>
                                            ₱{finalTotal.toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Continue Button */}
                <motion.div
                    className='flex justify-end mt-8'
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    <button
                        onClick={handleContinue}
                        disabled={isSubmitting || (selectedShipping === 'lalamove' && !lalamoveQuote)}
                        className='flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-4 disabled:opacity-50 bg-[#860809] font-alice'
                    >
                        {isSubmitting ? (
                            <>
                                <div className='w-4 h-4 border-2 border-[#feffff] border-t-[#ffd901] rounded-full animate-spin'></div>
                                Processing...
                            </>
                        ) : (
                            <>
                                Continue to Payment
                                <ArrowRight size={16} />
                            </>
                        )}
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default ShippingOptionsPage;
