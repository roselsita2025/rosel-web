import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { useReplacementRequestStore } from '../../store/replacementRequestStore';
import { useOrderStore } from '../../store/orderStore';
import ReplacementRequestForm from '../../components/ReplacementRequestForm';
import LoadingSpinner from '../../components/LoadingSpinner';

const ReplacementRequestPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { createReplacementRequest, isLoading, error, message, clearError, clearMessage } = useReplacementRequestStore();
    const { orders, fetchOrders } = useOrderStore();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isOrderSelected, setIsOrderSelected] = useState(false);

    // Get order and product from URL params
    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');

    useEffect(() => {
        const loadOrders = async () => {
            try {
                await fetchOrders();
            } catch (error) {
                console.error('Error loading orders:', error);
            }
        };

        loadOrders();
    }, []);

    useEffect(() => {
        if (orderId && productId && orders.length > 0) {
            const order = orders.find(o => o._id === orderId);
            if (order) {
                const product = order.products.find(p => p.product._id === productId);
                if (product) {
                    setSelectedOrder(order);
                    setSelectedProduct(product.product);
                    setIsOrderSelected(true);
                }
            }
        }
    }, [orderId, productId, orders]);

    const handleOrderSelect = (order) => {
        setSelectedOrder(order);
        setSelectedProduct(null);
        setIsOrderSelected(true);
    };

    const handleProductSelect = (product) => {
        setSelectedProduct(product);
    };

    const handleFormSuccess = () => {
        navigate('/replacement-requests');
    };

    const handleFormCancel = () => {
        if (isOrderSelected) {
            setIsOrderSelected(false);
            setSelectedOrder(null);
            setSelectedProduct(null);
        } else {
            navigate('/replacement-requests');
        }
    };

    if (isLoading && orders.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen pt-32 pb-8 bg-[#f8f3ed]">
            <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <Link
                        to="/replacement-requests"
                        className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 mb-4"
                        style={{ color: '#860809' }}
                    >
                        <ArrowLeft size={16} />
                        Back to Requests
                    </Link>
                    <h1 className="text-3xl font-bold text-[#860809] font-libre">
                        Request Product Replacement
                    </h1>
                    <p className="text-[#030105] mt-2 font-alice">
                        Select an order and product to request a replacement
                    </p>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-center">
                            <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                            <p className="text-red-800">{error}</p>
                            <button
                                onClick={clearError}
                                className="ml-auto text-red-600 hover:text-red-800"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Success Message */}
                {message && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
                    >
                        <div className="flex items-center">
                            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                            <p className="text-green-800">{message}</p>
                            <button
                                onClick={clearMessage}
                                className="ml-auto text-green-600 hover:text-green-800"
                            >
                                ×
                            </button>
                        </div>
                    </motion.div>
                )}

                {!isOrderSelected ? (
                    /* Order Selection */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="rounded-lg shadow-md p-6 bg-[#fffefc]"
                    >
                        <h2 className="text-xl font-semibold text-[#860809] mb-4 font-libre">
                            Select an Order
                        </h2>
                        <p className="text-[#a31f17] mb-6 font-libre">
                            Choose an order to request a replacement for one of its products.
                        </p>

                        {orders.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-[#a31f17] mb-4 font-libre">You don't have any orders yet.</p>
                                <Link
                                    to="/products"
                                    className="inline-flex items-center px-4 py-2 bg-[#860809] text-white rounded-md hover:bg-[#a31f17] transition-colors font-alice"
                                >
                                    Start Shopping
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((order) => (
                                    <motion.div
                                        key={order._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        whileHover={{ y: -2 }}
                                        className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-[#fffefc]"
                                        onClick={() => handleOrderSelect(order)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h3 className="font-medium text-[#030105] font-alice">
                                                    Order #{order._id.slice(-8).toUpperCase()}
                                                </h3>
                                                <p className="text-sm text-[#a31f17] font-libre">
                                                    {new Date(order.createdAt).toLocaleDateString()} • ₱{order.totalAmount.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-[#a31f17] font-libre">
                                                    {order.products.length} item{order.products.length !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                            <div className="text-gray-400">
                                                →
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ) : !selectedProduct ? (
                    /* Product Selection */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="rounded-lg shadow-md p-6 bg-[#fffefc]"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-[#860809] font-libre">
                                Select a Product to Replace
                            </h2>
                            <button
                                onClick={() => setIsOrderSelected(false)}
                                className="text-sm text-[#a31f17] hover:text-[#860809] font-alice"
                            >
                                Change Order
                            </button>
                        </div>
                        <p className="text-[#a31f17] mb-6 font-libre">
                            Choose which product from Order #{selectedOrder._id.slice(-8).toUpperCase()} you want to replace.
                        </p>

                        <div className="space-y-4">
                            {selectedOrder.products.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    whileHover={{ y: -2 }}
                                    className="border border-gray-300 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-[#fffefc]"
                                    onClick={() => handleProductSelect(item.product)}
                                >
                                    <div className="flex items-center gap-4">
                                        {item.product.image && (
                                            <img
                                                src={item.product.image}
                                                alt={item.product.name}
                                                className="w-16 h-16 object-cover rounded"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-medium text-[#030105] font-alice">
                                                {item.product.name}
                                            </h3>
                                            <p className="text-sm text-[#a31f17] font-libre">
                                                Quantity: {item.quantity} • ₱{item.price.toFixed(2)} each
                                            </p>
                                            <p className="text-sm text-[#a31f17] font-libre">
                                                Total: ₱{(item.quantity * item.price).toFixed(2)}
                                            </p>
                                        </div>
                                        <div className="text-gray-400">
                                            →
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                ) : (
                    /* Replacement Request Form */
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        <div className="mb-6">
                            <button
                                onClick={() => setSelectedProduct(null)}
                                className="text-sm text-[#a31f17] hover:text-[#860809] mb-2 font-alice"
                            >
                                ← Back to Product Selection
                            </button>
                        </div>
                        <ReplacementRequestForm
                            order={selectedOrder}
                            product={selectedProduct}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default ReplacementRequestPage;
