import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
    Search, 
    Filter, 
    RefreshCw,
    Package,
    AlertCircle,
    XCircle,
    BarChart3,
    Users,
    Clock,
    CheckCircle,
    X,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useReplacementRequestStore } from '../../store/replacementRequestStore';
import { productStore } from '../../store/productStore';
import ReplacementRequestCard from '../../components/ReplacementRequestCard';
import ReplacementRequestModal from '../../components/ReplacementRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/AdminLayout.jsx';

const ReplacementRequestsPage = () => {
    const navigate = useNavigate();
    const {
        requests,
        currentRequest,
        stats,
        isLoading,
        error,
        pagination,
        getAllRequests,
        getRequestStats,
        updateRequestStatus,
        clearError,
        clearMessage
    } = useReplacementRequestStore();

    const { products, fetchAllProducts } = productStore();

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [showStats, setShowStats] = useState(true);

    // Fetch data on component mount
    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    getAllRequests({
                        page: currentPage,
                        status: statusFilter,
                        search: searchTerm,
                        limit: 10
                    }),
                    getRequestStats(),
                    fetchAllProducts()
                ]);
            } catch (error) {
                console.error('Error loading data:', error);
            }
        };

        loadData();
    }, [currentPage, statusFilter, searchTerm]);

    const handleRequestClick = async (request) => {
        try {
            // Navigate to the detailed admin page for editing
            navigate(`/admin/replacement-requests/${request._id}`);
        } catch (error) {
            console.error('Error navigating to request details:', error);
        }
    };

    const handleStatusUpdate = async (requestId, newStatus, adminResponse) => {
        try {
            await updateRequestStatus(requestId, {
                status: newStatus,
                adminResponse: adminResponse
            });
            // Refresh the list
            await getAllRequests({
                page: currentPage,
                status: statusFilter,
                search: searchTerm,
                limit: 10
            });
        } catch (error) {
            console.error('Error updating request status:', error);
        }
    };


    const handleRefresh = async () => {
        try {
            await Promise.all([
                getAllRequests({
                    page: currentPage,
                    status: statusFilter,
                    search: searchTerm,
                    limit: 10
                }),
                getRequestStats()
            ]);
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (isLoading && requests.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <AdminLayout>
            <div className="py-8 bg-[#f8f3ed] min-h-screen">
                <div className="relative z-10 container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-bold text-[#860809] font-libre">Replacement Requests</h2>
                            <p className="text-[#a31f17] mt-1 font-alice">
                                Manage and process customer replacement requests
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowStats(!showStats)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors font-alice ${
                                    showStats 
                                        ? 'bg-[#860809] text-white border-[#860809]' 
                                        : 'bg-[#f8f3ed] text-[#030105] border-gray-300'
                                }`}
                            >
                                <BarChart3 size={16} />
                                {showStats ? 'Hide Stats' : 'Show Stats'}
                            </button>
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-[#f8f3ed] text-[#030105] hover:bg-[#a31f17] hover:text-white transition-colors disabled:opacity-50 font-alice"
                            >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                Refresh
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* Statistics Cards */}
                {showStats && stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                    >
                        <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                            <div className="flex items-center">
                                <Package className="h-8 w-8 text-[#860809]" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Total Requests</p>
                                    <p className="text-2xl font-bold text-[#860809] font-libre">{stats.totalRequests}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                            <div className="flex items-center">
                                <Clock className="h-8 w-8 text-yellow-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Pending</p>
                                    <p className="text-2xl font-bold text-[#860809] font-libre">{(stats.pendingRequests || 0) + (stats.underReviewRequests || 0)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                            <div className="flex items-center">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Approved</p>
                                    <p className="text-2xl font-bold text-[#860809] font-libre">{stats.approvedRequests || 0}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-[#fffefc] rounded-lg p-6 shadow-md border border-gray-300">
                            <div className="flex items-center">
                                <XCircle className="h-8 w-8 text-red-600" />
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-[#a31f17] font-alice">Rejected</p>
                                    <p className="text-2xl font-bold text-[#860809] font-libre">{stats.rejectedRequests || 0}</p>
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
                    className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-6 mb-8"
                >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a31f17]" size={20} />
                                <input
                                    type="text"
                                    placeholder="Search by description, admin response, or tracking number..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] font-alice"
                                />
                            </div>
                        </div>
                        <div>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] font-alice"
                            >
                                <option value="">All Statuses</option>
                                <option value="pending">Pending</option>
                                <option value="under_review">Under Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
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

                {/* Requests List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="space-y-4"
                >
                    {requests.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="mx-auto h-12 w-12 text-[#a31f17]" />
                            <h3 className="mt-2 text-sm font-medium text-[#860809] font-alice">No replacement requests found</h3>
                            <p className="mt-1 text-sm text-[#a31f17] font-libre">
                                {searchTerm || statusFilter ? 'Try adjusting your search or filter criteria.' : 'No replacement requests have been submitted yet.'}
                            </p>
                        </div>
                    ) : (
                        requests.map((request, index) => (
                            <motion.div
                                key={request._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <ReplacementRequestCard
                                    request={request}
                                    onClick={() => handleRequestClick(request)}
                                    showCustomerInfo={true}
                                />
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
                            className="px-3 py-2 text-sm font-medium text-[#030105] bg-[#fffefc] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed font-alice"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-2 text-sm text-[#a31f17] font-alice">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-3 py-2 text-sm font-medium text-[#030105] bg-[#fffefc] border border-gray-300 rounded-md hover:bg-[#f8f3ed] disabled:opacity-50 disabled:cursor-not-allowed font-alice"
                        >
                            Next
                        </button>
                    </motion.div>
                )}
            </div>

            {/* Request Details Modal */}
            <ReplacementRequestModal
                request={selectedRequest}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                }}
                isAdmin={true}
            />
            </div>
        </AdminLayout>
    );
};

export default ReplacementRequestsPage;
