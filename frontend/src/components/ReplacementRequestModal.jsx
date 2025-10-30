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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4 z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                        style={{ backgroundColor: '#f8f3ed' }}
                    >
                        <div className="p-4 sm:p-6">
                            {/* Header */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        Replacement Request #{request.requestNumber}
                                    </h2>
                                    <div className="flex items-center gap-2 sm:gap-3 mt-1.5 sm:mt-2">
                                        <StatusBadge status={request.status} />
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 transition-colors self-end sm:self-auto"
                                >
                                    <X className="w-5 h-5 sm:w-6 sm:h-6" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                                {/* Left Column - Request Details */}
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Product Information */}
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                            <Package className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                            Product Information
                                        </h3>
                                        <div className="flex items-start gap-3 sm:gap-4">
                                            {request.product?.image && (
                                                <img
                                                    src={request.product.image}
                                                    alt={request.product.name}
                                                    className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded flex-shrink-0"
                                                />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                                    {request.product?.name}
                                                    {(() => {
                                                        if (request.product?.weightOptions && request.product.weightOptions.length > 0) {
                                                            const firstWeight = request.product.weightOptions[0];
                                                            if (firstWeight && firstWeight.weightKg) {
                                                                return ` (${firstWeight.weightKg}kg)`;
                                                            }
                                                        }
                                                        return '';
                                                    })()}
                                                </h4>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Category: {request.product?.category}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Price: ₱{(() => {
                                                        if (request.order && request.order.products) {
                                                            const orderProduct = request.order.products.find(p => p.product._id === request.product._id);
                                                            if (orderProduct && orderProduct.price) {
                                                                return orderProduct.price.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                            }
                                                        }
                                                        if (request.product?.basePricePerKg && request.product?.weightOptions && request.product.weightOptions.length > 0) {
                                                            const firstWeight = request.product.weightOptions[0];
                                                            if (firstWeight && firstWeight.weightKg) {
                                                                return (request.product.basePricePerKg * firstWeight.weightKg).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                            }
                                                        }
                                                        return request.product?.price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
                                                    })()}
                                                </p>
                                                <p className="text-xs sm:text-sm text-gray-600">
                                                    Quantity: {request.quantity}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Request Details */}
                                    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                            <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                            Request Details
                                        </h3>
                                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                <span className="text-gray-600">Reason:</span>
                                                <span className="font-medium">{getReasonText(request.reason)}</span>
                                            </div>
                                            <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                <span className="text-gray-600">Submitted:</span>
                                                <span className="font-medium">{formatDate(request.createdAt)}</span>
                                            </div>
                                            {request.adminResponseDate && (
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Last Updated:</span>
                                                    <span className="font-medium">{formatDate(request.adminResponseDate)}</span>
                                                </div>
                                            )}
                                            {request.estimatedResolutionDate && (
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Estimated Resolution:</span>
                                                    <span className="font-medium">{formatDate(request.estimatedResolutionDate)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Customer Information (Admin only) */}
                                    {isAdmin && request.user && (
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                                <User className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                Customer Information
                                            </h3>
                                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Name:</span>
                                                    <span className="font-medium">{request.user.name}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Email:</span>
                                                    <span className="font-medium break-all">{request.user.email}</span>
                                                </div>
                                                {request.user.phone && (
                                                    <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                        <span className="text-gray-600">Phone:</span>
                                                        <span className="font-medium">{request.user.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Order Information */}
                                    {request.order && (
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                                <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                Order Information
                                            </h3>
                                            <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Order Number:</span>
                                                    <span className="font-medium">#{request.order._id?.slice(-8).toUpperCase()}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Order Date:</span>
                                                    <span className="font-medium">{formatDate(request.order.createdAt)}</span>
                                                </div>
                                                <div className="flex flex-col sm:flex-row sm:justify-between gap-1">
                                                    <span className="text-gray-600">Total Amount:</span>
                                                    <span className="font-medium">₱{request.order.totalAmount?.toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column - Description and Images */}
                                <div className="space-y-4 sm:space-y-6">
                                    {/* Description */}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                            <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                            Description
                                        </h3>
                                        <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                            <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">
                                                {request.description}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Images */}
                                    {request.images && request.images.length > 0 && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                                                Uploaded Images
                                            </h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                                {request.images.map((image, index) => (
                                                    <div key={index} className="relative">
                                                        <img
                                                            src={image}
                                                            alt={`Request image ${index + 1}`}
                                                            className="w-full h-28 sm:h-32 object-cover rounded-lg cursor-pointer hover:opacity-80 transition-opacity"
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
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                                                Admin Response
                                            </h3>
                                            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border-l-4 border-blue-400">
                                                <p className="text-gray-700 whitespace-pre-wrap text-xs sm:text-sm">
                                                    {request.adminResponse}
                                                </p>
                                                {request.handledBy && (
                                                    <p className="text-xs sm:text-sm text-gray-600 mt-1.5 sm:mt-2">
                                                        Handled by: {request.handledBy.name}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Tracking Information */}
                                    {request.trackingNumber && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 flex items-center text-sm sm:text-base">
                                                <Truck className="h-4 w-4 sm:h-5 sm:w-5 mr-1.5 sm:mr-2 flex-shrink-0" />
                                                Tracking Information
                                            </h3>
                                            <div className="bg-green-50 p-3 sm:p-4 rounded-lg border-l-4 border-green-400">
                                                <p className="text-gray-700 text-xs sm:text-sm">
                                                    <span className="font-medium">Tracking Number:</span> {request.trackingNumber}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Replacement Product */}
                                    {request.replacementProduct && (
                                        <div>
                                            <h3 className="font-semibold text-gray-900 mb-2 sm:mb-3 text-sm sm:text-base">
                                                Replacement Product
                                            </h3>
                                            <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                                                <div className="flex items-start gap-3 sm:gap-4">
                                                    {request.replacementProduct.image && (
                                                        <img
                                                            src={request.replacementProduct.image}
                                                            alt={request.replacementProduct.name}
                                                            className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                                                        />
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                                                            {request.replacementProduct.name}
                                                        </h4>
                                                        <p className="text-xs sm:text-sm text-gray-600">
                                                            Quantity: {request.replacementQuantity || request.quantity}
                                                        </p>
                                                        <p className="text-xs sm:text-sm text-gray-600">
                                                            Price: ₱{(() => {
                                                                if (request.replacementProduct?.basePricePerKg && request.replacementProduct?.weightOptions && request.replacementProduct.weightOptions.length > 0) {
                                                                    const firstWeight = request.replacementProduct.weightOptions[0];
                                                                    if (firstWeight && firstWeight.weightKg) {
                                                                        return (request.replacementProduct.basePricePerKg * firstWeight.weightKg).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                                                    }
                                                                }
                                                                return request.replacementProduct?.price?.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00';
                                                            })()}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
                                <div className="flex justify-end">
                                    <button
                                        onClick={onClose}
                                        className="px-4 sm:px-6 py-1.5 sm:py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm sm:text-base"
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
