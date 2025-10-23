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
    Search,
    ArrowLeft,
    ExternalLink,
    Printer
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/LoadingSpinner';
import Footer from '../../components/Footer';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pagination, setPagination] = useState(null);

    // Fetch orders and stats on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    fetchOrders({ page: currentPage }),
                    fetchOrderStats()
                ]);
            } catch (error) {
                console.error('Error loading order data:', error);
            }
        };

        loadData();
    }, [currentPage]);

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
            await fetchOrders({ page: currentPage });
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
        <>
            <div className="min-h-screen bg-[#f8f3ed] flex flex-col">
                <div className="flex-1 pt-20 sm:pt-24 md:pt-28 lg:pt-32 mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8 pb-6 sm:pb-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-4 sm:mb-6 md:mb-8"
                >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <Link
                                to="/"
                                className="inline-flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80 mb-3 sm:mb-4"
                                style={{ color: '#860809' }}
                            >
                                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                Back to Home
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold text-[#860809] font-libre">
                                Track Your Orders
                            </h1>
                            <p className="text-[#030105] mt-1.5 sm:mt-2 font-alice text-sm sm:text-base">
                                Monitor the status of your orders and deliveries
                            </p>
                        </div>
                        <button
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg shadow-md hover:shadow-lg transition-colors disabled:opacity-50 bg-[#fffefc] text-[#860809] font-alice text-xs sm:text-sm"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
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
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 md:mb-8"
                    >
                        <div className="rounded-lg shadow-md p-4 sm:p-5 md:p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-blue-600" />
                                <div className="ml-3 sm:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Total Orders</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">{orderStats.totalOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-4 sm:p-5 md:p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <CheckCircle className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
                                <div className="ml-3 sm:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Completed</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">{orderStats.completedOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-4 sm:p-5 md:p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Clock className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-yellow-600" />
                                <div className="ml-3 sm:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Pending</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">{orderStats.pendingOrders}</p>
                                </div>
                            </div>
                        </div>
                        <div className="rounded-lg shadow-md p-4 sm:p-5 md:p-6 bg-[#fffefc]">
                            <div className="flex items-center">
                                <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 text-green-600" />
                                <div className="ml-3 sm:ml-4">
                                    <p className="text-xs sm:text-sm font-medium text-[#a31f17] font-alice">Total Spent</p>
                                    <p className="text-xl sm:text-2xl font-bold text-[#030105] font-libre">₱{orderStats.totalSpent.toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="rounded-lg shadow-md p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 bg-[#fffefc]"
                >
                    <div className="relative">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Search by order number or recipient name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent text-sm sm:text-base"
                        />
                    </div>
                </motion.div>

                {/* Error Message */}
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6"
                    >
                        <div className="flex items-center">
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2" />
                            <p className="text-red-800 text-xs sm:text-sm flex-1">{error}</p>
                            <button
                                onClick={clearError}
                                className="ml-auto text-red-600 hover:text-red-800"
                            >
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Orders List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="space-y-3 sm:space-y-4"
                >
                    {filteredOrders.length === 0 ? (
                        <div className="text-center py-8 sm:py-10 md:py-12">
                            <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm sm:text-base font-medium text-[#030105] font-alice">No orders found</h3>
                            <p className="mt-1 text-xs sm:text-sm text-[#a31f17] font-libre">
                                {searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t placed any orders yet.'}
                            </p>
                            {!searchTerm && (
                                <div className="mt-4 sm:mt-6">
                                    <Link
                                        to="/products"
                                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#860809] hover:bg-[#a31f17] font-alice"
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
                                <div className="p-3 sm:p-4 md:p-6">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                        <div className="flex-1 w-full sm:w-auto">
                                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3">
                                                <h3 className="text-base sm:text-lg font-semibold text-[#030105] font-alice">
                                                    Order #{order._id.slice(-8).toUpperCase()}
                                                </h3>
                                                <span className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.computedStatus)}`}>
                                                    {getStatusIcon(order.computedStatus)} {order.computedStatus.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-[#a31f17] mb-2 font-libre">
                                                {getStatusDescription(order.computedStatus)}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6 text-xs sm:text-sm text-[#030105] font-libre">
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    {new Date(order.createdAt).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                    <span className="truncate max-w-[120px] sm:max-w-none">
                                                        {order.shippingInfo?.city || 'N/A'}, {order.shippingInfo?.province || 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <span className="font-medium">₱{order.totalAmount.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-auto">
                                            {order.lalamoveDetails?.trackingUrl && (
                                                <a
                                                    href={order.lalamoveDetails.trackingUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1 px-2 sm:px-3 py-1 text-xs sm:text-sm text-blue-600 hover:text-blue-800 border border-blue-200 rounded-md hover:bg-blue-50"
                                                >
                                                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                                                    Track
                                                </a>
                                            )}
                                            <span className="text-gray-400 hidden sm:inline">→</span>
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
                        className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8"
                    >
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#030105] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                        >
                            Previous
                        </button>
                        <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[#030105] font-libre">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#030105] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
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
            
            {/* Footer */}
            <Footer />
        </>
    );
};

// Order Details Modal Component
const OrderDetailsModal = ({ order, onClose, getStatusColor, getStatusIcon, getStatusDescription }) => {
    const handlePrintReceipt = () => {
        const printWindow = window.open('', '_blank');
        const orderDate = new Date(order.createdAt).toLocaleDateString();
        const orderTime = new Date(order.createdAt).toLocaleTimeString();
        
        printWindow.document.write(`
            <html>
                <head>
                    <title>Order Receipt - #${order._id.slice(-8).toUpperCase()}</title>
                    <style>
                        body { 
                            font-family: Arial, sans-serif; 
                            margin: 20px;
                            color: #333;
                        }
                        .receipt-container { 
                            max-width: 400px;
                            margin: 0 auto;
                            border: 1px solid #ccc;
                            padding: 20px;
                        }
                        .header {
                            text-align: center;
                            border-bottom: 2px solid #860809;
                            padding-bottom: 15px;
                            margin-bottom: 20px;
                        }
                        .company-name {
                            font-size: 24px;
                            font-weight: bold;
                            color: #860809;
                            margin-bottom: 5px;
                        }
                        .receipt-title {
                            font-size: 18px;
                            color: #333;
                            margin-bottom: 10px;
                        }
                        .order-info {
                            margin-bottom: 20px;
                        }
                        .order-info h3 {
                            color: #860809;
                            font-size: 16px;
                            margin-bottom: 10px;
                            border-bottom: 1px solid #eee;
                            padding-bottom: 5px;
                        }
                        .info-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 5px;
                            font-size: 14px;
                        }
                        .info-label {
                            font-weight: bold;
                            color: #666;
                        }
                        .products-section {
                            margin-bottom: 20px;
                        }
                        .product-item {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 8px;
                            padding: 5px 0;
                            border-bottom: 1px solid #f0f0f0;
                        }
                        .product-name {
                            font-weight: bold;
                        }
                        .product-details {
                            font-size: 12px;
                            color: #666;
                        }
                        .totals {
                            border-top: 2px solid #860809;
                            padding-top: 15px;
                        }
                        .total-row {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 5px;
                        }
                        .final-total {
                            font-size: 18px;
                            font-weight: bold;
                            color: #860809;
                            border-top: 1px solid #ccc;
                            padding-top: 10px;
                        }
                        .status-badge {
                            display: inline-block;
                            padding: 4px 8px;
                            border-radius: 4px;
                            font-size: 12px;
                            font-weight: bold;
                            margin-top: 5px;
                        }
                        .status-completed {
                            background-color: #d4edda;
                            color: #155724;
                        }
                        .status-pending {
                            background-color: #fff3cd;
                            color: #856404;
                        }
                        .status-processing {
                            background-color: #cce5ff;
                            color: #004085;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 20px;
                            font-size: 12px;
                            color: #666;
                        }
                        @media print {
                            body { margin: 0; }
                            .receipt-container { border: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="receipt-container">
                        <div class="header">
                            <div class="company-name">Rosel Meat Shop</div>
                            <div class="receipt-title">Order Receipt</div>
                        </div>
                        
                        <div class="order-info">
                            <h3>Order Information</h3>
                            <div class="info-row">
                                <span class="info-label">Order #:</span>
                                <span>#${order._id.slice(-8).toUpperCase()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Date:</span>
                                <span>${orderDate}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Time:</span>
                                <span>${orderTime}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Status:</span>
                                <span class="status-badge status-${order.computedStatus}">${order.computedStatus.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Payment:</span>
                                <span>${order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Shipping:</span>
                                <span>${order.shippingMethod === 'lalamove' ? 'Delivery' : 'Pickup'}</span>
                            </div>
                        </div>

                        <div class="order-info">
                            <h3>Customer Information</h3>
                            <div class="info-row">
                                <span class="info-label">Name:</span>
                                <span>${order.shippingInfo ? 
                                    `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || 'N/A' : 
                                    'N/A'
                                }</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Phone:</span>
                                <span>${order.shippingInfo?.phone || 'N/A'}</span>
                            </div>
                            <div class="info-row">
                                <span class="info-label">Address:</span>
                                <span>${order.shippingInfo?.fullAddress || 'N/A'}</span>
                            </div>
                        </div>

                        <div class="products-section">
                            <h3>Products</h3>
                            ${order.products.map(item => `
                                <div class="product-item">
                                    <div>
                                        <div class="product-name">${item.product?.name || 'Product'}</div>
                                        <div class="product-details">
                                            ${(() => {
                                                if (item.weightKg) {
                                                    return `${item.weightKg}kg`;
                                                } else if (item.product?.weightOptions && item.product.weightOptions.length > 0) {
                                                    const firstWeight = item.product.weightOptions[0];
                                                    if (firstWeight && firstWeight.weightKg) {
                                                        return `${firstWeight.weightKg}kg`;
                                                    }
                                                }
                                                return '';
                                            })()} • Qty: ${item.quantity}
                                        </div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div>₱${(item.price * item.quantity).toFixed(2)}</div>
                                        <div style="font-size: 12px; color: #666;">₱${item.price.toFixed(2)} each</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <div class="totals">
                            <div class="total-row">
                                <span>Subtotal:</span>
                                <span>₱${order.productSubtotal?.toFixed(2) || order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                            </div>
                            ${order.taxAmount && typeof order.taxAmount === 'number' && order.taxAmount > 0 ? `
                                <div class="total-row">
                                    <span>Tax (12%):</span>
                                    <span>₱${order.taxAmount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${order.coupon && order.coupon.code && order.coupon.discount ? `
                                <div class="total-row" style="color: green;">
                                    <span>Coupon (${order.coupon.code}):</span>
                                    <span>-₱${order.coupon.discount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${order.deliveryFee && typeof order.deliveryFee === 'number' && order.deliveryFee > 0 ? `
                                <div class="total-row">
                                    <span>Delivery Fee:</span>
                                    <span>₱${order.deliveryFee.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            <div class="total-row final-total">
                                <span>Total Amount:</span>
                                <span>₱${order.totalAmount.toFixed(2)}</span>
                            </div>
                        </div>

                        <div class="footer">
                            <p>Thank you for your order!</p>
                            <p>For inquiries, contact us at your registered phone number.</p>
                        </div>
                    </div>
                </body>
            </html>
        `);
        
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-[#fffefc]"
            >
                <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <h2 className="text-xl sm:text-2xl font-bold text-[#860809] font-libre">
                            Order Details
                        </h2>
                        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                            <button
                                onClick={handlePrintReceipt}
                                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice text-xs sm:text-sm"
                                title="Print Receipt"
                            >
                                <Printer className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">Print Receipt</span>
                                <span className="sm:hidden">Print</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <span className={`inline-flex items-center px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusColor(order.computedStatus)}`}>
                                {getStatusIcon(order.computedStatus)} {order.computedStatus.replace('_', ' ')}
                            </span>
                        </div>
                        <p className="text-[#a31f17] font-libre text-xs sm:text-sm">{getStatusDescription(order.computedStatus)}</p>
                    </div>

                    {/* Order Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre">Order Information</h3>
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div className="flex justify-between gap-2">
                                    <span className="text-[#a31f17] font-alice">Order Number:</span>
                                    <span className="font-medium">#{order._id.slice(-8).toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-[#a31f17] font-alice">Order Date:</span>
                                    <span className="font-medium">{new Date(order.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-[#a31f17] font-alice">Payment Status:</span>
                                    <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>
                                        {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-[#a31f17] font-alice">Shipping Method:</span>
                                    <span className="font-medium">{order.shippingMethod === 'lalamove' ? 'Delivery' : 'Pickup'}</span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre">Shipping Information</h3>
                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                                    <span className="text-[#a31f17] font-alice">Recipient:</span>
                                    <span className="font-medium sm:ml-2">
                                        {order.shippingInfo ? 
                                            `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() || 'N/A' : 
                                            'N/A'
                                        }
                                    </span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                                    <span className="text-[#a31f17] font-alice">Phone:</span>
                                    <span className="font-medium sm:ml-2">{order.shippingInfo?.phone || 'N/A'}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-start gap-1">
                                    <span className="text-[#a31f17] font-alice">Address:</span>
                                    <span className="font-medium sm:ml-2">{order.shippingInfo?.fullAddress || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Driver Information (if available) */}
                    {order.lalamoveDetails?.driverName && (
                        <div className="mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre">Driver Information</h3>
                            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
                                <div className="flex items-center gap-2 sm:gap-3">
                                    <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 flex-shrink-0" />
                                    <div>
                                        <p className="font-medium text-gray-900 text-sm sm:text-base">{order.lalamoveDetails.driverName}</p>
                                        <p className="text-xs sm:text-sm text-gray-600">{order.lalamoveDetails.driverPhone}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Products */}
                    <div className="mb-4 sm:mb-6">
                            <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre">Products</h3>
                        <div className="space-y-2 sm:space-y-3">
                            {order.products.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                                    {item.product?.image && (
                                        <img
                                            src={item.product.image}
                                            alt={item.product.name}
                                            className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-[#030105] font-alice text-xs sm:text-sm truncate">
                                            {item.product?.name || 'Product'}
                                            {(() => {
                                                // Try to get weight info from stored data first, then from product data
                                                if (item.weightKg) {
                                                    return ` (${item.weightKg}kg)`;
                                                } else if (item.product?.weightOptions && item.product.weightOptions.length > 0) {
                                                    // If no stored weight info, try to get it from the product's weight options
                                                    const firstWeight = item.product.weightOptions[0];
                                                    if (firstWeight && firstWeight.weightKg) {
                                                        return ` (${firstWeight.weightKg}kg)`;
                                                    }
                                                }
                                                return '';
                                            })()}
                                        </h4>
                                        <p className="text-xs sm:text-sm text-[#a31f17] font-libre">Quantity: {item.quantity}</p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="font-medium text-[#030105] font-libre text-xs sm:text-sm">₱{(item.price * item.quantity).toFixed(2)}</p>
                                        <p className="text-xs text-[#a31f17] font-libre">₱{item.price.toFixed(2)} each</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="border-t pt-3 sm:pt-4">
                        {/* Subtotal */}
                        <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5 sm:mb-2">
                            <span className="text-[#030105] font-alice">Subtotal:</span>
                            <span className="text-[#030105] font-libre">₱{order.productSubtotal?.toFixed(2) || order.products.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}</span>
                        </div>

                        {/* Tax */}
                        {order.taxAmount && typeof order.taxAmount === 'number' && order.taxAmount > 0 ? (
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5 sm:mb-2">
                                <span className="text-[#030105] font-alice">Tax (12%):</span>
                                <span className="text-[#030105] font-libre">₱{order.taxAmount.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Coupon Discount */}
                        {order.coupon && order.coupon.code && order.coupon.discount ? (
                            <div className="flex justify-between items-center text-xs sm:text-sm text-green-600 mb-1.5 sm:mb-2">
                                <span className="font-libre">Coupon Applied: {order.coupon.code}</span>
                                <span className="font-libre">-₱{order.coupon.discount.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Delivery Fee */}
                        {order.deliveryFee && typeof order.deliveryFee === 'number' && order.deliveryFee > 0 ? (
                            <div className="flex justify-between items-center text-xs sm:text-sm mb-1.5 sm:mb-2">
                                <span className="text-[#030105] font-alice">Delivery Fee:</span>
                                <span className="text-[#030105] font-libre">₱{order.deliveryFee.toFixed(2)}</span>
                            </div>
                        ) : null}

                        {/* Total Amount */}
                        <div className="flex justify-between items-center text-base sm:text-lg font-semibold border-t pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
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
