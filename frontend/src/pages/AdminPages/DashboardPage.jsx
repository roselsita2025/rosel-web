import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Package, ShoppingCart, Calculator, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { productStore } from "../../store/productStore.js";
import { useAuthStore } from "../../store/authStore.js";
import AdminLayout from "../../components/AdminLayout.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { products, fetchAllProducts, loading: productsLoading } = productStore();
  const { isAuthenticated, isCheckingAuth } = useAuthStore();
  
  // For now, using a placeholder name - this should be replaced with actual user data
  const userName = "Admin"; // This should come from user context/store

  const [analyticsData, setAnalyticsData] = useState({
    users: 0,
    products: 0,
    totalSales: 0,
    totalRevenue: 0,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [dailySalesData, setDailySalesData] = useState([]);
  const [timeframe, setTimeframe] = useState('today');
  const [selectedDate, setSelectedDate] = useState(''); // format: YYYY-MM-DD
  const [rangeStart, setRangeStart] = useState('');
  const [rangeEnd, setRangeEnd] = useState('');
  const [customMode, setCustomMode] = useState('date'); // 'date' | 'range'
  const [dataSource, setDataSource] = useState('combined'); // 'orders', 'pos', 'combined'
  const [newOrders, setNewOrders] = useState(0);
  const [totalSalesQty, setTotalSalesQty] = useState(0);
  const [topProducts, setTopProducts] = useState([]);
  const [timeframeRevenue, setTimeframeRevenue] = useState(0);
  // Sorting and filtering states
  const [productSort, setProductSort] = useState('qtyDesc'); // qtyDesc | qtyAsc | revenueDesc | revenueAsc | recentDesc | recentAsc | nameAsc | nameDesc | catAsc | catDesc
  const [productNameFilter, setProductNameFilter] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');
  // Pagination states for top selling products
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  // Inventory table UI state
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventorySort, setInventorySort] = useState('nameAsc'); // nameAsc|nameDesc|catAsc|catDesc|qtyAsc|qtyDesc|priceAsc|priceDesc|valueAsc|valueDesc
  const [isInventorySortOpen, setIsInventorySortOpen] = useState(false);
  const handleGenerateSalesCsv = () => {
    try {
      const csvEscape = (v) => {
        const s = String(v ?? '');
        const needsQuotes = /[",\n\r]/.test(s);
        const escaped = s.replace(/"/g, '""');
        return needsQuotes ? `"${escaped}"` : escaped;
      };

      const header = ['date', 'sales', 'revenue'];
      const lines = [header.join(',')];
      (dailySalesData || []).forEach((row) => {
        const date = csvEscape(row?.date ?? '');
        const sales = csvEscape(row?.sales ?? 0);
        const revenue = csvEscape(row?.revenue ?? 0);
        lines.push([date, sales, revenue].join(','));
      });

      // Append Top Selling Products section
      lines.push('');
      const topHeader = ['productName', 'productCategory', 'stocksSold', 'revenue'];
      lines.push(topHeader.join(','));
      (topProducts || []).forEach((p) => {
        const name = csvEscape(p?.productName ?? '');
        const category = csvEscape(p?.productCategory ?? '');
        const qty = csvEscape(p?.quantitySold ?? 0);
        const rev = csvEscape(p?.revenue ?? 0);
        lines.push([name, category, qty, rev].join(','));
      });
      const csvContent = lines.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ts = new Date();
      const pad = (n) => String(n).padStart(2, '0');
      const fname = `sales_report_${ts.getFullYear()}${pad(ts.getMonth()+1)}${pad(ts.getDate())}_${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}.csv`;
      a.setAttribute('download', fname);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate CSV:', e);
    }
  };

  const allCategories = useMemo(() => {
    const setCat = new Set();
    topProducts.forEach((p) => p?.productCategory && setCat.add(p.productCategory));
    return Array.from(setCat).sort((a,b)=>a.localeCompare(b));
  }, [topProducts]);

  const productCategories = useMemo(() => {
    const setCat = new Set();
    (products || []).forEach((p) => p?.category && setCat.add(p.category));
    return Array.from(setCat).sort((a, b) => a.localeCompare(b));
  }, [products]);

  // Pagination logic for top selling products
  const filteredAndSortedProducts = useMemo(() => {
    return topProducts
      .filter(row => !productNameFilter || row.productName.toLowerCase().includes(productNameFilter.toLowerCase()))
      .filter(row => !productCategoryFilter || (row.productCategory || '') === productCategoryFilter)
      .slice()
      .sort((a,b)=>{
        switch(productSort){
          case 'qtyAsc': return a.quantitySold - b.quantitySold;
          case 'qtyDesc': return b.quantitySold - a.quantitySold;
          case 'revenueAsc': return a.revenue - b.revenue;
          case 'revenueDesc': return b.revenue - a.revenue;
          case 'recentAsc': return new Date(a.latestOrderDate) - new Date(b.latestOrderDate);
          case 'recentDesc': return new Date(b.latestOrderDate) - new Date(a.latestOrderDate);
          case 'nameDesc': return b.productName.localeCompare(a.productName);
          case 'catAsc': return (a.productCategory || '').localeCompare(b.productCategory || '');
          case 'catDesc': return (b.productCategory || '').localeCompare(a.productCategory || '');
          case 'nameAsc':
          default: return a.productName.localeCompare(b.productName);
        }
      });
  }, [topProducts, productNameFilter, productCategoryFilter, productSort]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredAndSortedProducts.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [productNameFilter, productCategoryFilter, productSort]);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/by-source?source=${dataSource}`);
        setAnalyticsData(response.data.analyticsData);
        setDailySalesData(response.data.dailySalesData);
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dataSource]);

  useEffect(() => {
    const fetchNewOrders = async () => {
      try {
        let params = { timeframe, source: dataSource };
        if (timeframe === 'custom') {
          if (customMode === 'date') {
            if (!selectedDate) { setNewOrders(0); return; }
            params = { date: selectedDate, source: dataSource };
          } else if (customMode === 'range') {
            if (!rangeStart || !rangeEnd) { setNewOrders(0); return; }
            params = { start: rangeStart, end: rangeEnd, source: dataSource };
          }
        }
        const response = await axios.get(`${API_URL}/analytics/new-orders-by-source`, { params });
        setNewOrders(response.data?.newOrders || 0);
      } catch (error) {
        console.error('Error fetching new orders:', error);
        setNewOrders(0);
      }
    };

    fetchNewOrders();
  }, [timeframe, selectedDate, rangeStart, rangeEnd, customMode, dataSource]);

  useEffect(() => {
    const fetchTotalSales = async () => {
      try {
        let params = { timeframe, source: dataSource };
        if (timeframe === 'custom') {
          if (customMode === 'date') {
            if (!selectedDate) { setTotalSalesQty(0); return; }
            params = { date: selectedDate, source: dataSource };
          } else if (customMode === 'range') {
            if (!rangeStart || !rangeEnd) { setTotalSalesQty(0); return; }
            params = { start: rangeStart, end: rangeEnd, source: dataSource };
          }
        }
        const response = await axios.get(`${API_URL}/analytics/total-sales-by-source`, { params });
        setTotalSalesQty(response.data?.totalSalesQuantity || 0);
      } catch (error) {
        console.error('Error fetching total sales quantity:', error);
        setTotalSalesQty(0);
      }
    };

    fetchTotalSales();
  }, [timeframe, selectedDate, rangeStart, rangeEnd, customMode, dataSource]);

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        let params = { timeframe, source: dataSource };
        if (timeframe === 'custom') {
          if (customMode === 'date') {
            if (!selectedDate) { setTimeframeRevenue(0); return; }
            params = { date: selectedDate, source: dataSource };
          } else if (customMode === 'range') {
            if (!rangeStart || !rangeEnd) { setTimeframeRevenue(0); return; }
            params = { start: rangeStart, end: rangeEnd, source: dataSource };
          }
        }
        const response = await axios.get(`${API_URL}/analytics/revenue-by-source`, { params });
        setTimeframeRevenue(response.data?.revenue || 0);
      } catch (error) {
        console.error('Error fetching revenue:', error);
        setTimeframeRevenue(0);
      }
    };


    const fetchTopProducts = async () => {
      try {
        let params = { timeframe, limit: 10, source: dataSource };
        if (timeframe === 'custom') {
          if (customMode === 'date') {
            if (!selectedDate) { setTopProducts([]); return; }
            params = { date: selectedDate, limit: 10, source: dataSource };
          } else if (customMode === 'range') {
            if (!rangeStart || !rangeEnd) { setTopProducts([]); return; }
            params = { start: rangeStart, end: rangeEnd, limit: 10, source: dataSource };
          }
        }
        const response = await axios.get(`${API_URL}/analytics/top-products-by-source`, { params });
        setTopProducts(response.data?.products || []);
      } catch (error) {
        console.error('Error fetching top products:', error);
        setTopProducts([]);
      }
    };

    fetchRevenue();
    fetchTopProducts();
  }, [timeframe, selectedDate, rangeStart, rangeEnd, customMode, dataSource]);

  useEffect(() => {
    if (isAuthenticated && !isCheckingAuth) {
      fetchAllProducts();
    }
  }, [isAuthenticated, isCheckingAuth, fetchAllProducts]);

  const handleAddProduct = () => {
    navigate('/admin/create-product');
  };

  if (isLoading) {
    return (
      <div className='py-8'>
        <div className='relative z-10 container mx-auto px-4'>
          <div className='text-center text-[#030105] text-lg'>
            Loading analytics data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className='py-4'>
        <div className='relative z-10 container mx-auto px-6 bg-[#f8f3ed] min-h-screen'>
        {/* Analytics Cards Section */}
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-xl font-bold text-[#860809] font-libre'>Analytics</h2>
          <div className='flex gap-2 items-center'>
            <button
              type='button'
              onClick={handleGenerateSalesCsv}
              className='px-3 py-1 rounded-md text-sm font-medium bg-[#860809] text-white hover:bg-[#a31f17] transition-colors duration-200 font-alice'
            >
              Generate Sales Report
            </button>
            {[
              { key: 'today', label: 'Today' },
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' },
              { key: 'year', label: 'Year' },
              { key: 'custom', label: 'Custom' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => {
                  setTimeframe(option.key);
                  if (option.key !== 'custom') {
                    setSelectedDate('');
                    setRangeStart('');
                    setRangeEnd('');
                  }
                }}
                className={`${
                  timeframe === option.key
                    ? 'bg-[#860809] text-white'
                    : 'bg-[#f8f3ed] text-[#030105]'
                } px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 font-alice`}
              >
                {option.label}
              </button>
            ))}
            {timeframe === 'custom' && (
              <div className='flex items-center gap-3'>
                <div className='flex gap-2'>
                  <button onClick={()=>setCustomMode('date')} className={`px-2 py-1 rounded-md text-sm font-alice ${customMode==='date' ? 'bg-[#860809] text-white' : 'bg-[#f8f3ed] text-[#030105]'}`}>Select Date</button>
                  <button onClick={()=>setCustomMode('range')} className={`px-2 py-1 rounded-md text-sm font-alice ${customMode==='range' ? 'bg-[#860809] text-white' : 'bg-[#f8f3ed] text-[#030105]'}`}>Range</button>
                </div>
                {customMode === 'date' && (
                  <div className='flex items-center gap-2'>
                    <input
                      type='date'
                      value={selectedDate}
                      onChange={(e)=>{ setSelectedDate(e.target.value); }}
                      className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice'
                    />
                    {selectedDate && (
                      <button onClick={()=>setSelectedDate('')} className='px-2 py-1 rounded-md text-sm bg-[#f8f3ed] text-[#030105] font-alice'>Clear</button>
                    )}
                  </div>
                )}
                {customMode === 'range' && (
                  <div className='flex items-center gap-2'>
                    <input
                      type='date'
                      value={rangeStart}
                      onChange={(e)=>{ setRangeStart(e.target.value); }}
                      className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice'
                    />
                    <span className='text-[#030105] text-sm font-alice'>to</span>
                    <input
                      type='date'
                      value={rangeEnd}
                      onChange={(e)=>{ setRangeEnd(e.target.value); }}
                      className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice'
                    />
                    {(rangeStart || rangeEnd) && (
                      <button onClick={()=>{ setRangeStart(''); setRangeEnd(''); }} className='px-2 py-1 rounded-md text-sm bg-[#f8f3ed] text-[#030105] font-alice'>Clear</button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Data Source Selection */}
        <div className='flex items-center justify-center mb-6'>
          <div className='flex gap-2 items-center bg-[#f8f3ed] p-1 rounded-lg'>
            <span className='text-sm font-medium text-[#030105] mr-2 font-alice'>Data Source:</span>
            {[
              { key: 'orders', label: 'Online Orders Only' },
              { key: 'pos', label: 'POS Only' },
              { key: 'combined', label: 'Combined' },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setDataSource(option.key)}
                className={`${
                  dataSource === option.key
                    ? 'bg-[#860809] text-white'
                    : 'bg-transparent text-[#030105] hover:bg-[#860809] hover:text-white'
                } px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 font-alice`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6'>
          <AnalyticsCard
            title={dataSource === 'orders' ? 'New Orders' : dataSource === 'pos' ? 'New Transactions' : 'New Orders & Transactions'}
            value={newOrders.toLocaleString()}
            icon={Package}
            color='from-[#860809] to-[#a31f17]'
          />
          <AnalyticsCard
            title='Total Sales'
            value={totalSalesQty.toLocaleString()}
            icon={ShoppingCart}
            color='from-[#860809] to-[#a31f17]'
          />
          <AnalyticsCard
            title='Total Revenue'
            value={`₱${timeframeRevenue.toLocaleString()}`}
            icon={() => <span className="text-2xl font-bold">₱</span>}
            color='from-[#860809] to-[#a31f17]'
          />
          <AnalyticsCard
            title={dataSource === 'orders' ? 'Average Order Value' : dataSource === 'pos' ? 'Average Transaction Value' : 'Average Value'}
            value={`₱${(newOrders > 0 ? (timeframeRevenue / newOrders) : 0).toFixed(2)}`}
            icon={Calculator}
            color='from-[#860809] to-[#a31f17]'
          />
        </div>

        {/* Top Selling Product Section */}
        <div className='mb-6'>
          {/* Top Selling Product */}
          <motion.div
            className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 overflow-hidden'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className='px-6 py-4 border-b border-gray-300'>
              <h2 className='text-2xl font-bold text-[#860809] mb-2 font-libre'>
                {dataSource === 'orders' ? 'Top Selling Products (Online Orders)' : 
                 dataSource === 'pos' ? 'Top Selling Products (POS)' : 
                 'Top Selling Products (Combined)'}
              </h2>
              <p className='text-[#a31f17] opacity-80 mb-3 font-alice'>Based on Purchase Success</p>
              <div className='flex flex-col sm:flex-row gap-3 sm:items-end'>
                <div className='flex flex-col'>
                  <label className='text-xs text-[#a31f17] mb-1 font-alice'>Search Product</label>
                  <input value={productNameFilter} onChange={(e)=>setProductNameFilter(e.target.value)} placeholder='e.g. Tenderloin' className='px-2 py-1 rounded border border-gray-300 text-[#030105] bg-[#fffefc] font-alice' />
                </div>
                <div className='flex flex-col'>
                  <label className='text-xs text-[#a31f17] mb-1 font-alice'>Search Category</label>
                  <select value={productCategoryFilter} onChange={(e)=>setProductCategoryFilter(e.target.value)} className='px-2 py-1 rounded border border-gray-300 text-[#030105] bg-[#fffefc] min-w-[200px] font-alice'>
                    <option value=''>All Categories</option>
                    {allCategories.map((cat)=> (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
            {topProducts.length === 0 ? (
              <div className='flex justify-center items-center py-12'>
                <div className='text-[#030105] text-lg'>No data</div>
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-300'>
                  <thead className='bg-[#f8f3ed]'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-[#030105] uppercase tracking-wider font-alice'>
                        <button 
                          onClick={() => setProductSort(productSort === 'nameAsc' ? 'nameDesc' : 'nameAsc')}
                          className='flex items-center gap-1 hover:text-[#860809] transition-colors font-alice'
                        >
                          Product
                          {productSort === 'nameAsc' ? <ChevronUp className='h-3 w-3' /> : productSort === 'nameDesc' ? <ChevronDown className='h-3 w-3' /> : <ArrowUpDown className='h-3 w-3' />}
                        </button>
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-[#030105] uppercase tracking-wider font-alice'>
                        <button 
                          onClick={() => setProductSort(productSort === 'catAsc' ? 'catDesc' : 'catAsc')}
                          className='flex items-center gap-1 hover:text-[#860809] transition-colors font-alice'
                        >
                          Category
                          {productSort === 'catAsc' ? <ChevronUp className='h-3 w-3' /> : productSort === 'catDesc' ? <ChevronDown className='h-3 w-3' /> : <ArrowUpDown className='h-3 w-3' />}
                        </button>
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-[#030105] uppercase tracking-wider font-alice'>
                        <button 
                          onClick={() => setProductSort(productSort === 'qtyAsc' ? 'qtyDesc' : 'qtyAsc')}
                          className='flex items-center gap-1 hover:text-[#860809] transition-colors font-alice'
                        >
                          Stocks Sold
                          {productSort === 'qtyAsc' ? <ChevronUp className='h-3 w-3' /> : productSort === 'qtyDesc' ? <ChevronDown className='h-3 w-3' /> : <ArrowUpDown className='h-3 w-3' />}
                        </button>
                      </th>
                      <th className='px-6 py-3 text-left text-xs font-medium text-[#030105] uppercase tracking-wider font-alice'>
                        <button 
                          onClick={() => setProductSort(productSort === 'revenueAsc' ? 'revenueDesc' : 'revenueAsc')}
                          className='flex items-center gap-1 hover:text-[#860809] transition-colors font-alice'
                        >
                          Revenue
                          {productSort === 'revenueAsc' ? <ChevronUp className='h-3 w-3' /> : productSort === 'revenueDesc' ? <ChevronDown className='h-3 w-3' /> : <ArrowUpDown className='h-3 w-3' />}
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-[#fffefc] divide-y divide-gray-300'>
                    {currentProducts.map((row) => {
                        // Find the product in the products store to get the image
                        const product = products?.find(p => p._id === row.productId);
                        const productImage = product?.image || product?.mainImageUrl || '/placeholder-product.png';
                        
                        return (
                      <tr key={row.productId} className='hover:bg-[#f8f3ed] hover:bg-opacity-30 transition-colors duration-200'>
                        <td className='px-6 py-4 whitespace-nowrap'>
                            <div className='flex items-center'>
                              <div className='flex-shrink-0 h-10 w-10 mr-3'>
                                <img
                                  className='h-10 w-10 rounded-full object-cover'
                                  src={productImage}
                                  alt={row.productName}
                                  onError={(e) => {
                                    e.target.src = '/placeholder-product.png';
                                  }}
                                />
                              </div>
                          <div className='text-sm font-medium text-[#030105] font-alice'>{row.productName}</div>
                            </div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-[#030105] font-libre'>{row.productCategory || '-'}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-[#030105] font-libre'>{row.quantitySold}</div>
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap'>
                          <div className='text-sm text-[#030105] font-libre'>₱{row.revenue.toFixed(2)}</div>
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Pagination Controls */}
            {filteredAndSortedProducts.length > itemsPerPage && (
              <div className="px-6 py-4 border-t border-gray-300 bg-[#f8f3ed]">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-[#030105] font-alice">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredAndSortedProducts.length)} of {filteredAndSortedProducts.length} products
                  </div>
                  <div className="flex items-center space-x-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-alice ${
                        currentPage === 1
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
                      }`}
                    >
                      Prev
                    </button>
                    
                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-alice ${
                          currentPage === pageNum
                            ? 'bg-[#860809] text-white'
                            : 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    
                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors font-alice ${
                        currentPage === totalPages
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-[#f8f3ed] text-[#030105] hover:bg-[#860809] hover:text-white'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Line Chart Section */}
        <motion.div
          className='bg-[#fffefc] rounded-lg p-6 shadow-lg border border-gray-300 mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          <h2 className='text-2xl font-bold text-[#860809] mb-6 font-libre'>
            {dataSource === 'orders' ? 'Online Orders Sales & Revenue Trends' : 
             dataSource === 'pos' ? 'POS Sales & Revenue Trends' : 
             'Combined Sales & Revenue Trends'}
          </h2>
          <ResponsiveContainer width='100%' height={400}>
            <LineChart data={dailySalesData}>
              <CartesianGrid strokeDasharray='3 3' stroke='#f8f3ed' />
              <XAxis dataKey='date' stroke='#030105' />
              <YAxis yAxisId='left' stroke='#030105' />
              <YAxis yAxisId='right' orientation='right' stroke='#030105' />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#fffefc',
                  border: '1px solid #f8f3ed',
                  borderRadius: '8px',
                  color: '#030105'
                }}
              />
              <Legend />
              <Line
                yAxisId='left'
                type='monotone'
                dataKey='sales'
                stroke='#22c55e'
                strokeWidth={3}
                activeDot={{ r: 8, fill: '#16a34a' }}
                name='Sales'
              />
              <Line
                yAxisId='right'
                type='monotone'
                dataKey='revenue'
                stroke='#3b82f6'
                strokeWidth={3}
                activeDot={{ r: 8, fill: '#2563eb' }}
                name='Revenue'
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

      </div>
    </div>
    </AdminLayout>
  );
};

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
            className={`bg-[#fffefc] rounded-lg p-4 shadow-lg overflow-hidden relative border border-gray-300`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className='flex justify-between items-center'>
      <div className='z-10'>
        <p className='text-[#a31f17] text-sm mb-1 font-semibold opacity-80 font-alice'>{title}</p>
        <h3 className='text-[#030105] text-3xl font-bold font-libre'>{value}</h3>
      </div>
    </div>
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
    <div className='absolute -bottom-2 -right-2 text-[#860809] opacity-20'>
      <Icon className='h-20 w-20' />
    </div>
  </motion.div>
);

export default DashboardPage;