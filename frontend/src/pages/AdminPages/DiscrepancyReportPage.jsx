import React, { useState, useEffect } from 'react';
import { 
    TrendingDown, 
    AlertTriangle, 
    Package, 
    DollarSign, 
    Filter,
    Plus,
    RefreshCw,
    Calendar,
    BarChart3,
    Table,
    Eye
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
    LineChart, 
    Line, 
    AreaChart, 
    Area, 
    BarChart, 
    Bar, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    ResponsiveContainer 
} from 'recharts';
import WriteOffModal from '../../components/WriteOffModal';
import WriteOffTable from '../../components/WriteOffTable';
import AdminLayout from '../../components/AdminLayout';
import { useDiscrepancyStore } from '../../store/discrepancyStore';
import { productStore } from '../../store/productStore';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

// Chart colors
const COLORS = ['#82695b', '#a67c52', '#8b4513', '#d2691e', '#cd853f', '#daa520'];

const DiscrepancyReportPage = () => {
    const [activeTab, setActiveTab] = useState('analytics');
    const [dataSource, setDataSource] = useState('combined');
    const [timeframe, setTimeframe] = useState('today');
    const [customDateRange, setCustomDateRange] = useState({
        startDate: '',
        endDate: ''
    });
    const [showWriteOffModal, setShowWriteOffModal] = useState(false);
    const [selectedWriteOff, setSelectedWriteOff] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const {
        analytics,
        writeOffs,
        discrepancyDetails,
        pagination,
        fetchAnalytics,
        fetchWriteOffs,
        createWriteOff,
        updateWriteOff,
        deleteWriteOff,
        fetchDiscrepancyDetails
    } = useDiscrepancyStore();

    const { products, fetchAllProducts } = productStore();
    const { user } = useAuthStore();

    // Load initial data
    useEffect(() => {
        loadData();
    }, [dataSource, timeframe, customDateRange]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            await Promise.all([
                fetchAnalytics({ dataSource, timeframe, ...customDateRange }),
                fetchWriteOffs({ dataSource, timeframe, ...customDateRange }),
                fetchDiscrepancyDetails({ dataSource, timeframe, ...customDateRange }),
                fetchAllProducts() // Load products for the write-off modal
            ]);
        } catch (error) {
            console.error('Error loading data:', error);
            toast.error('Failed to load discrepancy data');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateWriteOff = async (writeOffData) => {
        try {
            await createWriteOff(writeOffData);
            toast.success('Write-off created successfully');
            setShowWriteOffModal(false);
            loadData(); // Refresh data
        } catch (error) {
            console.error('Error creating write-off:', error);
            toast.error('Failed to create write-off');
        }
    };


    const handleTimeframeChange = (newTimeframe) => {
        setTimeframe(newTimeframe);
        if (newTimeframe !== 'custom') {
            setCustomDateRange({ startDate: '', endDate: '' });
        }
    };

    const handleCustomDateChange = (field, value) => {
        setCustomDateRange(prev => ({
            ...prev,
            [field]: value
        }));
    };

    return (
        <AdminLayout>
            <div className="p-3 sm:p-4 md:p-6 bg-[#f8f3ed] min-h-screen">
            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">
                            Discrepancy Report
                        </h1>
                        <p className="text-xs sm:text-sm text-gray-600">
                            Track and analyze product write-offs and discrepancies
                        </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                        <button
                            onClick={() => setShowWriteOffModal(true)}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#82695b] text-white rounded-lg hover:bg-[#6b5649] active:bg-[#6b5649] transition-colors active:scale-95 whitespace-nowrap flex-1 sm:flex-initial justify-center"
                        >
                            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden xs:inline">New Write-off</span>
                            <span className="xs:hidden">Write-off</span>
                        </button>
                        <button
                            onClick={loadData}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 active:bg-gray-700 transition-colors disabled:opacity-50 active:scale-95 whitespace-nowrap flex-1 sm:flex-initial justify-center"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 md:p-6 mb-4 sm:mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                    {/* Data Source */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Data Source
                        </label>
                        <select
                            value={dataSource}
                            onChange={(e) => setDataSource(e.target.value)}
                            className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                        >
                            <option value="combined">Combined</option>
                            <option value="writeoffs">Write-offs Only</option>
                            <option value="replacements">Replacements Only</option>
                        </select>
                    </div>

                    {/* Timeframe */}
                    <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                            Timeframe
                        </label>
                        <select
                            value={timeframe}
                            onChange={(e) => handleTimeframeChange(e.target.value)}
                            className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                        >
                            <option value="today">Today</option>
                            <option value="week">This Week</option>
                            <option value="month">This Month</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {/* Custom Date Range */}
                    {timeframe === 'custom' && (
                        <>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.startDate}
                                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={customDateRange.endDate}
                                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                                    className="w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#82695b] focus:border-transparent"
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
                <div className="border-b border-gray-200">
                    <nav className="flex space-x-4 sm:space-x-8 px-3 sm:px-4 md:px-6">
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors active:scale-95 ${
                                activeTab === 'analytics'
                                    ? 'border-[#82695b] text-[#82695b]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Analytics</span>
                            </div>
                        </button>
                        <button
                            onClick={() => setActiveTab('writeoffs')}
                            className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors active:scale-95 ${
                                activeTab === 'writeoffs'
                                    ? 'border-[#82695b] text-[#82695b]'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2">
                                <Table className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                <span className="hidden xs:inline">Write-offs</span>
                            </div>
                        </button>
                    </nav>
                </div>

                <div className="p-3 sm:p-4 md:p-6">
                    {activeTab === 'analytics' && (
                        <AnalyticsTab 
                            analytics={analytics} 
                            writeOffs={writeOffs}
                            dataSource={dataSource}
                            timeframe={timeframe}
                            customDateRange={customDateRange}
                        />
                    )}
                    {activeTab === 'writeoffs' && (
                        <WriteOffsTab 
                            writeOffs={writeOffs}
                            discrepancyDetails={discrepancyDetails}
                            pagination={pagination}
                            onRefresh={loadData}
                        />
                    )}
                </div>
            </div>

            {/* Write-off Modal */}
            {showWriteOffModal && (
                <WriteOffModal
                    isOpen={showWriteOffModal}
                    onClose={() => {
                        setShowWriteOffModal(false);
                        setSelectedWriteOff(null);
                    }}
                    onSubmit={handleCreateWriteOff}
                    writeOff={selectedWriteOff}
                    products={products}
                />
            )}
            </div>
        </AdminLayout>
    );
};

// Analytics Tab Component
const AnalyticsTab = ({ analytics, writeOffs, dataSource, timeframe, customDateRange }) => {
    if (!analytics) return <div>Loading analytics...</div>;

    const { totalStocks, totalCost, categoryBreakdown, trendsData } = analytics;
    

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 sm:p-5 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-red-100 text-xs sm:text-sm font-medium">Total Stocks Lost</p>
                            <p className="text-2xl sm:text-3xl font-bold">{totalStocks || 0}</p>
                        </div>
                        <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-200 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 sm:p-5 md:p-6 text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-orange-100 text-xs sm:text-sm font-medium">Total Cost Impact</p>
                            <p className="text-2xl sm:text-3xl font-bold break-words">₱{totalCost?.toLocaleString() || 0}</p>
                        </div>
                        <DollarSign className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-orange-200 flex-shrink-0" />
                    </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 sm:p-5 md:p-6 text-white sm:col-span-2 md:col-span-1">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-yellow-100 text-xs sm:text-sm font-medium">Categories Affected</p>
                            <p className="text-2xl sm:text-3xl font-bold">{categoryBreakdown?.length || 0}</p>
                        </div>
                        <AlertTriangle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-200 flex-shrink-0" />
                    </div>
                </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Trends Chart */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Discrepancy Trends</h3>
                    <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
                        <AreaChart data={trendsData || []}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Area 
                                type="monotone" 
                                dataKey="quantity" 
                                stroke="#82695b" 
                                fill="#82695b" 
                                fillOpacity={0.3}
                                name="Quantity"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="cost" 
                                stroke="#a67c52" 
                                fill="#a67c52" 
                                fillOpacity={0.3}
                                name="Cost"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 md:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Category Breakdown</h3>
                    <ResponsiveContainer width="100%" height={250} className="sm:!h-[300px]">
                        <BarChart data={categoryBreakdown}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="category" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="quantity" fill="#82695b" name="Quantity" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
    );
};

// Write-offs Tab Component
const WriteOffsTab = ({ writeOffs, discrepancyDetails, pagination, onRefresh }) => {
    return (
        <div>
            <WriteOffTable
                writeOffs={discrepancyDetails || writeOffs}
                pagination={pagination}
                onRefresh={onRefresh}
            />
        </div>
    );
};

export default DiscrepancyReportPage;
