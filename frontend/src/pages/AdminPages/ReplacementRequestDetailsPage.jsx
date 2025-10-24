import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Save, 
    AlertCircle, 
    CheckCircle,
    Package,
    User,
    Calendar,
    MessageSquare,
    Truck,
    X
} from 'lucide-react';
import { useReplacementRequestStore } from '../../store/replacementRequestStore';
import { productStore } from '../../store/productStore';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import AdminLayout from '../../components/AdminLayout';

const ReplacementRequestDetailsPage = () => {
    const { requestId } = useParams();
    const navigate = useNavigate();
    const {
        currentRequest,
        isLoading,
        error,
        message,
        getAdminRequestDetails,
        updateRequestStatus,
        clearError,
        clearMessage
    } = useReplacementRequestStore();

    const { products, fetchAllProducts } = productStore();

    const [formData, setFormData] = useState({
        status: '',
        adminResponse: '',
        replacementProductId: '',
        replacementQuantity: '',
        internalNotes: '',
        rejectionReason: ''
    });

    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                await Promise.all([
                    getAdminRequestDetails(requestId),
                    fetchAllProducts()
                ]);
            } catch (error) {
                console.error('Error loading request details:', error);
            }
        };

        if (requestId) {
            loadData();
        }
    }, [requestId]);

    useEffect(() => {
        if (currentRequest) {
            setFormData({
                status: currentRequest.status || '',
                adminResponse: currentRequest.adminResponse || '',
                replacementProductId: currentRequest.replacementProduct?._id || '',
                replacementQuantity: currentRequest.replacementQuantity || currentRequest.quantity || '',
                internalNotes: currentRequest.internalNotes || '',
                rejectionReason: currentRequest.rejectionReason || ''
            });
        }
    }, [currentRequest]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            await updateRequestStatus(requestId, formData);
            setIsEditing(false);
        } catch (error) {
            console.error('Error updating request:', error);
        }
    };

    const handleCancel = () => {
        if (currentRequest) {
            setFormData({
                status: currentRequest.status || '',
                adminResponse: currentRequest.adminResponse || '',
                replacementProductId: currentRequest.replacementProduct?._id || '',
                replacementQuantity: currentRequest.replacementQuantity || currentRequest.quantity || '',
                internalNotes: currentRequest.internalNotes || '',
                rejectionReason: currentRequest.rejectionReason || ''
            });
        }
        setIsEditing(false);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading && !currentRequest) {
        return <LoadingSpinner />;
    }

    if (!currentRequest) {
        return (
            <AdminLayout>
                <div className="py-8">
                    <div className="relative z-10 container mx-auto px-4">
                        <div className="text-center py-12">
                            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">Request not found</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                The replacement request you're looking for doesn't exist.
                            </p>
                            <button
                                onClick={() => navigate('/admin/replacement-requests')}
                                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Back to Requests
                            </button>
                        </div>
                    </div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="py-4 sm:py-6 md:py-8">
                <div className="relative z-10 container mx-auto px-3 sm:px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-6 sm:mb-8"
                >
                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => navigate('/admin/replacement-requests')}
                            className="inline-flex items-center gap-2 text-xs sm:text-sm font-medium transition-colors hover:opacity-80 self-start active:scale-95"
                            style={{ color: '#860809' }}
                        >
                            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="whitespace-nowrap">Back to Requests</span>
                        </button>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#030105]">
                                    Request #{currentRequest.requestNumber}
                                </h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <StatusBadge status={currentRequest.status} />
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-2 sm:gap-3">
                                {!isEditing && (currentRequest.status !== 'approved' && currentRequest.status !== 'rejected') ? (
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors text-xs sm:text-sm active:scale-95"
                                    >
                                        <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                        <span className="whitespace-nowrap">Update Request</span>
                                    </button>
                                ) : isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancel}
                                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 border border-[#f7e9b8] bg-[#f7e9b8] text-[#030105] rounded-lg hover:bg-[#f0d896] transition-colors text-xs sm:text-sm active:scale-95"
                                        >
                                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span className="whitespace-nowrap">Cancel</span>
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isLoading}
                                            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors disabled:opacity-50 text-xs sm:text-sm active:scale-95"
                                        >
                                            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                            <span className="whitespace-nowrap">{isLoading ? 'Saving...' : 'Save Changes'}</span>
                                        </button>
                                    </>
                                ) : null}
                            </div>
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
                    {/* Left Column - Request Information */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        {/* Product Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                                <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Product Information
                            </h3>
                            <div className="flex items-start gap-3 sm:gap-4">
                                {currentRequest.product?.image && (
                                    <img
                                        src={currentRequest.product.image}
                                        alt={currentRequest.product.name}
                                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-[#030105] text-sm sm:text-base break-words">
                                        {currentRequest.product?.name}
                                        {(() => {
                                            // Try to get weight info from product data
                                            if (currentRequest.product?.weightOptions && currentRequest.product.weightOptions.length > 0) {
                                                const firstWeight = currentRequest.product.weightOptions[0];
                                                if (firstWeight && firstWeight.weightKg) {
                                                    return ` (${firstWeight.weightKg}kg)`;
                                                }
                                            }
                                            return '';
                                        })()}
                                    </h4>
                                    <p className="text-xs sm:text-sm text-[#030105] opacity-80 break-words">
                                        Category: {currentRequest.product?.category}
                                    </p>
                                    <p className="text-xs sm:text-sm text-[#030105] opacity-80">
                                        Price: ₱{(() => {
                                            // Prefer historical unit price from the order; handle populated and unpopulated product refs
                                            try {
                                                const orderProducts = currentRequest.order?.products || [];
                                                const currentId = currentRequest.product?._id || currentRequest.product;
                                                const orderProduct = orderProducts.find(p => {
                                                    const pid = p.product?._id || p.product; // supports ObjectId string or populated object
                                                    return String(pid) === String(currentId);
                                                });
                                                if (orderProduct && typeof orderProduct.price === 'number') {
                                                    return orderProduct.price.toFixed(2);
                                                }
                                            } catch (_) {}

                                            // Fallback to current product price calculation for weight-based items
                                            if (
                                                currentRequest.product?.basePricePerKg &&
                                                Array.isArray(currentRequest.product?.weightOptions) &&
                                                currentRequest.product.weightOptions.length > 0
                                            ) {
                                                const firstWeight = currentRequest.product.weightOptions[0];
                                                if (firstWeight && firstWeight.weightKg) {
                                                    return (Number(currentRequest.product.basePricePerKg) * Number(firstWeight.weightKg)).toFixed(2);
                                                }
                                            }
                                            // Final fallback to product.price
                                            const p = currentRequest.product?.price;
                                            return typeof p === 'number' ? p.toFixed(2) : '0.00';
                                        })()}
                                    </p>
                                    <p className="text-xs sm:text-sm text-[#030105] opacity-80">
                                        Quantity: {currentRequest.quantity}
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Customer Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Customer Information
                            </h3>
                            <div className="space-y-2 text-xs sm:text-sm">
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                    <span className="text-[#030105] opacity-80">Name:</span>
                                    <span className="font-medium text-[#030105] break-words">{currentRequest.user?.name}</span>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                    <span className="text-[#030105] opacity-80">Email:</span>
                                    <span className="font-medium text-[#030105] break-words">{currentRequest.user?.email}</span>
                                </div>
                                {currentRequest.contactNumber && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                        <span className="text-[#030105] opacity-80">Contact Number:</span>
                                        <span className="font-medium text-[#030105] break-words">{currentRequest.contactNumber}</span>
                                    </div>
                                )}
                                {currentRequest.user?.phone && (
                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-2">
                                        <span className="text-[#030105] opacity-80">Phone:</span>
                                        <span className="font-medium text-[#030105] break-words">{currentRequest.user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Request Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 flex items-center text-sm sm:text-base">
                                <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                                Request Details
                            </h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Reason
                                    </label>
                                    <p className="text-xs sm:text-sm text-[#030105] bg-gray-50 p-2 sm:p-3 rounded break-words">
                                        {currentRequest.reason?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Description
                                    </label>
                                    <p className="text-xs sm:text-sm text-[#030105] bg-gray-50 p-2 sm:p-3 rounded whitespace-pre-wrap break-words">
                                        {currentRequest.description}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Submitted
                                    </label>
                                    <p className="text-xs sm:text-sm text-[#030105] bg-gray-50 p-2 sm:p-3 rounded break-words">
                                        {formatDate(currentRequest.createdAt)}
                                    </p>
                                </div>
                                {currentRequest.adminResponse && (
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                            Admin Response
                                        </label>
                                        <p className="text-xs sm:text-sm text-[#030105] bg-gray-50 p-2 sm:p-3 rounded whitespace-pre-wrap break-words">
                                            {currentRequest.adminResponse}
                                        </p>
                                    </div>
                                )}
                                {currentRequest.rejectionReason && (
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                            Rejection Reason
                                        </label>
                                        <p className="text-xs sm:text-sm text-[#030105] bg-gray-50 p-2 sm:p-3 rounded whitespace-pre-wrap break-words">
                                            {currentRequest.rejectionReason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Images */}
                        {currentRequest.images && currentRequest.images.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.4 }}
                                className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                            >
                                <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 text-sm sm:text-base">
                                    Uploaded Images
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    {currentRequest.images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Request image ${index + 1}`}
                                                className="w-full h-40 sm:h-48 object-contain rounded-lg cursor-pointer hover:opacity-80 active:opacity-80 transition-opacity bg-gray-50 border border-gray-200"
                                                onClick={() => window.open(image, '_blank')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column - Admin Actions */}
                    <div className="space-y-4 sm:space-y-6">
                        {/* Admin Response Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 text-sm sm:text-base">
                                Admin Response
                            </h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Admin Response {formData.status === 'approved' && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        name="adminResponse"
                                        value={formData.adminResponse}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        rows={4}
                                        required={formData.status === 'approved'}
                                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                        placeholder="Enter your response to the customer..."
                                    />
                                </div>

                                {formData.status === 'rejected' && (
                                    <div>
                                        <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                            Rejection Reason *
                                        </label>
                                        <textarea
                                            name="rejectionReason"
                                            value={formData.rejectionReason}
                                            onChange={handleInputChange}
                                            disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                            rows={3}
                                            className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                            placeholder="Please provide a reason for rejection..."
                                            required
                                        />
                                    </div>
                                )}


                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Internal Notes
                                    </label>
                                    <textarea
                                        name="internalNotes"
                                        value={formData.internalNotes}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        rows={3}
                                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                        placeholder="Internal notes (not visible to customer)..."
                                    />
                                </div>
                            </div>
                        </motion.div>

                        {/* Replacement Product */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-3 sm:p-4 md:p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-3 sm:mb-4 text-sm sm:text-base">
                                Replacement Product
                            </h3>
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Replacement Product
                                    </label>
                                    <select
                                        name="replacementProductId"
                                        value={formData.replacementProductId}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                    >
                                        <option value="">Same Product</option>
                                        {products.map(product => (
                                            <option key={product._id} value={product._id}>
                                                {product.name} - ₱{product.price.toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs sm:text-sm font-medium text-[#030105] mb-1">
                                        Replacement Quantity
                                    </label>
                                    <input
                                        type="number"
                                        name="replacementQuantity"
                                        value={formData.replacementQuantity}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        min="1"
                                        className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
        </AdminLayout>
    );
};

export default ReplacementRequestDetailsPage;
