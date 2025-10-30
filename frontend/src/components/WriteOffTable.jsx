import React, { useState } from 'react';
import { 
    ChevronLeft, 
    ChevronRight, 
    Search,
    Filter,
    SortAsc,
    SortDesc,
    Calendar,
    Package,
    DollarSign,
    AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

const WriteOffTable = ({ 
    writeOffs = [], 
    pagination = {}, 
    onRefresh 
}) => {
    const data = writeOffs || [];
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('createdAt');
    const [sortOrder, setSortOrder] = useState('desc');
    const [filterReason, setFilterReason] = useState('');
    const [filterCategory, setFilterCategory] = useState('');

    const reasons = [
        { value: 'expired', label: 'Expired', color: 'bg-red-100 text-red-800' },
        { value: 'damaged', label: 'Damaged', color: 'bg-orange-100 text-orange-800' },
        { value: 'defective', label: 'Defective', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'spoiled', label: 'Spoiled', color: 'bg-green-100 text-green-800' },
        { value: 'lost', label: 'Lost', color: 'bg-gray-100 text-gray-800' },
        { value: 'theft', label: 'Theft', color: 'bg-purple-100 text-purple-800' },
        { value: 'quality_issue', label: 'Quality Issue', color: 'bg-blue-100 text-blue-800' },
        { value: 'other', label: 'Other', color: 'bg-indigo-100 text-indigo-800' }
    ];

    const getReasonInfo = (reason) => {
        return reasons.find(r => r.value === reason) || { label: reason, color: 'bg-gray-100 text-gray-800' };
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleSort = (field) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };


    const filteredWriteOffs = data.filter(item => {
        const productName = item.productName || item.product?.name || '';
        const productCategory = item.productCategory || item.product?.category || '';
        const reason = item.reason || '';
        const description = item.description || '';
        const adminName = item.adminName || '';
        
        const matchesSearch = 
            productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            productCategory.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
            description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            adminName.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesReason = !filterReason || reason === filterReason;
        const matchesCategory = !filterCategory || productCategory === filterCategory;
        
        return matchesSearch && matchesReason && matchesCategory;
    });

    const sortedWriteOffs = [...filteredWriteOffs].sort((a, b) => {
        let aValue = a[sortBy];
        let bValue = b[sortBy];
        
        if (sortBy === 'createdAt') {
            aValue = new Date(aValue);
            bValue = new Date(bValue);
        }
        
        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="space-y-4">
            {/* Filters and Search */}
            <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search write-offs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                        />
                    </div>

                    {/* Reason Filter */}
                    <select
                        value={filterReason}
                        onChange={(e) => setFilterReason(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                    >
                        <option value="">All Reasons</option>
                        {reasons.map(reason => (
                            <option key={reason.value} value={reason.value}>
                                {reason.label}
                            </option>
                        ))}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                    >
                        <option value="">All Categories</option>
                        <option value="pork">Pork</option>
                        <option value="beef">Beef</option>
                        <option value="chicken">Chicken</option>
                        <option value="sliced">Sliced</option>
                        <option value="processed">Processed</option>
                        <option value="seafood">Seafood</option>
                    </select>

                    {/* Clear Filters */}
                    <button
                        onClick={() => {
                            setSearchTerm('');
                            setFilterReason('');
                            setFilterCategory('');
                        }}
                        className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#82695b]"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('productName')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Package className="w-4 h-4" />
                                        Product
                                        {sortBy === 'productName' && (
                                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Category
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Weight
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('quantity')}
                                >
                                    <div className="flex items-center gap-2">
                                        Quantity
                                        {sortBy === 'quantity' && (
                                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('cost')}
                                >
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="w-4 h-4" />
                                        Cost
                                        {sortBy === 'cost' && (
                                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Reason
                                </th>
                                <th 
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                    onClick={() => handleSort('createdAt')}
                                >
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4" />
                                        Date
                                        {sortBy === 'createdAt' && (
                                            sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />
                                        )}
                                    </div>
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sortedWriteOffs.map((writeOff, index) => {
                                const reasonInfo = getReasonInfo(writeOff.reason);
                                
                                return (
                                    <motion.tr
                                        key={writeOff._id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                                        <Package className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {writeOff.productName || writeOff.product?.name || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {writeOff.productCategory || writeOff.product?.category || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {(() => {
                                                let weight = null;
                                                
                                                // Direct weight fields
                                                if (writeOff.weightKg) weight = writeOff.weightKg;
                                                else if (writeOff.weight) weight = writeOff.weight;
                                                
                                                else if (writeOff.product?.weightOptions?.[0]?.weightKg) {
                                                    weight = writeOff.product.weightOptions[0].weightKg;
                                                }
                                                else if (writeOff.product?.weight) weight = writeOff.product.weight;
                                                else if (writeOff.product?.weightKg) weight = writeOff.product.weightKg;
                                                
                                                return weight ? `${weight}kg` : 'N/A';
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {writeOff.quantity}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <span className="text-red-600 font-medium">
                                                ₱{(writeOff.cost || writeOff.totalCost || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${reasonInfo.color}`}>
                                                {reasonInfo.label || writeOff.reason || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {formatDate(writeOff.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {writeOff.adminName}
                                        </td>
                                    </motion.tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Empty State */}
                {sortedWriteOffs.length === 0 && (
                    <div className="text-center py-12">
                        <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No write-offs found</h3>
                        <p className="text-gray-500">
                            {searchTerm || filterReason || filterCategory 
                                ? 'Try adjusting your filters to see more results.'
                                : 'No write-offs have been recorded yet.'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            disabled={!pagination.hasPrevPage}
                            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Previous
                        </button>
                        <button
                            disabled={!pagination.hasNextPage}
                            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Next
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                Showing{' '}
                                <span className="font-medium">
                                    {((pagination.currentPage - 1) * 20) + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-medium">
                                    {Math.min(pagination.currentPage * 20, pagination.totalItems)}
                                </span>{' '}
                                of{' '}
                                <span className="font-medium">{pagination.totalItems}</span>{' '}
                                results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                <button
                                    disabled={!pagination.hasPrevPage}
                                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>
                                <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                                    Page {pagination.currentPage} of {pagination.totalPages}
                                </span>
                                <button
                                    disabled={!pagination.hasNextPage}
                                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WriteOffTable;
