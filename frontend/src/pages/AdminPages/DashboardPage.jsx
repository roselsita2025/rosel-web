import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Package, ShoppingCart, Calculator, ArrowUpDown, ChevronUp, ChevronDown, PhilippinePeso } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
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
  const [categorySalesData, setCategorySalesData] = useState([]);
  const [customerData, setCustomerData] = useState([]);
  const [ratingDistribution, setRatingDistribution] = useState({});
  const [customerCurrentPage, setCustomerCurrentPage] = useState(1);
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
        
        // Note: topProducts data is fetched separately in another useEffect
        // Category sales data will be processed when topProducts state updates
        
        console.log(response.data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dataSource]);

  // Process category sales data when topProducts changes
  useEffect(() => {
    if (topProducts && topProducts.length > 0) {
      console.log('Processing topProducts for category sales:', topProducts);
      const categoryMap = new Map();
      topProducts.forEach(product => {
        const category = product.productCategory || 'Uncategorized';
        if (categoryMap.has(category)) {
          const existing = categoryMap.get(category);
          existing.quantitySold += product.quantitySold || 0;
          existing.revenue += product.revenue || 0;
        } else {
          categoryMap.set(category, {
            category,
            quantitySold: product.quantitySold || 0,
            revenue: product.revenue || 0
          });
        }
      });
      
      // Color palette for different categories
      const colors = [
        '#860809', // Dark red for highest
        '#a31f17', // Medium red for second
        '#c53030', // Lighter red for third
        '#e53e3e', // Even lighter red
        '#fc8181', // Light red
        '#feb2b2', // Lightest red
        '#fed7d7', // Very light red
        '#fbb6ce', // Pink-red
        '#f687b3', // Medium pink
        '#ed64a6'  // Dark pink
      ];
      
      const processedData = Array.from(categoryMap.values())
        .sort((a, b) => b.quantitySold - a.quantitySold)
        .map((item, index) => ({
          ...item,
          color: colors[index % colors.length]
        }));
      
      setCategorySalesData(processedData);
      console.log('Processed Category Sales Data:', processedData);
    } else {
      console.log('No topProducts data available for category processing');
      setCategorySalesData([]);
    }
  }, [topProducts]);

  // Fetch customer analytics data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/customers?timeframe=${timeframe}&source=${dataSource}`);
        console.log('Customer Analytics Response:', response.data);
        setCustomerData(response.data.customerData || []);
        setRatingDistribution(response.data.ratingDistribution || {});
      } catch (error) {
        console.error("Error fetching customer data:", error);
        setCustomerData([]);
        setRatingDistribution({});
      }
    };

    fetchCustomerData();
  }, [timeframe, dataSource]);

  // Pagination logic for customer table
  const customerItemsPerPage = 5;
  const customerTotalPages = Math.ceil(customerData.length / customerItemsPerPage);
  const customerStartIndex = (customerCurrentPage - 1) * customerItemsPerPage;
  const customerEndIndex = customerStartIndex + customerItemsPerPage;
  const currentCustomers = customerData.slice(customerStartIndex, customerEndIndex);

  // Reset to first page when customer data changes
  useEffect(() => {
    setCustomerCurrentPage(1);
  }, [customerData]);

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
        {/* Analytics Section */}
        <div className='mb-6'>
          <h2 className='text-xl font-bold text-[#860809] font-libre mb-4'>Analytics</h2>
          
          <div className='flex flex-col lg:flex-row gap-4 items-center'>
            {/* First Column: Data Source */}
            <div className='flex-1'>
              <div className='flex gap-2 items-center bg-[#f8f3ed] p-1 rounded-lg'>
                <span className='text-sm font-medium text-[#030105] mr-2 font-alice'>Data Source:</span>
                {[
                  { key: 'orders', label: 'Online Orders' },
                  { key: 'pos', label: 'POS' },
                  { key: 'combined', label: 'All' },
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

            {/* Second Column: Timeframe Selection */}
            <div className='flex-1'>
              <div className='flex gap-2 items-center justify-center'>
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
              </div>
              {timeframe === 'custom' && (
                <div className='flex items-center gap-3 mt-2 justify-center'>
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

            {/* Third Column: Generate Report Button */}
            <div className='flex-1 flex justify-end'>
              <button
                type='button'
                onClick={handleGenerateSalesCsv}
                className='px-4 py-2 rounded-md text-sm font-medium bg-[#860809] text-white hover:bg-[#a31f17] transition-colors duration-200 font-alice'
              >
                Generate Reports
              </button>
            </div>
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
            icon={PhilippinePeso}
            color='from-[#860809] to-[#a31f17]'
          />
          <AnalyticsCard
            title={dataSource === 'orders' ? 'Average Order Value' : dataSource === 'pos' ? 'Average Transaction Value' : 'Average Value'}
            value={`₱${(newOrders > 0 ? (timeframeRevenue / newOrders) : 0).toFixed(2)}`}
            icon={Calculator}
            color='from-[#860809] to-[#a31f17]'
          />
        </div>


        {/* Charts Section - Two Columns */}
        <motion.div
          className= 'mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* First Column - Bar Chart (40%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-4 w-full lg:w-2/6'>
              <h3 className='text-lg font-semibold text-[#860809] mb-4 font-libre text-center'>
                Category Sales Trends
              </h3>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={categorySalesData.length > 0 ? categorySalesData : [
                  { category: 'pork', quantitySold: 0 },
                  { category: 'beef', quantitySold: 0 },
                  { category: 'chicken', quantitySold: 0 },
                  { category: 'sliced', quantitySold: 0 },
                  { category: 'processed', quantitySold: 0 },
                  { category: 'ground', quantitySold: 0 }
                ]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.2} />
                  <XAxis 
                    dataKey='category' 
                    stroke='#030105' 
                    angle={-45}
                    textAnchor='end'
                    height={80}
                    fontSize={12}
                  />
                  <YAxis 
                    stroke='#030105' 
                    domain={[0, 8]}
                    tickCount={5}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fffefc',
                      border: '1px solid #f8f3ed',
                      borderRadius: '8px',
                      color: '#030105'
                    }}
                  />
                  <Bar 
                    dataKey='quantitySold' 
                    radius={[4, 4, 0, 0]}
                    name='Quantity Sold'
                  >
                    {categorySalesData.length > 0 ? categorySalesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#860809'} />
                    )) : [
                      { category: 'pork', quantitySold: 0 },
                      { category: 'beef', quantitySold: 0 },
                      { category: 'chicken', quantitySold: 0 },
                      { category: 'sliced', quantitySold: 0 },
                      { category: 'processed', quantitySold: 0 },
                      { category: 'ground', quantitySold: 0 }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill='#f3f4f6' />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Second Column - Line Chart (60%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-4 w-full lg:w-4/6'>
              <h3 className='text-lg font-semibold text-[#860809] mb-4 font-libre text-center'>
                {dataSource === 'orders' ? 'Online Orders Sales & Revenue Trends' : 
                 dataSource === 'pos' ? 'POS Sales & Revenue Trends' : 
                 'Combined Sales & Revenue Trends'}
              </h3>
              <ResponsiveContainer width='100%' height={300}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.2} horizontal={true} vertical={true} />
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
            </div>
          </div>
        </motion.div>

        {/* Customer Section */}
        <motion.div
          className='mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          
          <div className='flex flex-col lg:flex-row gap-6'>
            {/* First Column - Customer Table (60%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-4 w-full lg:w-3/5'>
              <h3 className='text-lg font-semibold text-[#860809] mb-2 font-libre text-center'>
                Top Customers
              </h3>
              <p className='text-xs text-gray-600 text-center mb-4 font-alice'>
                All customers (not filtered by timeframe)
              </p>
              <div className='overflow-x-auto'>
                <table className='w-full'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-[#860809] font-alice'>Customer Name</th>
                      <th className='text-left py-3 px-4 text-sm font-semibold text-[#860809] font-alice'>Email</th>
                      <th className='text-center py-3 px-4 text-sm font-semibold text-[#860809] font-alice'>Orders</th>
                      <th className='text-center py-3 px-4 text-sm font-semibold text-[#860809] font-alice'>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.length > 0 ? (
                      currentCustomers.map((customer, index) => (
                        <tr key={customer._id} className='border-b border-gray-100 hover:bg-gray-50'>
                          <td className='py-3 px-4 text-sm text-[#030105] font-alice'>{customer.customerName}</td>
                          <td className='py-3 px-4 text-sm text-[#030105] font-alice'>{customer.customerEmail}</td>
                          <td className='py-3 px-4 text-sm text-center text-[#030105] font-alice'>{customer.totalOrders}</td>
                          <td className='py-3 px-4 text-sm text-center text-[#030105] font-alice'>
                            {customer.averageRating > 0 ? (
                              <span className='flex items-center justify-center'>
                                <span className='text-yellow-500'>★</span>
                                <span className='ml-1'>{customer.averageRating}</span>
                                <span className='ml-1 text-gray-500'>({customer.totalRatings})</span>
                              </span>
                            ) : (
                              <span className='text-gray-400'>No ratings</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className='py-8 text-center text-gray-500 font-alice'>
                          No customer data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {customerTotalPages > 1 && (
                <div className='flex items-center justify-between mt-4 px-4'>
                  <div className='text-sm text-gray-600 font-alice'>
                    Showing {customerStartIndex + 1} to {Math.min(customerEndIndex, customerData.length)} of {customerData.length} customers
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => setCustomerCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={customerCurrentPage === 1}
                      className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-alice'
                    >
                      Previous
                    </button>
                    <span className='text-sm text-gray-600 font-alice'>
                      Page {customerCurrentPage} of {customerTotalPages}
                    </span>
                    <button
                      onClick={() => setCustomerCurrentPage(prev => Math.min(prev + 1, customerTotalPages))}
                      disabled={customerCurrentPage === customerTotalPages}
                      className='px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-alice'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {/* Last Updated Timestamp - Bottom of first column */}
              <div className='text-center mt-4'>
                <p className='text-xs text-gray-500 font-alice'>
                  As of {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric'
                  })}
                </p>
              </div>
            </div>

            {/* Second Column - Ratings Pie Chart (40%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-4 w-full lg:w-2/5'>
              <h3 className='text-lg font-semibold text-[#860809] mb-2 font-libre text-center'>
                Rating Distribution
              </h3>
              <p className='text-xs text-gray-600 text-center mb-4 font-alice'>
                All customer reviews (not filtered by timeframe)
              </p>
              {Object.values(ratingDistribution).some(count => count > 0) ? (
                <ResponsiveContainer width='100%' height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(ratingDistribution)
                        .filter(([rating, count]) => count > 0)
                        .map(([rating, count]) => ({
                          name: `${rating} Star${rating !== '1' ? 's' : ''}`,
                          value: count,
                          rating: parseInt(rating)
                        }))}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {Object.entries(ratingDistribution)
                        .filter(([rating, count]) => count > 0)
                        .map(([rating, count], index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={
                            rating === '5' ? '#22c55e' : // Green for 5 stars
                            rating === '4' ? '#84cc16' : // Light green for 4 stars
                            rating === '3' ? '#eab308' : // Yellow for 3 stars
                            rating === '2' ? '#f97316' : // Orange for 2 stars
                            '#ef4444' // Red for 1 star
                          } 
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: '#fffefc',
                        border: '1px solid #f8f3ed',
                        borderRadius: '8px',
                        color: '#030105'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className='flex items-center justify-center h-[300px] text-gray-500 font-alice'>
                  No rating data available
                </div>
              )}
                          {/* Last Updated Timestamp - Bottom of first column */}
            <div className='text-center mt-4'>
              <p className='text-xs text-gray-500 font-alice'>
                As of {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric'
                })}
              </p>
            </div>
            </div>
            
          </div>
        </motion.div>

        {/* Top Selling Product Section - MOVED HERE */}
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
    <div className='absolute -bottom-2 -right-2 text-[#860809] opacity-30'>
      <Icon className='h-20 w-20' />
    </div>
  </motion.div>
);

export default DashboardPage;