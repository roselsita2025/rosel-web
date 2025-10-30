import { motion } from 'framer-motion';
import { Clock, Package, User, ArrowRight } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useReplacementRequestStore } from '../store/replacementRequestStore';

const ReplacementRequestCard = ({ request, onClick, showCustomerInfo = false }) => {
    const { getReasonText } = useReplacementRequestStore();

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -2 }}
            className="rounded-lg shadow-md border border-gray-300 hover:shadow-lg transition-all duration-200 cursor-pointer bg-[#fffefc]"
            onClick={onClick}
        >
            <div className="p-3 sm:p-4 md:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4 gap-2">
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1.5 sm:mb-2">
                            <h3 className="text-base sm:text-lg font-semibold text-[#860809] font-libre">
                                Request #{request.requestNumber}
                            </h3>
                            <StatusBadge status={request.status} />
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4 text-xs sm:text-sm text-[#a31f17] mb-2 sm:mb-3 font-libre">
                            <div className="flex items-center gap-1">
                                <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate max-w-[120px] sm:max-w-none">
                                    {request.product?.name || 'Product'}
                                    {(() => {
                                        if (request.product?.weightOptions && request.product.weightOptions.length > 0) {
                                            const firstWeight = request.product.weightOptions[0];
                                            if (firstWeight && firstWeight.weightKg) {
                                                return ` (${firstWeight.weightKg}kg)`;
                                            }
                                        }
                                        return '';
                                    })()}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Qty: {request.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{formatDate(request.createdAt)}</span>
                            </div>
                        </div>

                        {showCustomerInfo && request.user && (
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-[#a31f17] mb-2 sm:mb-3 font-libre">
                                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                <span className="truncate">{request.user.name} ({request.user.email})</span>
                            </div>
                        )}

                        <div className="mb-2 sm:mb-3">
                            <p className="text-xs sm:text-sm text-[#030105] font-libre">
                                <span className="font-medium font-alice">Reason:</span> {getReasonText(request.reason)}
                            </p>
                        </div>

                        <p className="text-xs sm:text-sm text-[#a31f17] line-clamp-2 font-libre">
                            {request.description}
                        </p>
                    </div>
                    
                    <div className="flex items-center text-gray-400 ml-2 sm:ml-3 md:ml-4 flex-shrink-0">
                        <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                </div>

                {request.adminResponse && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-xs sm:text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Admin Response:</span> {request.adminResponse}
                        </p>
                    </div>
                )}

                {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-xs sm:text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Reject Reason:</span> {request.rejectionReason}
                        </p>
                    </div>
                )}

                {request.trackingNumber && (
                    <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-xs sm:text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Tracking:</span> {request.trackingNumber}
                        </p>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default ReplacementRequestCard;
