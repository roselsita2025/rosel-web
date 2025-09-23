import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter, 
  Edit3, 
  Eye, 
  Trash2,
  Package,
  Calendar,
  User,
  ShoppingCart
} from "lucide-react";
import axios from "axios";
import AdminLayout from "../../components/AdminLayout.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
axios.defaults.withCredentials = true;

const OrdersHistoryPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [expandedOrders, setExpandedOrders] = useState(new Set());
  
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch orders
  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        sortBy,
        sortOrder
      });
      
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      
      const response = await axios.get(`${API_URL}/admin/orders?${params.toString()}`);
      
      setOrders(response.data.data.orders);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Failed to fetch orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentPage, searchTerm, statusFilter, sortBy, sortOrder]);

  // Toggle order expansion
  const toggleOrderExpansion = (orderId) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'PROCESSING': return 'bg-blue-100 text-blue-800';
      case 'SHIPPED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchOrders();
  };

  // Handle filter change
  const handleFilterChange = (newFilter) => {
    setStatusFilter(newFilter);
    setCurrentPage(1);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="py-8">
          <div className="relative z-10 container mx-auto px-4">
            <div className="text-center text-[#030105] text-lg">
              Loading orders...
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-8">
        <div className="relative z-10 container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#030105]">Orders History</h1>
          <div className="flex items-center gap-2 text-sm text-[#030105]">
            <Package className="h-5 w-5" />
            <span>Total Orders: {pagination.totalOrders || 0}</span>
          </div>
        </div>

        {/* Search and Filter Section */}
        <motion.div
          className="bg-[#fffefc] rounded-lg shadow-lg border border-[#f7e9b8] p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#860809] h-5 w-5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by customer name, email, or order ID..."
                  className="w-full pl-10 pr-4 py-2 border border-[#f7e9b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105]"
                />
              </form>
            </div>

            {/* Status Filter */}
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="w-full px-3 py-2 border border-[#f7e9b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105]"
              >
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="lg:w-48">
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [newSortBy, newSortOrder] = e.target.value.split('-');
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
                className="w-full px-3 py-2 border border-[#f7e9b8] rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] text-[#030105]"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="totalAmount-desc">Highest Amount</option>
                <option value="totalAmount-asc">Lowest Amount</option>
                <option value="status-asc">Status A-Z</option>
                <option value="status-desc">Status Z-A</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders Table */}
        <motion.div
          className="bg-[#fffefc] rounded-lg shadow-lg border border-[#f7e9b8] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {error ? (
            <div className="p-8 text-center text-red-600">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="p-8 text-center text-[#030105]">
              No orders found
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="bg-[#f7e9b8] px-6 py-4">
                <div className="grid grid-cols-12 gap-4 text-sm font-medium text-[#030105] uppercase tracking-wider">
                  <div className="col-span-1"></div>
                  <div className="col-span-2">Order ID</div>
                  <div className="col-span-2">Customer</div>
                  <div className="col-span-1">Items</div>
                  <div className="col-span-1">Price</div>
                  <div className="col-span-2">Created</div>
                  <div className="col-span-1">Status</div>
                  <div className="col-span-2">Actions</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-[#f7e9b8]">
                {orders.map((order) => (
                  <div key={order._id}>
                    {/* Main Order Row */}
                    <div className="px-6 py-4 hover:bg-[#f7e9b8] hover:bg-opacity-30 transition-colors duration-200">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Expand/Collapse Button */}
                        <div className="col-span-1">
                          <button
                            onClick={() => toggleOrderExpansion(order._id)}
                            className="p-1 rounded hover:bg-[#f7e9b8] transition-colors duration-200"
                          >
                            {expandedOrders.has(order._id) ? (
                              <ChevronUp className="h-5 w-5 text-[#860809]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-[#860809]" />
                            )}
                          </button>
                        </div>

                        {/* Order ID */}
                        <div className="col-span-2">
                          <div className="text-sm font-medium text-[#030105]">
                            #{order.orderId}
                          </div>
                        </div>

                        {/* Customer */}
                        <div className="col-span-2">
                          <div className="text-sm text-[#030105]">
                            <div className="font-medium">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.customerEmail}</div>
                          </div>
                        </div>

                        {/* Items Count */}
                        <div className="col-span-1">
                          <div className="text-sm text-[#030105] flex items-center">
                            <ShoppingCart className="h-4 w-4 mr-1" />
                            {order.itemsCount}
                          </div>
                        </div>

                        {/* Price */}
                        <div className="col-span-1">
                          <div className="text-sm font-medium text-[#030105] flex items-center">
                            <span className="text-sm font-bold mr-1">₱</span>
                            {order.totalPrice.toFixed(2)}
                          </div>
                        </div>

                        {/* Created Date */}
                        <div className="col-span-2">
                          <div className="text-sm text-[#030105] flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.created)}
                          </div>
                        </div>

                        {/* Status */}
                        <div className="col-span-1">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.computedStatus)}`}>
                            {order.computedStatus}
                          </span>
                        </div>

                        {/* Actions */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="p-1 rounded hover:bg-[#f7e9b8] transition-colors duration-200"
                              title="Edit Order"
                            >
                              <Edit3 className="h-4 w-4 text-[#860809]" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-[#f7e9b8] transition-colors duration-200"
                              title="View Order"
                            >
                              <Eye className="h-4 w-4 text-[#860809]" />
                            </button>
                            <button
                              className="p-1 rounded hover:bg-[#f7e9b8] transition-colors duration-200"
                              title="Delete Order"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Products Section */}
                    {expandedOrders.has(order._id) && (
                      <motion.div
                        className="bg-gray-50 px-6 py-4 border-t border-[#f7e9b8]"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <h4 className="text-sm font-medium text-[#030105] mb-3">Products Ordered:</h4>
                        <div className="space-y-3">
                          {order.products.map((item, index) => (
                            <div key={index} className="flex items-center gap-4 p-3 bg-white rounded-lg border border-[#f7e9b8]">
                              {/* Product Image */}
                              <div className="flex-shrink-0">
                                <img
                                  src={item.product?.image || '/placeholder-product.jpg'}
                                  alt={item.product?.name || 'Product'}
                                  className="h-12 w-12 rounded-lg object-cover"
                                />
                              </div>
                              
                              {/* Product Details */}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium text-[#030105] truncate">
                                  {item.product?.name || 'Unknown Product'}
                                </div>
                                <div className="text-xs text-gray-500">
                                  Category: {item.product?.category || 'N/A'}
                                </div>
                              </div>
                              
                              {/* Price and Quantity */}
                              <div className="flex items-center gap-4 text-sm text-[#030105]">
                                <div>
                                  <span className="text-gray-500">Price:</span> ₱{item.price.toFixed(2)}
                                </div>
                                <div>
                                  <span className="text-gray-500">Qty:</span> {item.quantity}
                                </div>
                                <div className="font-medium">
                                  <span className="text-gray-500">Total:</span> ₱{item.totalPrice.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </motion.div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <motion.div
            className="flex items-center justify-between mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="text-sm text-[#030105]">
              Showing {((pagination.currentPage - 1) * 10) + 1} to {Math.min(pagination.currentPage * 10, pagination.totalOrders)} of {pagination.totalOrders} orders
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
                className="px-3 py-1 rounded-md border border-[#f7e9b8] text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] transition-colors duration-200"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        currentPage === pageNum
                          ? 'bg-[#860809] text-white'
                          : 'border border-[#f7e9b8] text-[#030105] hover:bg-[#f7e9b8]'
                      } transition-colors duration-200`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNextPage}
                className="px-3 py-1 rounded-md border border-[#f7e9b8] text-[#030105] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#f7e9b8] transition-colors duration-200"
              >
                Next
              </button>
            </div>
          </motion.div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrdersHistoryPage;
