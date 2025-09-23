import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useOrderStore } from '../../store/orderStore';
import { useAuthStore } from '../../store/authStore';
import { 
    Package, 
    Clock, 
    MapPin, 
    Phone, 
    Truck, 
    CheckCircle, 
    XCircle, 
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    ArrowLeft,
    ExternalLink
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';

const TrackOrdersPage = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const {
        orders,
        orderStats,
        isLoading,
        error,
        fetchOrders,
        fetchOrderStats,
        getStatusColor,
        getStatusIcon,
        getStatusDescription,
        clearError
    } = useOrderStore();

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Fetch orders and stats on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchOrders({ page: currentPage, status: statusFilter }),
                    fetchOrderStats()
                ]);
            } catch (error) {
                console.error('Error loading order data:', error);
            }
        };

        loadData();
    }, [currentPage, statusFilter]);

    // Filter orders based on search term
    const filteredOrders = orders.filter(order => {
        if (!searchTerm) return true;
        const orderNumber = order._id.slice(-8).toUpperCase();
        const recipientName = order.shippingInfo ? 
            `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
            'Unknown';
        return (
            orderNumber.includes(searchTerm.toUpperCase()) ||
            recipientName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const handleOrderClick = (order) => {
        setSelectedOrder(order);
    };

    const handleRefresh = async () => {
        try {
            await fetchOrders({ page: currentPage, status: statusFilter });
        } catch (error) {
            console.error('Error refreshing orders:', error);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoading && orders.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen pt-32 pb-8 bg-[#f8f3ed]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 mb-4"
                                style={{ color: '#860809' }}
                            >
                                <ArrowLeft size={16} />
                                Back to Home
                            </Link>
                            <h1 className="text-3xl font-bold text-[#860809] font-libre">
                                Track Your Orders
                            </h1>
                            <p className="text-[#030105] mt-2 font-alice">
                                Monitor the status of your orders and deliveries
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg shadow-md hover:shadow-lg transition-colors disabled:opacity-50 bg-[#fffefc] text-[#860809] font-alice"
                        >
                            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                            Refresh
                        </button>
                    </div>
                </motion.div>

                {/* Order Stats */}
                {orderStats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
                    >
                        <div className="rounded-lg shadow-md p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-blue-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Total Orders</p>
                                    <p className="text-2xl font-bold text-[#030105] font-libre">{orderStats.totalOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Completed</p>
                                    <p className="text-2xl font-bold text-[#030105] font-libre">{orderStats.completedOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Pending</p>
                                    <p className="text-2xl font-bold text-[#030105] font-libre">{orderStats.pendingOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Total Spent</p>
                                    <p className="text-2xl font-bold text-[#030105] font-libre">₱{orderStats.totalSpent.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Filters and Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-lg shadow-md p-6 mb-8 bg-[#fffefc]"
                >
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by order number or recipient name..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent"
                                />
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
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
                                <XCircle size={20} />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Orders List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="space-y-4"
                >
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-[#030105] font-alice">No orders found</h3>
                            <p className="mt-1 text-sm text-[#a31f17] font-libre">
                                {searchTerm || statusFilter ? 'Try adjusting your search or filter criteria.' : 'You haven\'t placed any orders yet.'}
                            </p>
                            {!searchTerm && !statusFilter && (
                                <div className="mt-6">
                                    <Link
                                        to="/products"
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#860809] hover:bg-[#a31f17] font-alice"
                                    >
                                        Start Shopping
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        filteredOrders.map((order, index) => (
                            <motion.div
                                key={order._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                className="rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-[#fffefc]"
                                onClick={() => handleOrderClick(order)}
                            >
                                <div className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4 mb-3">
                                                <h3 className="text-lg font-semibold text-[#030105] font-alice">
                                                    Order #{order._id.slice(-8).toUpperCase()}
                                                </h3>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.computedStatus)}`}>
                                                    {getStatusIcon(order.computedStatus)} {order.computedStatus.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-[#a31f17] mb-2 font-libre">
                                                {getStatusDescription(order.computedStatus)}
                                            </p>
                                            <div className="flex items-center gap-6 text-sm text-[#030105] font-libre">
                                                <div className="flex items-center gap-1">
                                                    <Clock size={16} />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin size={16} />
                                                    {order.shippingInfo?.city || 'N/A'}, {order.shippingInfo?.province || 'N/A'}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">₱{order.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {order.lalamoveDetails?.trackingUrl && (
                                                <a
                                                    href={order.lalamoveDetails.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50"
                                                >
                                                    <ExternalLink size={14} />
                                                    Track
                                                </a>
                                            )}
                                            <span className="text-gray-400">→</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </motion.div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.4 }}
                        className="flex items-center justify-center gap-2 mt-8"
                    >
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-3 py-2 text-sm font-medium text-[#030105] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 text-sm text-[#030105] font-libre">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-2 text-sm font-medium text-[#030105] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                        >
                            Next
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <OrderDetailsModal
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    getStatusColor={getStatusColor}
                    getStatusIcon={getStatusIcon}
                    getStatusDescription={getStatusDescription}
                />
            )}
        </div>
    );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, getStatusColor, getStatusIcon, getStatusDescription }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#fffefc]"
            >
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-[#860809] font-libre">
                            Order Details
                        </h2>
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <XCircle size={24} />
                        </button>
                    </div>

                    {/* Order Status */}
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.computedStatus)}`}>
                                {getStatusIcon(order.computedStatus)} {order.computedStatus.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-[#a31f17] font-libre">{getStatusDescription(order.computedStatus)}</p>
                    </div>

                    {/* Order Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-[#860809] mb-3 font-libre">Order Information</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#a31f17] font-alice">Order Number:</span>
                                    <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#a31f17] font-alice">Order Date:</span>
                                    <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#a31f17] font-alice">Payment Status:</span>
                                    <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#a31f17] font-alice">Shipping Method:</span>
                                    <span className="font-medium">{order.shippingMethod === 'lalamove' ? 'Delivery' : 'Pickup'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-[#860809] mb-3 font-libre">Shipping Information</h3>
                            <div className="space-y-2 text-sm">
                                <div>
                                    <span className="text-[#a31f17] font-alice">Recipient:</span>
                                    <span className="font-medium ml-2">
                                        {order.shippingInfo ? 
                                            `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || 'N/A' : 
                                            'N/A'
                                        }
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[#a31f17] font-alice">Phone:</span>
                                    <span className="font-medium ml-2">{order.shippingInfo?.phone || 'N/A'}</span>
                                </div>
                                <div>
                                    <span className="text-[#a31f17] font-alice">Address:</span>
                                    <span className="font-medium ml-2">{order.shippingInfo?.fullAddress || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Driver Information (if available) */}
                    {order.lalamoveDetails?.driverName && (
                        <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[#860809] mb-3 font-libre">Driver Information</h3>
                            <div className="bg-blue-50 rounded-lg p-4">
                                <div className="flex items-center gap-3">
                                    <Truck className="h-6 w-6 text-blue-600" />
                                    <div>
                                        <p className="font-medium text-gray-900">{order.lalamoveDetails.driverName}</p>
                                        <p className="text-sm text-gray-600">{order.lalamoveDetails.driverPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products */}
                    <div className="mb-6">
                            <h3 className="text-lg font-semibold text-[#860809] mb-3 font-libre">Products</h3>
                        <div className="space-y-3">
                            {order.products.map((item, index) => (
                                <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                    {item.product?.image && (
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-12 h-12 object-cover rounded"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <h4 className="font-medium text-[#030105] font-alice">{item.product?.name || 'Product'}</h4>
                                        <p className="text-sm text-[#a31f17] font-libre">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-medium text-[#030105] font-libre">₱{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-sm text-[#a31f17] font-libre">₱{item.price.toFixed(2)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-4">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center text-sm mb-2">
                            <span className="text-[#030105] font-alice">Subtotal:</span>
                            <span className="text-[#030105] font-libre">₱{order.productSubtotal?.toFixed(2) || order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>

                        {/* Tax */}
                        {order.taxAmount && typeof order.taxAmount === 'number' && order.taxAmount > 0 ? (
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-[#030105] font-alice">Tax (12%):</span>
                                <span className="text-[#030105] font-libre">₱{order.taxAmount.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Coupon Discount */}
                        {order.coupon && order.coupon.code && order.coupon.discount ? (
                            <div className="flex justify-between items-center text-sm text-green-600 mb-2">
                                <span className="font-libre">Coupon Applied: {order.coupon.code}</span>
                                <span className="font-libre">-₱{order.coupon.discount.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Delivery Fee */}
                        {order.deliveryFee && typeof order.deliveryFee === 'number' && order.deliveryFee > 0 ? (
                            <div className="flex justify-between items-center text-sm mb-2">
                                <span className="text-[#030105] font-alice">Delivery Fee:</span>
                                <span className="text-[#030105] font-libre">₱{order.deliveryFee.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Total Amount */}
                        <div className="flex justify-between items-center text-lg font-semibold border-t pt-2">
                            <span className="text-[#860809] font-libre">Total Amount:</span>
                            <span className="text-[#030105] font-libre">₱{order.totalAmount.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default TrackOrdersPage;
