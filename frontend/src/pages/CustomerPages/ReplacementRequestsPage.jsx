import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Plus, 
    Search, 
    RefreshCw,
    Package,
    AlertCircle,
    XCircle
} from 'lucide-react';
import { useReplacementRequestStore } from '../../store/replacementRequestStore';
import ReplacementRequestCard from '../../components/ReplacementRequestCard';
import ReplacementRequestModal from '../../components/ReplacementRequestModal';
import LoadingSpinner from '../../components/LoadingSpinner';
import Footer from '../../components/Footer';

const ReplacementRequestsPage = () => {
    const navigate = useNavigate();
    const {
        requests,
        currentRequest,
        isLoading,
        error,
        pagination,
        getCustomerRequests,
        getRequestDetails,
        clearError,
        clearMessage
    } = useReplacementRequestStore();

    const [selectedRequest, setSelectedRequest] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const loadRequests = async () => {
            try {
                await getCustomerRequests({
                    page: currentPage,
                    limit: 10
                });
            } catch (error) {
                console.error('Error loading replacement requests:', error);
            }
        };

        loadRequests();
    }, [currentPage]);

    const handleRequestClick = async (request) => {
        try {
            await getRequestDetails(request._id);
            setSelectedRequest(request);
            setIsModalOpen(true);
        } catch (error) {
            console.error('Error loading request details:', error);
        }
    };

    const handleRefresh = async () => {
        try {
            await getCustomerRequests({
                page: currentPage,
                limit: 10
            });
        } catch (error) {
            console.error('Error refreshing requests:', error);
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const filteredRequests = requests.filter(request => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();
        return (
            request.requestNumber.toLowerCase().includes(searchLower) ||
            request.product?.name?.toLowerCase().includes(searchLower) ||
            request.description.toLowerCase().includes(searchLower)
        );
    });

    if (isLoading && requests.length === 0) {
        return <LoadingSpinner />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-[#f8f3ed]">
            <div className="flex-1 pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-6 sm:pb-8">
                <div className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
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
                                My Replacement Requests
                            </h1>
                            <p className="text-[#030105] mt-1.5 sm:mt-2 font-alice text-sm sm:text-base">
                                Track and manage your product replacement requests
                            </p>
                        </div>
                        <div className="flex gap-2 sm:gap-3 self-end sm:self-auto">
                            <button
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg border border-gray-300 hover:bg-[#fffefc] transition-colors disabled:opacity-50 bg-[#fffefc] text-[#a31f17] font-alice text-xs sm:text-sm"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                                <span className="hidden sm:inline">Refresh</span>
                            </button>
                            <Link
                                to="/replacement-request/new"
                                className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice text-xs sm:text-sm"
                            >
                                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden sm:inline">New Request</span>
                                <span className="sm:hidden">New</span>
                            </Link>
                        </div>
                    </div>
                </motion.div>

                {/* Search */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="rounded-lg shadow-md border border-gray-300 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6 md:mb-8 bg-[#fffefc]"
                >
                    <div className="relative">
                        <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Search by request number, product name, or description..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-1.5 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm sm:text-base"
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
                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0" />
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

                {/* Requests List */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="space-y-3 sm:space-y-4"
                >
                    {filteredRequests.length === 0 ? (
                        <div className="text-center py-8 sm:py-10 md:py-12">
                            <Package className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm sm:text-base font-medium text-[#860809] font-alice">No replacement requests found</h3>
                            <p className="mt-1 text-xs sm:text-sm text-[#a31f17] font-libre">
                                {searchTerm ? 'Try adjusting your search criteria.' : 'You haven\'t submitted any replacement requests yet.'}
                            </p>
                            {!searchTerm && (
                                <div className="mt-4 sm:mt-6">
                                    <Link
                                        to="/replacement-request/new"
                                        className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 border border-transparent shadow-sm text-xs sm:text-sm font-medium rounded-md text-white bg-[#860809] hover:bg-[#a31f17] font-alice"
                                    >
                                        <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                                        Create Your First Request
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        filteredRequests.map((request, index) => (
                            <motion.div
                                key={request._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <ReplacementRequestCard
                                    request={request}
                                    onClick={() => handleRequestClick(request)}
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
                        transition={{ duration: 0.5, delay: 0.3 }}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6 sm:mt-8"
                    >
                        <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={!pagination.hasPrevPage}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#a31f17] border border-gray-300 rounded-md hover:bg-[#fffefc] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                        >
                            Previous
                        </button>
                        <span className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm text-[#030105] font-libre">
                            Page {pagination.currentPage} of {pagination.totalPages}
                        </span>
                        <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={!pagination.hasNextPage}
                            className="px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-[#a31f17] border border-gray-300 rounded-md hover:bg-[#fffefc] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                        >
                            Next
                        </button>
                    </motion.div>
                )}
                </div>
            </div>

            {/* Request Details Modal */}
            <ReplacementRequestModal
                request={currentRequest}
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                }}
                isAdmin={false}
            />

            {/* Footer */}
            <Footer />
        </div>
    );
};

export default ReplacementRequestsPage;
