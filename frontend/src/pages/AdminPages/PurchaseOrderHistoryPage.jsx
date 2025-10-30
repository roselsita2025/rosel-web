import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { productStore } from '../../store/productStore.js';
import { useAuthStore } from '../../store/authStore.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import { History, Package, DollarSign, TrendingUp, Calendar, Printer, Eye, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const PurchaseOrderHistoryPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isCheckingAuth } = useAuthStore();
    const { getPurchaseOrderHistory, getPurchaseOrderAnalytics, getPurchaseOrderById } = productStore();
    
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        supplier: '',
        startDate: '',
        endDate: ''
    });

    const handlePrintReceipt = async (poId) => {
        try {
            const result = await getPurchaseOrderById(poId);
            if (result?.success) {
                const po = result.data;
                const receiptWindow = window.open('', '_blank', 'width=350,height=600');
                
                const receiptContent = `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Purchase Order Receipt</title>
                        <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body { font-family: 'Courier New', monospace; padding: 20px; background: white; font-size: 12px; }
                            .receipt { max-width: 300px; margin: 0 auto; }
                            .divider { border-top: 1px dashed #000; margin: 15px 0; }
                            .header { text-align: center; margin-bottom: 15px; }
                            .company-name { font-weight: bold; font-size: 16px; margin-bottom: 5px; }
                            .order-info { margin: 15px 0; }
                            .order-info p { display: flex; justify-content: space-between; margin: 3px 0; }
                            .order-info .label { font-weight: bold; }
                            .items-section { margin: 15px 0; }
                            .item-header { font-weight: bold; margin-bottom: 5px; }
                            .item { margin: 8px 0; }
                            .item-name { margin-bottom: 2px; }
                            .item-details { font-size: 11px; display: flex; justify-content: space-between; }
                            .total-section { margin: 15px 0; }
                            .total-line { display: flex; justify-content: space-between; margin: 5px 0; }
                            .grand-total { font-weight: bold; font-size: 14px; border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; }
                            .footer { text-align: center; margin-top: 20px; font-size: 11px; }
                            .footer-message { font-weight: bold; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                            @media print {
                                body { padding: 10px; }
                                button { display: none; }
                            }
                        </style>
                    </head>
                    <body>
                        <div class="receipt">
                            <div class="header">
                                <div class="company-name">ROSEL FROZEN MEATS</div>
                                <div>Quality Frozen Meats for Your Family</div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="order-info">
                                <div style="font-weight: bold; margin-bottom: 5px;">Transaction ID:</div>
                                <div style="text-align: center; margin-bottom: 10px;">${po.purchaseOrderId}</div>
                                <p><span class="label">PO Number:</span> ${po.purchaseOrderId.substring(0, 8)}</p>
                                <p><span class="label">Supplier:</span> ${po.supplier}</p>
                                <p><span class="label">Date & Time:</span> ${new Date(po.createdAt).toLocaleString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}</p>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="items-section">
                                <div class="item-header">ITEMS PURCHASED:</div>
                                ${po.items.map((item, idx) => `
                                    <div class="item">
                                        <div class="item-name">${item.productName} (${item.weightKg ? item.weightKg.toFixed(2) : 'N/A'}kg)</div>
                                        <div class="item-details">
                                            <span>₱${parseFloat(item.unitPrice || item.purchaseUnitPrice || 0).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})} x ${item.quantity}</span>
                                        </div>
                                        <div class="item-details">
                                            <span>₱${parseFloat(item.totalPrice || (item.purchaseUnitPrice ? item.purchaseUnitPrice * item.quantity : 0)).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="total-section">
                                <div class="total-line">
                                    <span>Subtotal:</span>
                                    <span>₱${parseFloat(po.subtotal || po.totalAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                                <div class="total-line grand-total">
                                    <span>TOTAL:</span>
                                    <span>₱${parseFloat(po.totalAmount).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                                </div>
                            </div>
                            
                            <div class="divider"></div>
                            
                            <div class="footer">
                                <div class="footer-message">THANK YOU FOR YOUR PURCHASE!</div>
                                <div>Please keep this receipt for your records</div>
                            </div>
                        </div>
                        <button onclick="window.print()" style="position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #860809; color: white; border: none; border-radius: 5px; cursor: pointer;">Print Receipt</button>
                    </body>
                    </html>
                `;
                
                receiptWindow.document.write(receiptContent);
                receiptWindow.document.close();
            }
        } catch (error) {
            toast.error('Failed to load purchase order details for printing');
            console.error('Print error:', error);
        }
    };

    useEffect(() => {
        if (isAuthenticated && !isCheckingAuth) {
            fetchPurchaseOrderHistory();
            fetchAnalytics();
        }
    }, [isAuthenticated, isCheckingAuth, currentPage, filters]);

    const fetchPurchaseOrderHistory = async () => {
        try {
            const result = await getPurchaseOrderHistory({
                page: currentPage,
                limit: 20,
                ...filters
            });
            
            if (result?.success) {
                setPurchaseOrders(result.data.purchaseOrders);
                setTotalPages(result.data.pagination.totalPages);
            }
        } catch (error) {
            console.error('Error fetching purchase order history:', error);
            toast.error('Failed to load purchase order history');
        } finally {
            setLoading(false);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const result = await getPurchaseOrderAnalytics({
                ...filters
            });
            
            if (result?.success) {
                setAnalytics(result.data);
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (isCheckingAuth) {
        return (
            <AdminLayout>
                <div className='py-8 flex justify-center items-center min-h-[400px]'>
                    <div className='text-[#82695b] text-lg'>Loading...</div>
                </div>
            </AdminLayout>
        );
    }

    if (!isAuthenticated) {
        return (
            <AdminLayout>
                <div className='py-8 flex justify-center items-center min-h-[400px]'>
                    <div className='text-[#82695b] text-lg'>Please log in to view purchase order history</div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className='py-4 sm:py-6 md:py-8 px-3 sm:px-4 bg-[#f8f3ed] min-h-screen'>
                <div className='max-w-7xl mx-auto'>
                    {/* Page Title */}
                    <div className='mb-4 sm:mb-6 flex justify-between items-start'>
                        <div>
                            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre mb-2'>Purchase Order History</h1>
                            <p className='text-[#a31f17] font-alice text-sm sm:text-base'>View and manage your purchase orders</p>
                        </div>
                        <button
                            onClick={() => navigate('/manage-products?tab=update&subtab=purchase-order')}
                            className='bg-[#860809] text-white px-4 py-2 rounded hover:bg-[#7a0f0f] flex items-center gap-2'
                        >
                            <ArrowLeft size={18} />
                            Back to Purchase Order
                        </button>
                    </div>

                    {/* Analytics Cards */}
                    {analytics && (
                        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
                            <motion.div
                                className='bg-white p-4 rounded-lg shadow-md border border-gray-300'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-gray-600 text-sm font-alice'>Total Purchases</p>
                                        <p className='text-2xl font-bold text-[#860809] font-libre'>
                                            {analytics.totalPurchases || 0}
                                        </p>
                                    </div>
                                    <Package className='h-8 w-8 text-[#860809]' />
                                </div>
                            </motion.div>

                            <motion.div
                                className='bg-white p-4 rounded-lg shadow-md border border-gray-300'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                            >
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-gray-600 text-sm font-alice'>Total Spent</p>
                                        <p className='text-2xl font-bold text-[#860809] font-libre'>
                                            {formatCurrency(analytics.totalSpent || 0)}
                                        </p>
                                    </div>
                                    <DollarSign className='h-8 w-8 text-[#860809]' />
                                </div>
                            </motion.div>

                            <motion.div
                                className='bg-white p-4 rounded-lg shadow-md border border-gray-300'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-gray-600 text-sm font-alice'>Average Order</p>
                                        <p className='text-2xl font-bold text-[#860809] font-libre'>
                                            {formatCurrency(analytics.averageOrderValue || 0)}
                                        </p>
                                    </div>
                                    <TrendingUp className='h-8 w-8 text-[#860809]' />
                                </div>
                            </motion.div>

                            <motion.div
                                className='bg-white p-4 rounded-lg shadow-md border border-gray-300'
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                <div className='flex items-center justify-between'>
                                    <div>
                                        <p className='text-gray-600 text-sm font-alice'>Top Supplier</p>
                                        <p className='text-sm font-bold text-[#860809] font-libre'>
                                            {analytics.topSuppliers?.[0]?._id || 'N/A'}
                                        </p>
                                    </div>
                                    <Package className='h-8 w-8 text-[#860809]' />
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Filters */}
                    <motion.div
                        className='bg-white p-4 rounded-lg shadow-md border border-gray-300 mb-6'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            <div>
                                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Supplier</label>
                                <input
                                    type='text'
                                    value={filters.supplier}
                                    onChange={(e) => setFilters({ ...filters, supplier: e.target.value })}
                                    placeholder='Filter by supplier'
                                    className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#860809]'
                                />
                            </div>
                            <div>
                                <label className='block text-sm text-[#82695b] mb-1 font-medium'>Start Date</label>
                                <input
                                    type='date'
                                    value={filters.startDate}
                                    onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                    className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#860809]'
                                />
                            </div>
                            <div>
                                <label className='block text-sm text-[#82695b] mb-1 font-medium'>End Date</label>
                                <input
                                    type='date'
                                    value={filters.endDate}
                                    onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                    className='w-full bg-[#f8f3ed] border border-[#82695b] rounded px-3 py-2 text-[#82695b] focus:ring-2 focus:ring-[#860809]'
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Purchase Orders Table */}
                    <motion.div
                        className='bg-white rounded-lg shadow-md border border-gray-300'
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className='overflow-x-auto'>
                            <table className='min-w-full divide-y divide-[#82695b]'>
                                <thead className='bg-[#82695b]'>
                                    <tr>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>PO Number</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>Supplier</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>Items</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>Total</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>Date</th>
                                        <th className='px-4 py-3 text-left text-xs font-medium text-white uppercase tracking-wider'>Actions</th>
                                    </tr>
                                </thead>
                                <tbody className='bg-white divide-y divide-[#82695b]'>
                                    {loading ? (
                                        <tr>
                                            <td colSpan='6' className='px-4 py-6 text-center text-[#82695b]'>
                                                Loading...
                                            </td>
                                        </tr>
                                    ) : purchaseOrders.length === 0 ? (
                                        <tr>
                                            <td colSpan='6' className='px-4 py-6 text-center text-[#82695b]'>
                                                No purchase orders found
                                            </td>
                                        </tr>
                                    ) : (
                                        purchaseOrders.map((po) => (
                                            <tr key={po._id} className='hover:bg-[#f8f3ed] transition-colors'>
                                                <td className='px-4 py-3 text-sm text-[#82695b] font-mono'>
                                                    {po.purchaseOrderId || po.purchaseOrderNumber || 'N/A'}
                                                </td>
                                                <td className='px-4 py-3 text-sm text-[#82695b]'>
                                                    {po.supplier}
                                                </td>
                                                <td className='px-4 py-3 text-sm text-[#82695b]'>
                                                    {po.items.length} items
                                                </td>
                                                <td className='px-4 py-3 text-sm font-bold text-[#860809]'>
                                                    {formatCurrency(po.totalAmount)}
                                                </td>
                                                <td className='px-4 py-3 text-sm text-[#82695b]'>
                                                    {formatDate(po.createdAt)}
                                                </td>
                                                <td className='px-4 py-3 text-sm'>
                                                    <div className='flex gap-2'>
                                                        <button
                                                            onClick={() => handlePrintReceipt(po._id)}
                                                            className='p-1 text-[#860809] hover:text-[#7a0f0f]'
                                                            title='Print'
                                                        >
                                                            <Printer className='h-4 w-4' />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className='flex items-center justify-between px-4 py-3 border-t border-gray-300'>
                                <div className='text-sm text-[#82695b]'>
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className='flex gap-2'>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className='px-3 py-2 text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] disabled:opacity-50'
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className='px-3 py-2 text-sm bg-[#82695b] text-white rounded hover:bg-[#6b5649] disabled:opacity-50'
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
        </AdminLayout>
    );
};

export default PurchaseOrderHistoryPage;
