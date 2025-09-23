import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, User, Calendar, MessageSquare, Truck, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useReplacementRequestStore } from '../store/replacementRequestStore';

const ReplacementRequestModal = ({ request, isOpen, onClose, isAdmin = false }) => {
    const { getReasonText } = useReplacementRequestStore();

    if (!request) return null;

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: '#f8f3ed' }}
                    >
                        <div className="p-6">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        Replacement Request #{request.requestNumber}
                                    </h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <StatusBadge status={request.status} />
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column - Request Details */}
                                <div className="space-y-6">
                                    {/* Product Information */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <Package className="h-5 w-5 mr-2" />
                                            Product Information
                                        </h3>
                                        <div className="flex items-start gap-4">
                                            {request.product?.image && (
                                                <img
                                                    src={request.product.image}
                                                    alt={request.product.name}
                                                    className="w-20 h-20 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900">
                                                    {request.product?.name}
                                                </h4>
                                                <p className="text-sm text-gray-600">
                                                    Category: {request.product?.category}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Price: ₱{request.product?.price?.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    Quantity: {request.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <AlertCircle className="h-5 w-5 mr-2" />
                                            Request Details
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Reason:</span>
                                                <span className="font-medium">{getReasonText(request.reason)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Submitted:</span>
                                                <span className="font-medium">{formatDate(request.createdAt)}</span>
                                            </div>
                                            {request.adminResponseDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <span className="font-medium">{formatDate(request.adminResponseDate)}</span>
                                                </div>
                                            )}
                                            {request.estimatedResolutionDate && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Estimated Resolution:</span>
                                                    <span className="font-medium">{formatDate(request.estimatedResolutionDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Information (Admin only) */}
                                    {isAdmin && request.user && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <User className="h-5 w-5 mr-2" />
                                                Customer Information
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Name:</span>
                                                    <span className="font-medium">{request.user.name}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="font-medium">{request.user.email}</span>
                                                </div>
                                                {request.user.phone && (
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600">Phone:</span>
                                                        <span className="font-medium">{request.user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Information */}
                                    {request.order && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Calendar className="h-5 w-5 mr-2" />
                                                Order Information
                                            </h3>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Number:</span>
                                                    <span className="font-medium">#{request.order._id?.slice(-8).toUpperCase()}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Order Date:</span>
                                                    <span className="font-medium">{formatDate(request.order.createdAt)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total Amount:</span>
                                                    <span className="font-medium">${request.order.totalAmount?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Description and Images */}
                                <div className="space-y-6">
                                    {/* Description */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                            <MessageSquare className="h-5 w-5 mr-2" />
                                            Description
                                        </h3>
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap">
                                                {request.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    {request.images && request.images.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">
                                                Uploaded Images
                                            </h3>
                                            <div className="grid grid-cols-2 gap-4">
                                                {request.images.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={image}
                                                            alt={`Request image ${index + 1}`}
                                                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
                                                            onClick={() => window.open(image, '_blank')}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Admin Response */}
                                    {request.adminResponse && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">
                                                Admin Response
                                            </h3>
                                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                                                <p className="text-gray-700 whitespace-pre-wrap">
                                                    {request.adminResponse}
                                                </p>
                                                {request.handledBy && (
                                                    <p className="text-sm text-gray-600 mt-2">
                                                        Handled by: {request.handledBy.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Information */}
                                    {request.trackingNumber && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Truck className="h-5 w-5 mr-2" />
                                                Tracking Information
                                            </h3>
                                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-400">
                                                <p className="text-gray-700">
                                                    <span className="font-medium">Tracking Number:</span> {request.trackingNumber}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replacement Product */}
                                    {request.replacementProduct && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-3">
                                                Replacement Product
                                            </h3>
                                            <div className="bg-gray-50 p-4 rounded-lg">
                                                <div className="flex items-start gap-4">
                                                    {request.replacementProduct.image && (
                                                        <img
                                                            src={request.replacementProduct.image}
                                                            alt={request.replacementProduct.name}
                                                            className="w-16 h-16 object-cover rounded"
                                                        />
                                                    )}
                                                    <div>
                                                        <h4 className="font-medium text-gray-900">
                                                            {request.replacementProduct.name}
                                                        </h4>
                                                        <p className="text-sm text-gray-600">
                                                            Quantity: {request.replacementQuantity || request.quantity}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            Price: ${request.replacementProduct.price?.toFixed(2)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ReplacementRequestModal;
