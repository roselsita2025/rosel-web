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
            <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-[#860809] font-libre">
                                Request #{request.requestNumber}
                            </h3>
                            <StatusBadge status={request.status} />
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-[#a31f17] mb-3 font-libre">
                            <div className="flex items-center gap-1">
                                <Package size={16} />
                                {request.product?.name || 'Product'}
                            </div>
                            <div className="flex items-center gap-1">
                                <span>Qty: {request.quantity}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Clock size={16} />
                                {formatDate(request.createdAt)}
                            </div>
                        </div>

                        {showCustomerInfo && request.user && (
                            <div className="flex items-center gap-1 text-sm text-[#a31f17] mb-3 font-libre">
                                <User size={16} />
                                <span>{request.user.name} ({request.user.email})</span>
                            </div>
                        )}

                        <div className="mb-3">
                            <p className="text-sm text-[#030105] font-libre">
                                <span className="font-medium font-alice">Reason:</span> {getReasonText(request.reason)}
                            </p>
                        </div>

                        <p className="text-sm text-[#a31f17] line-clamp-2 font-libre">
                            {request.description}
                        </p>
                    </div>
                    
                    <div className="flex items-center text-gray-400 ml-4">
                        <ArrowRight size={20} />
                    </div>
                </div>

                {request.adminResponse && (
                    <div className="mt-4 p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Admin Response:</span> {request.adminResponse}
                        </p>
                    </div>
                )}

                {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-4 p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Reject Reason:</span> {request.rejectionReason}
                        </p>
                    </div>
                )}

                {request.trackingNumber && (
                    <div className="mt-3 p-3 bg-[#f8f3ed] rounded-md">
                        <p className="text-sm text-[#030105] font-libre">
                            <span className="font-medium font-alice">Tracking:</span> {request.trackingNumber}
                        </p>
                    </div>
                )}

            </div>
        </motion.div>
    );
};

export default ReplacementRequestCard;
