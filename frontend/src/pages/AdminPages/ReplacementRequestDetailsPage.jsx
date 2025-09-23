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
            <div className="py-8">
                <div className="relative z-10 container mx-auto px-4">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8"
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate('/admin/replacement-requests')}
                                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80"
                                style={{ color: '#860809' }}
                            >
                                <ArrowLeft size={16} />
                                Back to Requests
                            </button>
                            <div>
                                <h2 className="text-2xl font-bold text-[#030105]">
                                    Request #{currentRequest.requestNumber}
                                </h2>
                                <div className="flex items-center gap-3 mt-2">
                                    <StatusBadge status={currentRequest.status} />
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            {!isEditing && (currentRequest.status !== 'approved' && currentRequest.status !== 'rejected') ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors"
                                >
                                    <MessageSquare size={16} />
                                    Update Request
                                </button>
                            ) : isEditing ? (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancel}
                                        className="inline-flex items-center gap-2 px-4 py-2 border border-[#f7e9b8] bg-[#f7e9b8] text-[#030105] rounded-lg hover:bg-[#f0d896] transition-colors"
                                    >
                                        <X size={16} />
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isLoading}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors disabled:opacity-50"
                                    >
                                        <Save size={16} />
                                        {isLoading ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            ) : null}
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

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column - Request Information */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Product Information */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-4 flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Product Information
                            </h3>
                            <div className="flex items-start gap-4">
                                {currentRequest.product?.image && (
                                    <img
                                        src={currentRequest.product.image}
                                        alt={currentRequest.product.name}
                                        className="w-20 h-20 object-cover rounded"
                                    />
                                )}
                                <div className="flex-1">
                                    <h4 className="font-medium text-[#030105]">
                                        {currentRequest.product?.name}
                                    </h4>
                                    <p className="text-sm text-[#030105] opacity-80">
                                        Category: {currentRequest.product?.category}
                                    </p>
                                    <p className="text-sm text-[#030105] opacity-80">
                                        Price: ₱{currentRequest.product?.price?.toFixed(2)}
                                    </p>
                                    <p className="text-sm text-[#030105] opacity-80">
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
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-4 flex items-center">
                                <User className="h-5 w-5 mr-2" />
                                Customer Information
                            </h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#030105] opacity-80">Name:</span>
                                    <span className="font-medium text-[#030105]">{currentRequest.user?.name}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#030105] opacity-80">Email:</span>
                                    <span className="font-medium text-[#030105]">{currentRequest.user?.email}</span>
                                </div>
                                {currentRequest.contactNumber && (
                                    <div className="flex justify-between">
                                        <span className="text-[#030105] opacity-80">Contact Number:</span>
                                        <span className="font-medium text-[#030105]">{currentRequest.contactNumber}</span>
                                    </div>
                                )}
                                {currentRequest.user?.phone && (
                                    <div className="flex justify-between">
                                        <span className="text-[#030105] opacity-80">Phone:</span>
                                        <span className="font-medium text-[#030105]">{currentRequest.user.phone}</span>
                                    </div>
                                )}
                            </div>
                        </motion.div>

                        {/* Request Details */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-4 flex items-center">
                                <MessageSquare className="h-5 w-5 mr-2" />
                                Request Details
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Reason
                                    </label>
                                    <p className="text-sm text-[#030105] bg-gray-50 p-3 rounded">
                                        {currentRequest.reason?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Description
                                    </label>
                                    <p className="text-sm text-[#030105] bg-gray-50 p-3 rounded whitespace-pre-wrap">
                                        {currentRequest.description}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Submitted
                                    </label>
                                    <p className="text-sm text-[#030105] bg-gray-50 p-3 rounded">
                                        {formatDate(currentRequest.createdAt)}
                                    </p>
                                </div>
                                {currentRequest.adminResponse && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#030105] mb-1">
                                            Admin Response
                                        </label>
                                        <p className="text-sm text-[#030105] bg-gray-50 p-3 rounded whitespace-pre-wrap">
                                            {currentRequest.adminResponse}
                                        </p>
                                    </div>
                                )}
                                {currentRequest.rejectionReason && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#030105] mb-1">
                                            Rejection Reason
                                        </label>
                                        <p className="text-sm text-[#030105] bg-gray-50 p-3 rounded whitespace-pre-wrap">
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
                                className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                            >
                                <h3 className="font-semibold text-[#030105] mb-4">
                                    Uploaded Images
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {currentRequest.images.map((image, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={image}
                                                alt={`Request image ${index + 1}`}
                                                className="w-full h-48 object-contain rounded-lg cursor-pointer hover:opacity-80 transition-opacity bg-gray-50 border border-gray-200"
                                                onClick={() => window.open(image, '_blank')}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Column - Admin Actions */}
                    <div className="space-y-6">
                        {/* Admin Response Form */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.1 }}
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-4">
                                Admin Response
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="under_review">Under Review</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                    </select>
                                </div>


                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Admin Response {formData.status === 'approved' && <span className="text-red-500">*</span>}
                                    </label>
                                    <textarea
                                        name="adminResponse"
                                        value={formData.adminResponse}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        rows={4}
                                        required={formData.status === 'approved'}
                                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                        placeholder="Enter your response to the customer..."
                                    />
                                </div>

                                {formData.status === 'rejected' && (
                                    <div>
                                        <label className="block text-sm font-medium text-[#030105] mb-1">
                                            Rejection Reason *
                                        </label>
                                        <textarea
                                            name="rejectionReason"
                                            value={formData.rejectionReason}
                                            onChange={handleInputChange}
                                            disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
                                            placeholder="Please provide a reason for rejection..."
                                            required
                                        />
                                    </div>
                                )}


                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Internal Notes
                                    </label>
                                    <textarea
                                        name="internalNotes"
                                        value={formData.internalNotes}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        rows={3}
                                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
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
                            className="bg-[#fffefc] rounded-lg shadow-sm border border-[#f7e9b8] p-6"
                        >
                            <h3 className="font-semibold text-[#030105] mb-4">
                                Replacement Product
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Replacement Product
                                    </label>
                                    <select
                                        name="replacementProductId"
                                        value={formData.replacementProductId}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
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
                                    <label className="block text-sm font-medium text-[#030105] mb-1">
                                        Replacement Quantity
                                    </label>
                                    <input
                                        type="number"
                                        name="replacementQuantity"
                                        value={formData.replacementQuantity}
                                        onChange={handleInputChange}
                                        disabled={!isEditing || (currentRequest.status === 'approved' || currentRequest.status === 'rejected')}
                                        min="1"
                                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent bg-[#fffefc] disabled:bg-gray-100"
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
