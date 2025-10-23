import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
    Package, 
    Clock, 
    CheckCircle, 
    AlertCircle,
    RefreshCw,
    Filter,
    Search,
    Truck,
    User,
    MapPin,
    Phone,
    Calendar,
    ShoppingCart,
    MessageSquare,
    ChevronDown,
    ChevronUp,
    Edit3,
    Trash2,
    History,
    Settings
} from 'lucide-react';
import { useAdminOrderStore } from '../../store/adminOrderStore';
import AdminLayout from '../../components/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const OrderManagementPage = () => {
    const {
        pendingOrders,
        isLoading,
        error,
        pagination,
        fetchPendingOrders,
        updateOrderStatus,
        placeLalamoveOrder,
        getAdminStatusColor,
        getAdminStatusIcon,
        getAdminStatusDescription,
        getNextStatus,
        needsAction,
        clearError
    } = useAdminOrderStore();

    // Tab state
    const [activeTab, setActiveTab] = useState('manage');

    // Manage Orders state
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedOrders, setExpandedOrders] = useState(new Set());
    const [actionLoading, setActionLoading] = useState({});

    // Orders History state
    const [historyOrders, setHistoryOrders] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState(null);
    const [historyPagination, setHistoryPagination] = useState({});
    const [expandedHistoryOrders, setExpandedHistoryOrders] = useState(new Set());
    
    // History search and filter states
    const [historySearchTerm, setHistorySearchTerm] = useState("");
    const [historyStatusFilter, setHistoryStatusFilter] = useState("");
    const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
    const [historySortBy, setHistorySortBy] = useState("createdAt");
    const [historySortOrder, setHistorySortOrder] = useState("desc");
    
    // Time filter states for history
    const [historyTimeframe, setHistoryTimeframe] = useState('today');
    const [historySelectedDate, setHistorySelectedDate] = useState('');
    const [historyRangeStart, setHistoryRangeStart] = useState('');
    const [historyRangeEnd, setHistoryRangeEnd] = useState('');
    const [historyCustomMode, setHistoryCustomMode] = useState('date');

    // Fetch history orders
    const fetchHistoryOrders = async () => {
        try {
            setHistoryLoading(true);
            setHistoryError(null);
            
            const params = new URLSearchParams({
                page: historyCurrentPage.toString(),
                limit: "10",
                sortBy: historySortBy,
                sortOrder: historySortOrder
            });
            
            console.log('Base params:', params.toString());
            
            if (historySearchTerm) {
                params.append("search", historySearchTerm);
                console.log('Added search param:', historySearchTerm);
            }
            if (historyStatusFilter) {
                params.append("status", historyStatusFilter);
                console.log('Added status param:', historyStatusFilter);
            }
            
            // Add time filter parameters
            if (historyTimeframe !== 'all') {
                params.append("timeframe", historyTimeframe);
                console.log('Added timeframe param:', historyTimeframe);
                
                if (historyTimeframe === 'custom') {
                    if (historyCustomMode === 'date') {
                        if (historySelectedDate) {
                            params.append("date", historySelectedDate);
                            console.log('Added date param:', historySelectedDate);
                        }
                    } else if (historyCustomMode === 'range') {
                        if (historyRangeStart) {
                            params.append("start", historyRangeStart);
                            console.log('Added start param:', historyRangeStart);
                        }
                        if (historyRangeEnd) {
                            params.append("end", historyRangeEnd);
                            console.log('Added end param:', historyRangeEnd);
                        }
                    }
                }
            }
            
            console.log('Final params before API call:', params.toString());
            
            console.log('Time filter params:', {
                timeframe: historyTimeframe,
                selectedDate: historySelectedDate,
                rangeStart: historyRangeStart,
                rangeEnd: historyRangeEnd,
                customMode: historyCustomMode,
                finalParams: params.toString()
            });
            
            // Use different endpoint for history orders if available, otherwise use the same endpoint
            const endpoint = `${API_URL}/admin/orders`;
            const fullUrl = `${endpoint}?${params.toString()}`;
            console.log('Fetching from endpoint:', endpoint);
            console.log('Full URL with params:', fullUrl);
            const response = await axios.get(fullUrl);
            
            let orders = response.data.data.orders;
            
            // Client-side time filtering (workaround for backend not filtering properly)
            if (historyTimeframe !== 'all') {
                const originalCount = orders.length;
                orders = filterOrdersByTimeframe(orders, historyTimeframe, historySelectedDate, historyRangeStart, historyRangeEnd, historyCustomMode);
                console.log(`Time filter applied: ${originalCount} orders → ${orders.length} orders (${historyTimeframe})`);
            }
            
            setHistoryOrders(orders);
            setHistoryPagination(response.data.data.pagination);
        } catch (error) {
            console.error("Error fetching history orders:", error);
            setHistoryError("Failed to fetch orders");
        } finally {
            setHistoryLoading(false);
        }
    };

    // Fetch pending orders on component mount
    useEffect(() => {
        const loadOrders = async () => {
            try {
                await fetchPendingOrders({ 
                    page: currentPage, 
                    status: statusFilter 
                });
            } catch (error) {
                console.error('Error loading orders:', error);
            }
        };

        loadOrders();
    }, [currentPage, statusFilter]);

    // Fetch history orders when tab changes or filters change
    useEffect(() => {
        if (activeTab === 'history') {
            fetchHistoryOrders();
        }
    }, [activeTab, historyCurrentPage, historySearchTerm, historyStatusFilter, historySortBy, historySortOrder, historyTimeframe, historySelectedDate, historyRangeStart, historyRangeEnd, historyCustomMode]);

    // Clear error when component unmounts
    useEffect(() => {
        return () => clearError();
    }, [clearError]);

    // Filter orders based on search term
    const filteredOrders = pendingOrders.filter(order => {
        if (!searchTerm) return true;
        const orderNumber = order._id.slice(-8).toUpperCase();
        const customerName = order.shippingInfo ? 
            `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
            'Unknown';
        return (
            orderNumber.includes(searchTerm.toUpperCase()) ||
            customerName.toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    // History order functions
    const toggleHistoryOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedHistoryOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedHistoryOrders(newExpanded);
    };

    // Reset time filter
    const resetTimeFilter = () => {
        setHistoryTimeframe('all');
        setHistorySelectedDate('');
        setHistoryRangeStart('');
        setHistoryRangeEnd('');
        setHistoryCustomMode('date');
    };

    // Client-side time filtering function
    const filterOrdersByTimeframe = (orders, timeframe, selectedDate, rangeStart, rangeEnd, customMode) => {
        if (!orders || !Array.isArray(orders)) return orders;
        
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        return orders.filter(order => {
            const orderDate = new Date(order.createdAt || order.created || order._id);
            if (isNaN(orderDate.getTime())) return false;
            
            switch (timeframe) {
                case 'today':
                    return orderDate >= today;
                
                case 'week':
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return orderDate >= weekAgo;
                
                case 'month':
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return orderDate >= monthAgo;
                
                case 'year':
                    const yearAgo = new Date(today);
                    yearAgo.setFullYear(yearAgo.getFullYear() - 1);
                    return orderDate >= yearAgo;
                
                case 'custom':
                    if (customMode === 'date' && selectedDate) {
                        const selectedDateObj = new Date(selectedDate);
                        const selectedDateStart = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate());
                        const selectedDateEnd = new Date(selectedDateStart);
                        selectedDateEnd.setDate(selectedDateEnd.getDate() + 1);
                        return orderDate >= selectedDateStart && orderDate < selectedDateEnd;
                    } else if (customMode === 'range' && rangeStart && rangeEnd) {
                        const startDate = new Date(rangeStart);
                        const endDate = new Date(rangeEnd);
                        endDate.setDate(endDate.getDate() + 1); // Include the end date
                        return orderDate >= startDate && orderDate < endDate;
                    }
                    return true;
                
                default:
                    return true;
            }
        });
    };

    const handleHistorySearch = (e) => {
        e.preventDefault();
        setHistoryCurrentPage(1);
        fetchHistoryOrders();
    };

    const handleHistoryFilterChange = (newFilter) => {
        setHistoryStatusFilter(newFilter);
        setHistoryCurrentPage(1);
    };

    const handleHistorySortChange = (newSortBy) => {
        if (historySortBy === newSortBy) {
            setHistorySortOrder(historySortOrder === 'desc' ? 'asc' : 'desc');
        } else {
            setHistorySortBy(newSortBy);
            setHistorySortOrder('desc');
        }
    };

    // Get status color for history orders
    const getHistoryStatusColor = (status) => {
        if (!status) return 'bg-gray-100 text-gray-800';
        
        const statusUpper = status.toUpperCase();
        switch (statusUpper) {
            case 'PENDING':
            case 'ORDER_RECEIVED':
            case 'RECEIVED':
                return 'bg-yellow-100 text-yellow-800';
            case 'CONFIRMED':
            case 'ORDER_CONFIRMED':
            case 'ORDER_PLACED':
                return 'bg-blue-100 text-blue-800';
            case 'PROCESSING':
            case 'ORDER_PREPARED':
            case 'PREPARED':
            case 'IN_PROGRESS':
                return 'bg-purple-100 text-purple-800';
            case 'SHIPPED':
            case 'OUT_FOR_DELIVERY':
            case 'IN_TRANSIT':
            case 'ORDER_PICKED_UP':
                return 'bg-indigo-100 text-indigo-800';
            case 'DELIVERED':
            case 'COMPLETED':
            case 'ORDER_COMPLETED':
            case 'FULFILLED':
            case 'FINISHED':
                return 'bg-green-100 text-green-800';
            case 'CANCELLED':
            case 'CANCELLED_BY_CUSTOMER':
            case 'CANCELLED_BY_ADMIN':
            case 'CANCELED':
                return 'bg-red-100 text-red-800';
            case 'REFUNDED':
            case 'REFUND':
                return 'bg-orange-100 text-orange-800';
            default: 
                console.log('Unknown status:', status);
                return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper functions for Orders History summary statistics
    const getHistoryTotalSales = () => {
        if (!historyOrders || !Array.isArray(historyOrders)) return 0;
        return historyOrders.reduce((sum, order) => sum + (order.totalPrice || order.totalAmount || 0), 0);
    };

    const getHistoryTotalOrders = () => {
        if (!historyOrders || !Array.isArray(historyOrders)) return 0;
        return historyOrders.length;
    };

    const getHistoryTotalItems = () => {
        if (!historyOrders || !Array.isArray(historyOrders)) return 0;
        return historyOrders.reduce((sum, order) => {
            // Try itemsCount first (pre-calculated field)
            if (order.itemsCount !== undefined) {
                return sum + (order.itemsCount || 0);
            }
            // Fallback to calculating from products array
            if (!order.products || !Array.isArray(order.products)) return sum;
            return sum + order.products.reduce((itemSum, item) => itemSum + (item.quantity || 0), 0);
        }, 0);
    };

    const getHistoryAverageOrder = () => {
        if (!historyOrders || !Array.isArray(historyOrders) || historyOrders.length === 0) return 0;
        return getHistoryTotalSales() / historyOrders.length;
    };

  const handleGenerateOrdersCsv = () => {
    try {
      const csvEscape = (v) => {
        const s = String(v ?? "");
        const needsQuotes = /[",\n\r]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };

      const header = [
        'orderId',
        'customerName',
        'customerEmail',
        'items',
        'amount',
        'created',
        'status',
        'productsOrdered',
        'shippingRecipient',
        'shippingAddress',
        'shippingPhone',
        'shippingMethod',
        'paymentStatus',
        'adminStatus',
        'referenceNumber'
      ];
      const lines = [header.join(',')];

      (historyOrders || []).forEach((o) => {
        const orderId = csvEscape(o.orderId || o._id || "");
        const customerName = csvEscape(o.customerName || `${o?.shippingInfo?.firstName || ''} ${o?.shippingInfo?.lastName || ''}`.trim());
        const customerEmail = csvEscape(o.customerEmail || o?.shippingInfo?.email || '');
        const items = csvEscape(o.itemsCount ?? (Array.isArray(o.products) ? o.products.reduce((sum,it)=>sum+(it.quantity||0),0) : 0));
        const amount = csvEscape((o.totalPrice ?? o.totalAmount ?? 0).toFixed ? (o.totalPrice ?? o.totalAmount ?? 0).toFixed(2) : (Number(o.totalPrice ?? o.totalAmount ?? 0)).toFixed(2));
        const created = csvEscape(o.created || o.createdAt || "");
        const status = csvEscape(o.computedStatus || o.status || '');

        const productsOrdered = (Array.isArray(o.products) ? o.products : []).map((it) => {
          const name = it?.product?.name || it?.name || '';
          const qty = it?.quantity ?? 0;
          const price = it?.price ?? it?.product?.price ?? 0;
          return `${name} x${qty} @${price}`;
        }).join(' | ');

        const shippingRecipient = csvEscape(`${o?.shippingInfo?.firstName || ''} ${o?.shippingInfo?.lastName || ''}`.trim());
        const shippingAddress = csvEscape(o?.shippingInfo?.fullAddress || '');
        const shippingPhone = csvEscape(o?.shippingInfo?.phone || '');
        const shippingMethod = csvEscape(o?.shippingMethod || '');
        const paymentStatus = csvEscape(o?.paymentStatus || '');
        const adminStatus = csvEscape(o?.adminStatus || '');
        const referenceNumber = csvEscape(
          (o?.payment && (o.payment.referenceNumber || o.payment.refNumber)) ||
          o?.referenceNumber ||
          o?.stripeSessionId ||
          ''
        );

        lines.push([
          orderId,
          customerName,
          customerEmail,
          items,
          amount,
          created,
          status,
          csvEscape(productsOrdered),
          shippingRecipient,
          shippingAddress,
          shippingPhone,
          shippingMethod,
          paymentStatus,
          adminStatus,
          referenceNumber
        ].join(','));
      });

      const blob = new Blob([lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date();
      const pad = (n) => String(n).padStart(2,'0');
      a.setAttribute('download', `orders_report_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate orders CSV:', e);
    }
  };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const toggleOrderExpansion = (orderId) => {
        const newExpanded = new Set(expandedOrders);
        if (newExpanded.has(orderId)) {
            newExpanded.delete(orderId);
        } else {
            newExpanded.add(orderId);
        }
        setExpandedOrders(newExpanded);
    };

    const handleStatusUpdate = async (orderId, newStatus, notes = '') => {
        setActionLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            await updateOrderStatus(orderId, newStatus, notes);
            toast.success('Order status updated successfully');
        } catch (error) {
            toast.error('Failed to update order status');
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const handlePlaceLalamoveOrder = async (orderId) => {
        setActionLoading(prev => ({ ...prev, [orderId]: true }));
        try {
            await placeLalamoveOrder(orderId);
            toast.success('Lalamove order placed successfully');
        } catch (error) {
            toast.error('Failed to place Lalamove order');
        } finally {
            setActionLoading(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        
        // Handle MongoDB ObjectId timestamps (24 character hex strings)
        if (typeof dateString === 'string' && dateString.length === 24 && /^[0-9a-fA-F]{24}$/.test(dateString)) {
            try {
                const timestamp = parseInt(dateString.substring(0, 8), 16) * 1000;
                const date = new Date(timestamp);
                if (!isNaN(date.getTime()) && date.getTime() > 0) {
                    return date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    });
                }
            } catch (e) {
                // Fall through to regular date parsing
            }
        }
        
        // Handle regular date strings (ISO format, etc.)
        const date = new Date(dateString);
        
        // Check if the date is valid AND not the Unix epoch start (Jan 1, 1970, 00:00:00 UTC)
        if (isNaN(date.getTime()) || date.getTime() === 0) {
            return 'N/A';
        }
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const getActionButton = (order) => {
        const nextStatus = getNextStatus(order.adminStatus);
        const isLalamoveOrder = order.shippingMethod === 'lalamove';
        const isRebookable = isLalamoveOrder && ['pending_placement','failed','cancelled','expired','REJECTED','CANCELED','EXPIRED'].includes(order.lalamoveDetails?.status);
        const isReadyForPlacement = isRebookable && ['order_prepared','order_placed'].includes(order.adminStatus);

        // Only allow placement when admin has set status to prepared
        if (isReadyForPlacement) {
            return (
                <button
                    onClick={() => handlePlaceLalamoveOrder(order._id)}
                    disabled={actionLoading[order._id]}
                    className="w-full lg:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-alice"
                >
                    <Truck size={14} className="sm:w-4 sm:h-4" />
                    <span>{actionLoading[order._id] ? 'Placing...' : 'Place Lalamove Order'}</span>
                </button>
            );
        }

        if (nextStatus) {
            return (
                <button
                    onClick={() => handleStatusUpdate(order._id, nextStatus)}
                    disabled={actionLoading[order._id]}
                    className="w-full lg:w-auto px-3 sm:px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 font-alice"
                >
                    <CheckCircle size={14} className="sm:w-4 sm:h-4" />
                    <span>{actionLoading[order._id] ? 'Updating...' : `Mark as ${nextStatus.replace('order_', '').replace('_', ' ')}`}</span>
                </button>
            );
        }

        return null;
    };

    if (isLoading && pendingOrders.length === 0 && activeTab === 'manage') {
        return (
            <AdminLayout>
                <div className="py-8">
                    <div className="relative z-10 container mx-auto px-4">
                        <LoadingSpinner />
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="py-4 sm:py-6 md:py-8 bg-[#f8f3ed] min-h-screen">
                <div className="relative z-10 container mx-auto px-3 sm:px-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre">Order Management</h1>
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-[#a31f17] font-alice">
                            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
                            <span>
                                {activeTab === 'manage' 
                                    ? `Pending Orders: ${pagination?.totalOrders || 0}`
                                    : `Total Orders: ${historyPagination?.totalOrders || 0}`
                                }
                            </span>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="mb-4 sm:mb-6">
                        <div className="border-b border-gray-300">
                            <nav className="-mb-px flex space-x-4 sm:space-x-8">
                                <button
                                    onClick={() => setActiveTab('manage')}
                                    className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm font-alice ${
                                        activeTab === 'manage'
                                            ? 'border-[#860809] text-[#860809]'
                                            : 'border-transparent text-[#030105] hover:text-[#860809] hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <Settings size={14} className="sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline">Manage Orders</span>
                                        <span className="xs:hidden">Manage</span>
                                    </div>
                                </button>
                                <button
                                    onClick={() => setActiveTab('history')}
                                    className={`py-2 px-1 border-b-2 font-medium text-xs sm:text-sm font-alice ${
                                        activeTab === 'history'
                                            ? 'border-[#860809] text-[#860809]'
                                            : 'border-transparent text-[#030105] hover:text-[#860809] hover:border-gray-300'
                                    }`}
                                >
                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        <History size={14} className="sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline">Orders History</span>
                                        <span className="xs:hidden">History</span>
                                    </div>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'manage' ? (
                        <>
                            {/* Search and Filter Section for Manage Orders */}
                            <motion.div
                                className="bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                                    {/* Search */}
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-[#a31f17] h-4 w-4 sm:h-5 sm:w-5" />
                                            <input
                                                type="text"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                                placeholder="Search..."
                                                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105] font-alice"
                                            />
                                        </div>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="sm:w-48">
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105] font-alice"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="order_received">Order Received</option>
                                            <option value="order_preparing">Order Preparing</option>
                                            <option value="order_prepared">Order Prepared</option>
                                            <option value="order_placed">Order Placed</option>
                                            <option value="order_picked_up">Order Picked Up</option>
                                            <option value="order_completed">Order Completed</option>
                                        </select>
                                    </div>

                                    {/* Refresh Button */}
                                    <button
                                        onClick={() => fetchPendingOrders({ page: currentPage, status: statusFilter })}
                                        className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#860809] text-white rounded-md hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors duration-200 flex items-center justify-center gap-2 font-alice whitespace-nowrap"
                                    >
                                        <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                                        <span className="hidden xs:inline">Refresh</span>
                                        <span className="xs:hidden">⟳</span>
                                    </button>
                                </div>
                            </motion.div>
                        </>
                    ) : (
                        <>
                            {/* Search and Filter Section for Orders History */}
                            <motion.div
                                className="bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="flex flex-col gap-2 sm:gap-3 md:gap-4">
                                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                                        {/* Search */}
                                        <div className="flex-1">
                                            <form onSubmit={handleHistorySearch} className="relative">
                                                <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-[#a31f17] h-4 w-4 sm:h-5 sm:w-5" />
                                                <input
                                                    type="text"
                                                    value={historySearchTerm}
                                                    onChange={(e) => setHistorySearchTerm(e.target.value)}
                                                    placeholder="Search..."
                                                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105] font-alice"
                                                />
                                            </form>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="sm:w-48">
                                            <select
                                                value={historyStatusFilter}
                                                onChange={(e) => handleHistoryFilterChange(e.target.value)}
                                                className="w-full px-2 sm:px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105] font-alice"
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

                                    {/* Buttons Row */}
                                    <div className="flex flex-col sm:flex-row gap-2">
                                        <button
                                            onClick={fetchHistoryOrders}
                                            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#860809] text-white rounded-md hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors duration-200 flex items-center justify-center gap-2 font-alice whitespace-nowrap"
                                        >
                                            <RefreshCw size={14} className="sm:w-4 sm:h-4" />
                                            <span className="hidden sm:inline">Refresh</span>
                                            <span className="sm:hidden">⟳</span>
                                        </button>
                                        <button
                                            onClick={handleGenerateOrdersCsv}
                                            className="flex-1 px-3 sm:px-4 py-2 text-sm sm:text-base bg-[#a31f17] text-white rounded-md hover:opacity-90 active:opacity-90 transition-colors duration-200 font-alice text-center"
                                        >
                                            <span className="hidden sm:inline">Generate Orders Report</span>
                                            <span className="sm:hidden">Generate Report</span>
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}

                    {/* Orders List */}
                    <motion.div
                        className="bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 overflow-hidden"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {activeTab === 'manage' ? (
                            // Manage Orders Content
                            <>
                                {error ? (
                                    <div className="p-4 sm:p-8 text-center text-red-600 text-sm sm:text-base">
                                        {error}
                                    </div>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="p-4 sm:p-8 text-center text-[#030105] text-sm sm:text-base">
                                        No pending orders found
                                    </div>
                                ) : (
                            <>
                                {/* Desktop Table Header - Hidden on mobile */}
                                <div className="hidden lg:block bg-[#860809] px-6 py-4">
                                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-white uppercase tracking-wider font-alice">
                                        <div className="col-span-1"></div>
                                        <div className="col-span-2">Order ID</div>
                                        <div className="col-span-2">Customer</div>
                                        <div className="col-span-1">Items</div>
                                        <div className="col-span-1">Amount</div>
                                        <div className="col-span-2">Created</div>
                                        <div className="col-span-1">Status</div>
                                        <div className="col-span-2">Actions</div>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="divide-y divide-gray-300">
                                    {filteredOrders.map((order) => (
                                        <div key={order._id}>
                                            {/* Desktop Table Row - Hidden on mobile */}
                                            <div className="hidden lg:block px-6 py-4 hover:bg-[#f8f3ed] hover:bg-opacity-30 transition-colors duration-200">
                                                <div className="grid grid-cols-12 gap-4 items-center">
                                                    {/* Expand/Collapse Button */}
                                                    <div className="col-span-1">
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order._id)}
                                                            className="p-1 rounded hover:bg-[#f8f3ed] transition-colors duration-200"
                                                        >
                                                            {expandedOrders.has(order._id) ? '−' : '+'}
                                                        </button>
                                                    </div>

                                                    {/* Order ID */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm font-medium text-[#030105]">
                                                            #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                                        </div>
                                                    </div>

                                                    {/* Customer */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm text-[#030105]">
                                                            <div className="font-medium">
                                                                {order.customerName || 
                                                                 (order.shippingInfo ? 
                                                                  `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
                                                                  'Unknown Customer'
                                                                 )
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order.customerEmail || 
                                                                 (order.shippingInfo?.email || 'No email')
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Items Count */}
                                                    <div className="col-span-1">
                                                        <div className="text-sm text-[#030105] flex items-center">
                                                            <ShoppingCart className="h-4 w-4 mr-1" />
                                                            {order.itemsCount || 
                                                             (order.products ? 
                                                              order.products.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
                                                              0
                                                             )
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="col-span-1">
                                                        <div className="text-sm font-medium text-[#030105] flex items-center">
                                                            ₱{(order.totalPrice || order.totalAmount || 0).toFixed(2)}
                                                        </div>
                                                    </div>

                                                    {/* Created Date */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm text-[#030105] flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {formatDate(order.createdAt || order.created || order._id)}
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="col-span-1">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAdminStatusColor(order.adminStatus)}`}>
                                                            {getAdminStatusIcon(order.adminStatus)} {order.adminStatus.replace('order_', '').replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="col-span-2">
                                                        <div className="flex items-center gap-2">
                                                            {getActionButton(order)}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Card View - Hidden on desktop */}
                                            <div className="lg:hidden p-3 sm:p-4 hover:bg-[#f8f3ed] hover:bg-opacity-30 transition-colors duration-200">
                                                <div className="space-y-3">
                                                    {/* Order Header */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-semibold text-[#860809] font-alice mb-1">
                                                                #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                                            </div>
                                                            <div className="text-sm text-[#030105] font-alice">
                                                                {order.customerName || 
                                                                 (order.shippingInfo ? 
                                                                  `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
                                                                  'Unknown Customer'
                                                                 )
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order.customerEmail || 
                                                                 (order.shippingInfo?.email || 'No email')
                                                                }
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleOrderExpansion(order._id)}
                                                            className="p-2 rounded-full bg-[#f8f3ed] hover:bg-[#860809] hover:text-white transition-colors duration-200 flex-shrink-0"
                                                        >
                                                            {expandedOrders.has(order._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>

                                                    {/* Order Info Grid */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            <ShoppingCart className="h-3.5 w-3.5 text-[#a31f17]" />
                                                            <span className="text-gray-600">Items:</span>
                                                            <span className="font-medium">
                                                                {order.itemsCount || 
                                                                 (order.products ? 
                                                                  order.products.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
                                                                  0
                                                                 )
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-gray-600">Amount:</span>
                                                            <span className="font-semibold text-[#860809]">
                                                                ₱{(order.totalPrice || order.totalAmount || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 col-span-2">
                                                            <Calendar className="h-3.5 w-3.5 text-[#a31f17]" />
                                                            <span className="text-gray-600">Date:</span>
                                                            <span className="text-xs">
                                                                {formatDate(order.createdAt || order.created || order._id)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div>
                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getAdminStatusColor(order.adminStatus)}`}>
                                                            {getAdminStatusIcon(order.adminStatus)} {order.adminStatus.replace('order_', '').replace('_', ' ')}
                                                        </span>
                                                    </div>

                                                    {/* Action Button */}
                                                    <div className="pt-2">
                                                        {getActionButton(order)}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Products Section */}
                                            {expandedOrders.has(order._id) && (
                                                <motion.div
                                                    className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-[#f7e9b8]"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                                        {/* Products */}
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-medium text-[#030105] mb-2 sm:mb-3 font-alice">Products Ordered:</h4>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                {order.products.map((item, index) => {
                                                                    const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
                                                                    return (
                                                                        <div key={index} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                            <img
                                                                                src={item.product?.image || '/placeholder-product.jpg'}
                                                                                alt={item.product?.name || 'Product'}
                                                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0"
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-xs sm:text-sm font-medium text-[#030105] font-alice truncate">
                                                                                    {item.product?.name || 'Unknown Product'}{weightInfo}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    Qty: {item.quantity} × ₱{(item.price || 0).toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs sm:text-sm font-medium text-[#030105] whitespace-nowrap">
                                                                                ₱{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Order Details */}
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-medium text-[#030105] mb-2 sm:mb-3 font-alice">Order Details:</h4>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                    <div className="text-xs sm:text-sm text-[#030105]">
                                                                        <div className="font-medium mb-1.5 sm:mb-2 font-alice">Shipping Information:</div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                <User size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                                                                                <span className="break-words">{order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                <Phone size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                                                                                <span className="break-all">{order.shippingInfo?.phone}</span>
                                                                            </div>
                                                                            <div className="flex items-start gap-1.5 sm:gap-2">
                                                                                <MapPin size={11} className="sm:w-3 sm:h-3 flex-shrink-0 mt-0.5" />
                                                                                <span className="break-words">{order.shippingInfo?.fullAddress}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                    <div className="text-xs sm:text-sm text-[#030105]">
                                                                        <div className="font-medium mb-1.5 sm:mb-2 font-alice">Status Information:</div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="break-words">Current Status: {getAdminStatusDescription(order.adminStatus)}</div>
                                                                            <div className="break-words">Payment Status: {order.paymentStatus}</div>
                                                                            <div className="break-words">Shipping Method: {order.shippingMethod}</div>
                                                                            {order.lalamoveDetails && (
                                                                                <div className="break-words">Lalamove Status: {order.lalamoveDetails.status}</div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                                )}
                            </>
                        ) : (
                            // Orders History Content
                            <>
                                {historyLoading ? (
                                    <div className="p-8 text-center">
                                        <RefreshCw className="w-8 h-8 text-[#a31f17] animate-spin mx-auto mb-2" />
                                        <p className="text-[#a48674]">Loading orders...</p>
                                    </div>
                                ) : historyError ? (
                                    <div className="p-8 text-center text-red-600">
                                        {historyError}
                                    </div>
                                ) : historyOrders.length === 0 ? (
                                    <div className="p-8 text-center text-[#030105]">
                                        No orders found
                                    </div>
                                ) : (
                            <>
                                {/* Summary Cards for Orders History */}
                                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-6 px-3 sm:px-0">
                                    <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[#a31f17] mb-1 font-alice">New Orders</p>
                                                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#860809] font-libre">
                                                    {getHistoryTotalOrders()}
                                                </p>
                                            </div>
                                            <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#a31f17] flex-shrink-0" />
                                        </div>
                                    </div>

                                    <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[#a31f17] mb-1 font-alice">Total Items</p>
                                                <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#860809] font-libre">
                                                    {getHistoryTotalItems()}
                                                </p>
                                            </div>
                                            <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#a31f17] flex-shrink-0" />
                                        </div>
                                    </div>

                                    <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[#a31f17] mb-1 font-alice">Total Revenue</p>
                                                <p className="text-sm sm:text-lg md:text-2xl font-bold text-[#860809] font-libre truncate">
                                                    {formatCurrency(getHistoryTotalSales())}
                                                </p>
                                            </div>
                                            <span className="text-lg sm:text-xl md:text-2xl font-bold text-[#a31f17] flex-shrink-0">₱</span>
                                        </div>
                                    </div>

                                    <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 md:p-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs sm:text-sm text-[#a31f17] mb-1 font-alice">Average Value</p>
                                                <p className="text-sm sm:text-lg md:text-2xl font-bold text-[#860809] font-libre truncate">
                                                    {formatCurrency(getHistoryAverageOrder())}
                                                </p>
                                            </div>
                                            <User className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#a31f17] flex-shrink-0" />
                                        </div>
                                    </div>
                                </div>

                                {/* Time Filter */}
                                <div className='px-3 sm:px-0 mb-4 sm:mb-6'>
                                    <div className='bg-[#f8f3ed] p-2 sm:p-3 rounded-lg'>
                                        <div className='flex flex-wrap items-center justify-center gap-2 mb-2'>
                                            <span className='text-xs sm:text-sm font-medium text-[#a31f17] font-alice'>Time Filter:</span>
                                            {[
                                                { key: 'today', label: 'Today' },
                                                { key: 'week', label: 'Week' },
                                                { key: 'month', label: 'Month' },
                                                { key: 'year', label: 'Year' },
                                                { key: 'custom', label: 'Custom' },
                                                { key: 'all', label: 'All' },
                                            ].map((option) => (
                                                <button
                                                    key={option.key}
                                                    onClick={() => {
                                                        setHistoryTimeframe(option.key);
                                                        if (option.key !== 'custom') {
                                                            setHistorySelectedDate('');
                                                            setHistoryRangeStart('');
                                                            setHistoryRangeEnd('');
                                                        }
                                                    }}
                                                    className={`${
                                                        historyTimeframe === option.key
                                                            ? 'bg-[#860809] text-white'
                                                            : 'bg-white text-[#030105]'
                                                    } px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 font-alice hover:bg-[#860809] hover:text-white active:bg-[#a31f17]`}
                                                >
                                                    {option.label}
                                                </button>
                                            ))}
                                            <button
                                                onClick={resetTimeFilter}
                                                className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium bg-[#f7e9b8] text-[#030105] hover:bg-[#e6d4a3] active:bg-[#e6d4a3] transition-colors duration-200 font-alice"
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        {historyTimeframe === 'custom' && (
                                            <div className='mt-3 space-y-2'>
                                                <div className='flex flex-wrap gap-2 justify-center'>
                                                    <button onClick={()=>setHistoryCustomMode('date')} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-alice ${historyCustomMode==='date' ? 'bg-[#860809] text-white' : 'bg-white text-[#030105]'}`}>Select Date</button>
                                                    <button onClick={()=>setHistoryCustomMode('range')} className={`px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-alice ${historyCustomMode==='range' ? 'bg-[#860809] text-white' : 'bg-white text-[#030105]'}`}>Range</button>
                                                </div>
                                                {historyCustomMode === 'date' && (
                                                    <div className='flex flex-wrap items-center justify-center gap-2'>
                                                        <input
                                                            type='date'
                                                            value={historySelectedDate}
                                                            onChange={(e)=>{ setHistorySelectedDate(e.target.value); }}
                                                            className='px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] max-w-[150px]'
                                                        />
                                                        {historySelectedDate && (
                                                            <button onClick={()=>setHistorySelectedDate('')} className='px-2 py-1 rounded-md text-xs sm:text-sm bg-[#f7e9b8] text-[#030105]'>Clear</button>
                                                        )}
                                                    </div>
                                                )}
                                                {historyCustomMode === 'range' && (
                                                    <div className='flex flex-wrap items-center justify-center gap-2'>
                                                        <input
                                                            type='date'
                                                            value={historyRangeStart}
                                                            onChange={(e)=>{ setHistoryRangeStart(e.target.value); }}
                                                            className='px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] max-w-[150px]'
                                                        />
                                                        <span className='text-[#030105] text-xs sm:text-sm'>to</span>
                                                        <input
                                                            type='date'
                                                            value={historyRangeEnd}
                                                            onChange={(e)=>{ setHistoryRangeEnd(e.target.value); }}
                                                            className='px-2 py-1 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] max-w-[150px]'
                                                        />
                                                        {(historyRangeStart || historyRangeEnd) && (
                                                            <button onClick={()=>{ setHistoryRangeStart(''); setHistoryRangeEnd(''); }} className='px-2 py-1 rounded-md text-xs sm:text-sm bg-[#f7e9b8] text-[#030105]'>Clear</button>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Desktop Table Header - Hidden on mobile */}
                                <div className="hidden lg:block bg-[#860809] px-6 py-4">
                                    <div className="grid grid-cols-11 gap-4 text-sm font-medium text-white uppercase tracking-wider font-alice">
                                        <div className="col-span-1"></div>
                                        <div className="col-span-2">
                                            Order ID
                                        </div>
                                        <div className="col-span-2 flex items-center gap-1">
                                            Customer
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => handleHistorySortChange('customerName')}
                                                    className={`p-0.5 ${historySortBy === 'customerName' && historySortOrder === 'asc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleHistorySortChange('customerName')}
                                                    className={`p-0.5 ${historySortBy === 'customerName' && historySortOrder === 'desc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-center gap-1">
                                            Items
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => handleHistorySortChange('itemsCount')}
                                                    className={`p-0.5 ${historySortBy === 'itemsCount' && historySortOrder === 'asc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleHistorySortChange('itemsCount')}
                                                    className={`p-0.5 ${historySortBy === 'itemsCount' && historySortOrder === 'desc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-center gap-1">
                                            Amount
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => handleHistorySortChange('totalAmount')}
                                                    className={`p-0.5 ${historySortBy === 'totalAmount' && historySortOrder === 'asc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleHistorySortChange('totalAmount')}
                                                    className={`p-0.5 ${historySortBy === 'totalAmount' && historySortOrder === 'desc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-2 flex items-center gap-1">
                                            Created
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => handleHistorySortChange('createdAt')}
                                                    className={`p-0.5 ${historySortBy === 'createdAt' && historySortOrder === 'asc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleHistorySortChange('createdAt')}
                                                    className={`p-0.5 ${historySortBy === 'createdAt' && historySortOrder === 'desc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="col-span-1 flex items-center gap-1">
                                            Status
                                            <div className="flex flex-col">
                                                <button
                                                    onClick={() => handleHistorySortChange('status')}
                                                    className={`p-0.5 ${historySortBy === 'status' && historySortOrder === 'asc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => handleHistorySortChange('status')}
                                                    className={`p-0.5 ${historySortBy === 'status' && historySortOrder === 'desc' ? 'text-[#860809]' : 'text-gray-400'}`}
                                                >
                                                    <ChevronDown size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Orders List */}
                                <div className="divide-y divide-gray-300">
                                    {historyOrders.map((order) => (
                                        <div key={order._id}>
                                            {/* Desktop Table Row - Hidden on mobile */}
                                            <div className="hidden lg:block px-6 py-4 hover:bg-[#f8f3ed] hover:bg-opacity-30 transition-colors duration-200">
                                                <div className="grid grid-cols-11 gap-4 items-center">
                                                    {/* Expand/Collapse Button */}
                                                    <div className="col-span-1">
                                                        <button
                                                            onClick={() => toggleHistoryOrderExpansion(order._id)}
                                                            className="p-1 rounded hover:bg-[#f7e9b8] transition-colors duration-200"
                                                        >
                                                            {expandedHistoryOrders.has(order._id) ? '−' : '+'}
                                                        </button>
                                                    </div>

                                                    {/* Order ID */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm font-medium text-[#030105]">
                                                            #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                                        </div>
                                                    </div>

                                                    {/* Customer */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm text-[#030105]">
                                                            <div className="font-medium">
                                                                {order.customerName || 
                                                                 (order.shippingInfo ? 
                                                                  `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
                                                                  'Unknown Customer'
                                                                 )
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order.customerEmail || 
                                                                 (order.shippingInfo?.email || 'No email')
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Items Count */}
                                                    <div className="col-span-1">
                                                        <div className="text-sm text-[#030105] flex items-center">
                                                            <ShoppingCart className="h-4 w-4 mr-1" />
                                                            {order.itemsCount || 
                                                             (order.products ? 
                                                              order.products.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
                                                              0
                                                             )
                                                            }
                                                        </div>
                                                    </div>

                                                    {/* Amount */}
                                                    <div className="col-span-1">
                                                        <div className="text-sm font-medium text-[#030105] flex items-center">
                                                            ₱{(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                                                        </div>
                                                    </div>

                                                    {/* Created Date */}
                                                    <div className="col-span-2">
                                                        <div className="text-sm text-[#030105] flex items-center">
                                                            <Calendar className="h-4 w-4 mr-1" />
                                                            {formatDate(order.createdAt || order.created || order._id)}
                                                        </div>
                                                    </div>

                                                    {/* Status */}
                                                    <div className="col-span-1">
                                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getHistoryStatusColor(order.adminStatus || order.status || order.computedStatus || order.orderStatus)}`}>
                                                            {order.adminStatus || order.status || order.computedStatus || order.orderStatus || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Mobile Card View - Hidden on desktop */}
                                            <div className="lg:hidden p-3 sm:p-4 hover:bg-[#f8f3ed] hover:bg-opacity-30 transition-colors duration-200">
                                                <div className="space-y-3">
                                                    {/* Order Header */}
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <div className="text-sm font-semibold text-[#860809] font-alice mb-1">
                                                                #{order.orderId || order._id?.slice(-8).toUpperCase() || 'N/A'}
                                                            </div>
                                                            <div className="text-sm text-[#030105] font-alice">
                                                                {order.customerName || 
                                                                 (order.shippingInfo ? 
                                                                  `${order.shippingInfo.firstName || ''} ${order.shippingInfo.lastName || ''}`.trim() : 
                                                                  'Unknown Customer'
                                                                 )
                                                                }
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {order.customerEmail || 
                                                                 (order.shippingInfo?.email || 'No email')
                                                                }
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => toggleHistoryOrderExpansion(order._id)}
                                                            className="p-2 rounded-full bg-[#f8f3ed] hover:bg-[#860809] hover:text-white transition-colors duration-200 flex-shrink-0"
                                                        >
                                                            {expandedHistoryOrders.has(order._id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                        </button>
                                                    </div>

                                                    {/* Order Info Grid */}
                                                    <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            <ShoppingCart className="h-3.5 w-3.5 text-[#a31f17]" />
                                                            <span className="text-gray-600">Items:</span>
                                                            <span className="font-medium">
                                                                {order.itemsCount || 
                                                                 (order.products ? 
                                                                  order.products.reduce((sum, item) => sum + (item.quantity || 0), 0) : 
                                                                  0
                                                                 )
                                                                }
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-gray-600">Amount:</span>
                                                            <span className="font-semibold text-[#860809]">
                                                                ₱{(order.totalAmount || order.totalPrice || 0).toFixed(2)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5 col-span-2">
                                                            <Calendar className="h-3.5 w-3.5 text-[#a31f17]" />
                                                            <span className="text-gray-600">Date:</span>
                                                            <span className="text-xs">
                                                                {formatDate(order.createdAt || order.created || order._id)}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Status Badge */}
                                                    <div>
                                                        <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full ${getHistoryStatusColor(order.adminStatus || order.status || order.computedStatus || order.orderStatus)}`}>
                                                            {order.adminStatus || order.status || order.computedStatus || order.orderStatus || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded Products Section */}
                                            {expandedHistoryOrders.has(order._id) && (
                                                <motion.div
                                                    className="bg-gray-50 px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-t border-[#f7e9b8]"
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                                        {/* Products */}
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-medium text-[#030105] mb-2 sm:mb-3 font-alice">Products Ordered:</h4>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                {order.products.map((item, index) => {
                                                                    const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
                                                                    return (
                                                                        <div key={index} className="flex items-center gap-2 sm:gap-4 p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                            <img
                                                                                src={item.product?.image || '/placeholder-product.jpg'}
                                                                                alt={item.product?.name || 'Product'}
                                                                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-lg object-cover flex-shrink-0"
                                                                            />
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="text-xs sm:text-sm font-medium text-[#030105] font-alice truncate">
                                                                                    {item.product?.name || 'Unknown Product'}{weightInfo}
                                                                                </div>
                                                                                <div className="text-xs text-gray-500">
                                                                                    Qty: {item.quantity} × ₱{(item.price || 0).toFixed(2)}
                                                                                </div>
                                                                            </div>
                                                                            <div className="text-xs sm:text-sm font-medium text-[#030105] whitespace-nowrap">
                                                                                ₱{((item.quantity || 0) * (item.price || 0)).toFixed(2)}
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>

                                                        {/* Order Details */}
                                                        <div>
                                                            <h4 className="text-xs sm:text-sm font-medium text-[#030105] mb-2 sm:mb-3 font-alice">Order Details:</h4>
                                                            <div className="space-y-2 sm:space-y-3">
                                                                {/* Order Summary */}
                                                                <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                    <div className="text-xs sm:text-sm text-[#030105]">
                                                                        <div className="font-medium mb-1.5 sm:mb-2 font-alice">Order Summary:</div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex justify-between">
                                                                                <span>Subtotal:</span>
                                                                                <span>₱{order.productSubtotal?.toFixed(2) || '0.00'}</span>
                                                                            </div>
                                                                            {order.coupon?.code && (
                                                                                <div className="flex justify-between text-green-600">
                                                                                    <span>Coupon ({order.coupon.code}):</span>
                                                                                    <span>-₱{order.coupon.discount?.toFixed(2) || '0.00'}</span>
                                                                                </div>
                                                                            )}
                                                                            {order.deliveryFee > 0 && (
                                                                                <div className="flex justify-between">
                                                                                    <span>Delivery Fee:</span>
                                                                                    <span>₱{order.deliveryFee.toFixed(2)}</span>
                                                                                </div>
                                                                            )}
                                                                            <div className="flex justify-between font-medium border-t pt-1">
                                                                                <span>Total:</span>
                                                                                <span>₱{order.totalAmount?.toFixed(2) || '0.00'}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                    <div className="text-xs sm:text-sm text-[#030105]">
                                                                        <div className="font-medium mb-1.5 sm:mb-2 font-alice">Shipping Information:</div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                <User size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                                                                                <span className="break-words">{order.shippingInfo?.firstName} {order.shippingInfo?.lastName}</span>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 sm:gap-2">
                                                                                <Phone size={11} className="sm:w-3 sm:h-3 flex-shrink-0" />
                                                                                <span className="break-all">{order.shippingInfo?.phone}</span>
                                                                            </div>
                                                                            <div className="flex items-start gap-1.5 sm:gap-2">
                                                                                <MapPin size={11} className="sm:w-3 sm:h-3 flex-shrink-0 mt-0.5" />
                                                                                <span className="break-words">{order.shippingInfo?.fullAddress}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>

                                                                <div className="p-2 sm:p-3 bg-white rounded-lg border border-[#f7e9b8]">
                                                                    <div className="text-xs sm:text-sm text-[#030105]">
                                                                        <div className="font-medium mb-1.5 sm:mb-2 font-alice">Status Information:</div>
                                                                        <div className="space-y-1 text-xs">
                                                                            <div className="break-words">Current Status: {order.status}</div>
                                                                            <div className="break-words">Payment Status: {order.paymentStatus}</div>
                                                                            <div className="break-words">Shipping Method: {order.shippingMethod}</div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </>
                                )}
                            </>
                        )}
                    </motion.div>

                    {/* Pagination */}
                    {activeTab === 'manage' ? (
                        // Manage Orders Pagination
                        pagination && pagination.totalPages > 1 && (
                            <motion.div
                                className="flex flex-col items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 px-3 sm:px-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="text-xs sm:text-sm text-[#030105] font-alice text-center w-full">
                                    Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalOrders)} of {pagination.totalOrders}
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                    <button
                                        onClick={() => setCurrentPage(currentPage - 1)}
                                        disabled={!pagination.hasPrevPage}
                                        className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] active:bg-[#f7e9b8] active:scale-95 transition-all duration-200 font-alice min-w-[60px] sm:min-w-[70px]"
                                    >
                                        Prev
                                    </button>
                                    
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        {(() => {
                                            const totalPages = pagination.totalPages;
                                            const current = currentPage;
                                            const maxVisible = window.innerWidth < 640 ? 3 : 5;
                                            let pages = [];
                                            
                                            if (totalPages <= maxVisible) {
                                                pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                                            } else {
                                                const half = Math.floor(maxVisible / 2);
                                                let start = Math.max(1, current - half);
                                                let end = Math.min(totalPages, start + maxVisible - 1);
                                                
                                                if (end - start < maxVisible - 1) {
                                                    start = Math.max(1, end - maxVisible + 1);
                                                }
                                                
                                                pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                                            }
                                            
                                            return pages.map((pageNum) => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setCurrentPage(pageNum)}
                                                    className={`min-w-[32px] sm:min-w-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-alice ${
                                                        current === pageNum
                                                            ? 'bg-[#860809] text-white'
                                                            : 'border border-gray-300 text-[#030105] hover:bg-[#f7e9b8] active:bg-[#f7e9b8]'
                                                    } active:scale-95 transition-all duration-200`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    
                                    <button
                                        onClick={() => setCurrentPage(currentPage + 1)}
                                        disabled={!pagination.hasNextPage}
                                        className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] active:bg-[#f7e9b8] active:scale-95 transition-all duration-200 font-alice min-w-[60px] sm:min-w-[70px]"
                                    >
                                        Next
                                    </button>
                                </div>
                            </motion.div>
                        )
                    ) : (
                        // Orders History Pagination
                        historyPagination && historyPagination.totalPages > 1 && (
                            <motion.div
                                className="flex flex-col items-center justify-between gap-3 sm:gap-4 mt-4 sm:mt-6 px-3 sm:px-0"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="text-xs sm:text-sm text-[#030105] font-alice text-center w-full">
                                    Showing {((historyPagination.currentPage - 1) * 10) + 1} to {Math.min(historyPagination.currentPage * 10, historyPagination.totalOrders)} of {historyPagination.totalOrders}
                                </div>
                                
                                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
                                    <button
                                        onClick={() => setHistoryCurrentPage(historyCurrentPage - 1)}
                                        disabled={!historyPagination.hasPrevPage}
                                        className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] active:bg-[#f7e9b8] active:scale-95 transition-all duration-200 font-alice min-w-[60px] sm:min-w-[70px]"
                                    >
                                        Prev
                                    </button>
                                    
                                    <div className="flex items-center gap-1 sm:gap-1.5">
                                        {(() => {
                                            const totalPages = historyPagination.totalPages;
                                            const current = historyCurrentPage;
                                            const maxVisible = window.innerWidth < 640 ? 3 : 5;
                                            let pages = [];
                                            
                                            if (totalPages <= maxVisible) {
                                                pages = Array.from({ length: totalPages }, (_, i) => i + 1);
                                            } else {
                                                const half = Math.floor(maxVisible / 2);
                                                let start = Math.max(1, current - half);
                                                let end = Math.min(totalPages, start + maxVisible - 1);
                                                
                                                if (end - start < maxVisible - 1) {
                                                    start = Math.max(1, end - maxVisible + 1);
                                                }
                                                
                                                pages = Array.from({ length: end - start + 1 }, (_, i) => start + i);
                                            }
                                            
                                            return pages.map((pageNum) => (
                                                <button
                                                    key={pageNum}
                                                    onClick={() => setHistoryCurrentPage(pageNum)}
                                                    className={`min-w-[32px] sm:min-w-[36px] px-2 sm:px-3 py-1.5 rounded-md text-xs sm:text-sm font-alice ${
                                                        current === pageNum
                                                            ? 'bg-[#860809] text-white'
                                                            : 'border border-gray-300 text-[#030105] hover:bg-[#f7e9b8] active:bg-[#f7e9b8]'
                                                    } active:scale-95 transition-all duration-200`}
                                                >
                                                    {pageNum}
                                                </button>
                                            ));
                                        })()}
                                    </div>
                                    
                                    <button
                                        onClick={() => setHistoryCurrentPage(historyCurrentPage + 1)}
                                        disabled={!historyPagination.hasNextPage}
                                        className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm rounded-md border border-gray-300 text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] active:bg-[#f7e9b8] active:scale-95 transition-all duration-200 font-alice min-w-[60px] sm:min-w-[70px]"
                                    >
                                        Next
                                    </button>
                                </div>
                            </motion.div>
                        )
                    )}
                </div>
            </div>
        </AdminLayout>
    );
};

export default OrderManagementPage;
