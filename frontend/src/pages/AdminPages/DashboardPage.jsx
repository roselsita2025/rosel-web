import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Package, ShoppingCart, Calculator, ArrowUpDown, ChevronUp, ChevronDown, PhilippinePeso, Users } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, PieChart, Pie, Sector } from "recharts";
import { productStore } from "../../store/productStore.js";
import { useAuthStore } from "../../store/authStore.js";
import AdminLayout from "../../components/AdminLayout.jsx";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

const DashboardPage = () => {
  const navigate = useNavigate();
  const { products, fetchAllProducts, loading: productsLoading } = productStore();
  const { user, isAuthenticated, isCheckingAuth } = useAuthStore();

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

  // Inventory Status panel state
  const [inventoryStatusCategory, setInventoryStatusCategory] = useState('All');
  const [inventoryShowAll, setInventoryShowAll] = useState(false);

  const inventoryStatusItems = useMemo(() => {
    const lowThreshold = 10; // configurable threshold for Low Stock
    const computeQuantity = (p) => {
      if (typeof p?.totalStockUnits === 'number') return Number(p.totalStockUnits || 0);
      if (Array.isArray(p?.weightOptions)) {
        return p.weightOptions.reduce((sum, w) => sum + Number(w?.stockUnits || 0), 0);
      }
      return Number(p?.quantity || 0);
    };

    const computeStatus = (qty) => {
      if (qty <= 0) return { label: 'Out of Stock', priority: 0, color: '#ef4444' };
      if (qty <= lowThreshold) return { label: 'Low Stock', priority: 1, color: '#f59e0b' };
      return { label: 'In Stock', priority: 2, color: '#16a34a' };
    };

    const rows = (products || []).map((p) => {
      const qty = computeQuantity(p);
      const { label, priority, color } = computeStatus(qty);
      return {
        id: p._id || p.id || p.barcode || p.name,
        name: p.name,
        category: p.category || 'Uncategorized',
        qty,
        status: label,
        priority,
        color,
      };
    });

    const filtered = inventoryStatusCategory === 'All' ? rows : rows.filter(r => r.category === inventoryStatusCategory);
    return filtered
      .sort((a, b) => a.priority - b.priority || a.qty - b.qty || a.name.localeCompare(b.name));
  }, [products, inventoryStatusCategory]);

  // Line chart month/year selection
  const MONTHS = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];
  const currentYear = new Date().getFullYear();
  const YEARS = Array.from({ length: currentYear - 2021 + 1 }, (_, i) => 2021 + i);
  // selectedMonth: -1 means "All" months
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);

  const processedDailyData = useMemo(() => {
    // If user selects All years, aggregate per year across entire dataset
    if (selectedYear === -1) {
      // Build a base list of years from 2021 up to the current year
      const base = YEARS.map((y) => ({ day: y, sales: 0, revenue: 0 }));
      const byIndex = new Map(base.map(e => [e.day, e]));
      (dailySalesData || []).forEach(row => {
        const dt = new Date(row.date);
        const y = dt.getFullYear();
        const entry = byIndex.get(y);
        if (entry) {
          entry.sales += Number(row.sales || 0);
          entry.revenue += Number(row.revenue || 0);
        }
      });
      return base;
    }

    if (selectedMonth === -1) {
      // Aggregate per month for the selected year
      const base = Array.from({ length: 12 }, (_, i) => ({ day: i + 1, sales: 0, revenue: 0 }));
      (dailySalesData || []).forEach((row) => {
        const dt = new Date(row.date);
        if (dt.getFullYear() === selectedYear) {
          const idx = dt.getMonth();
          base[idx].sales += Number(row.sales || 0);
          base[idx].revenue += Number(row.revenue || 0);
        }
      });
      return base;
    }

    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const base = Array.from({ length: daysInMonth }, (_, i) => ({ day: i + 1, sales: 0, revenue: 0 }));
    const indexByDay = new Map(base.map(d => [d.day, d]));
    (dailySalesData || []).forEach((row) => {
      const dt = new Date(row.date);
      if (dt.getFullYear() === selectedYear && dt.getMonth() === selectedMonth) {
        const day = dt.getDate();
        const entry = indexByDay.get(day);
        if (entry) {
          entry.sales = Number(row.sales || 0);
          entry.revenue = Number(row.revenue || 0);
        }
      }
    });
    return base;
  }, [dailySalesData, selectedMonth, selectedYear]);

  // Simple list for Top Products (sorted by quantity sold)
  const simpleTopProducts = useMemo(() => {
    return (topProducts || [])
      .slice()
      .sort((a, b) => (b.quantitySold || 0) - (a.quantitySold || 0))
      .slice(0, 6);
  }, [topProducts]);

  // Ensure bar chart shows all categories even if 0
  const completeCategoryData = useMemo(() => {
    const BASE = ['pork', 'beef', 'chicken', 'sliced', 'processed', 'seafood'];
    const qtyByCat = new Map((categorySalesData || []).map(i => [i.category, i.quantitySold || 0]));
    const colorByCat = new Map((categorySalesData || []).map(i => [i.category, i.color]));
    return BASE.map(cat => ({
      category: cat,
      quantitySold: qtyByCat.get(cat) || 0,
      color: colorByCat.get(cat)
    }));
  }, [categorySalesData]);

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
    const pad = (n) => String(n).padStart(2, '0');
    const buildRange = () => {
      // All years -> from 2021-01-01 to current-12-31
      if (selectedYear === -1) {
        const start = `2021-01-01`;
        const end = `${currentYear}-12-31`;
        return { start, end };
      }
      // Specific year, All months
      if (selectedMonth === -1) {
        const start = `${selectedYear}-01-01`;
        const end = `${selectedYear}-12-31`;
        return { start, end };
      }
      // Specific month of specific year
      const start = `${selectedYear}-${pad(selectedMonth + 1)}-01`;
      const endDate = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const end = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(endDate)}`;
      return { start, end };
    };

    const fetchAnalyticsData = async () => {
      try {
        const { start, end } = buildRange();
        const params = new URLSearchParams({ source: dataSource, timeframe: 'custom', start, end });
        const response = await axios.get(`${API_URL}/analytics/by-source?${params.toString()}`);
        setAnalyticsData(response.data.analyticsData);
        setDailySalesData(response.data.dailySalesData);
        // Fetch total customers with completed orders (not filtered by date range)
        try {
          const custRes = await axios.get(`${API_URL}/orders/distinct-customers?status=completed`);
          if (typeof custRes.data?.count === 'number') {
            setAnalyticsData((prev) => ({ ...prev, users: custRes.data.count }));
          }
        } catch (_) {
          // ignore customer count error to avoid blocking UI
        }
        
        // Note: topProducts data is fetched separately in another useEffect
        // Category sales data will be processed when topProducts state updates
      } catch (error) {
        // Error fetching analytics data
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dataSource, selectedYear, selectedMonth]);

  // Process category sales data when topProducts changes
  useEffect(() => {
    if (topProducts && topProducts.length > 0) {
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
    } else {
      setCategorySalesData([]);
    }
  }, [topProducts]);

  // Fetch customer analytics data
  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        const response = await axios.get(`${API_URL}/analytics/customers?timeframe=${timeframe}&source=${dataSource}`);
        setCustomerData(response.data.customerData || []);
        setRatingDistribution(response.data.ratingDistribution || {});
      } catch (error) {
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
      <div className='py-6 sm:py-8'>
        <div className='relative z-10 container mx-auto px-3 sm:px-4 md:px-6'>
          <div className='text-center text-[#030105] text-base sm:text-lg'>
            Loading analytics data...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className='py-3 sm:py-4'>
        <div className='relative z-10 container mx-auto px-3 sm:px-4 md:px-6 bg-[#f8f3ed] min-h-screen'>
        
        {/* Dashboard Header */}
        <div className='mb-6 sm:mb-8'>
          <div className='bg-white rounded-lg shadow-lg border border-gray-300 p-4 sm:p-5 md:p-6'>
            <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4'>
              <div>
                <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre mb-1 sm:mb-2'>
                  Welcome back, {user?.name || 'Admin'}
                </h1>
                <p className='text-xs sm:text-sm text-gray-600 font-alice'>
                  Here's what's happening with your business today
                </p>
              </div>
              <div className='text-xs sm:text-sm text-gray-500 font-alice'>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        <div className='mb-4 sm:mb-6'>
          <div className='flex flex-col lg:flex-row gap-3 sm:gap-4 items-start lg:items-center lg:justify-between'>
            {/* First Column: Data Source (Left aligned) */}
            <div className='w-full lg:w-auto'>
              <div className='flex flex-wrap gap-2 items-center bg-[#f8f3ed] p-1 rounded-lg'>
                <span className='text-xs sm:text-sm font-medium text-[#030105] mr-1 sm:mr-2 font-alice whitespace-nowrap'>Category:</span>
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
                    } px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 font-alice whitespace-nowrap`}
                  >
                    {option.label}
            </button>
                ))}
              </div>
            </div>

            {/* Second Column: Timeframe Selection (Right aligned) */}
            <div className='w-full lg:w-auto'>
              <div className='flex flex-wrap gap-2 items-center'>
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
                } px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 font-alice whitespace-nowrap`}
              >
                {option.label}
              </button>
            ))}
              </div>
            {timeframe === 'custom' && (
                <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-2'>
                <div className='flex gap-2'>
                  <button onClick={()=>setCustomMode('date')} className={`px-2 sm:px-2.5 py-1 rounded-md text-xs sm:text-sm font-alice whitespace-nowrap ${customMode==='date' ? 'bg-[#860809] text-white' : 'bg-[#f8f3ed] text-[#030105]'}`}>Select Date</button>
                  <button onClick={()=>setCustomMode('range')} className={`px-2 sm:px-2.5 py-1 rounded-md text-xs sm:text-sm font-alice whitespace-nowrap ${customMode==='range' ? 'bg-[#860809] text-white' : 'bg-[#f8f3ed] text-[#030105]'}`}>Range</button>
                </div>
                {customMode === 'date' && (
                  <div className='flex items-center gap-2 w-full sm:w-auto'>
                    <input
                      type='date'
                      value={selectedDate}
                      onChange={(e)=>{ setSelectedDate(e.target.value); }}
                      className='flex-1 sm:flex-none px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    />
                    {selectedDate && (
                      <button onClick={()=>setSelectedDate('')} className='px-2 py-1 rounded-md text-xs sm:text-sm bg-[#f8f3ed] text-[#030105] font-alice whitespace-nowrap'>Clear</button>
                    )}
                  </div>
                )}
                {customMode === 'range' && (
                  <div className='flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto'>
                    <input
                      type='date'
                      value={rangeStart}
                      onChange={(e)=>{ setRangeStart(e.target.value); }}
                      className='w-full sm:w-auto px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    />
                    <span className='text-[#030105] text-xs sm:text-sm font-alice'>to</span>
                    <input
                      type='date'
                      value={rangeEnd}
                      onChange={(e)=>{ setRangeEnd(e.target.value); }}
                      className='w-full sm:w-auto px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    />
                    {(rangeStart || rangeEnd) && (
                      <button onClick={()=>{ setRangeStart(''); setRangeEnd(''); }} className='px-2 py-1 rounded-md text-xs sm:text-sm bg-[#f8f3ed] text-[#030105] font-alice whitespace-nowrap'>Clear</button>
                    )}
                  </div>
                )}
              </div>
            )}
        </div>
          </div>
        </div>
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6'>
          <div>
            <AnalyticsCard
              title='Total Customers'
              value={analyticsData.users?.toLocaleString?.() || Number(analyticsData.users || 0).toLocaleString()}
              icon={Users}
              color='from-[#860809] to-[#a31f17]'
            />
          </div>
          <div>
            <AnalyticsCard
              title='New Orders'
              value={newOrders.toLocaleString()}
              icon={Package}
              color='from-[#860809] to-[#a31f17]'
            />
          </div>
          <div>
            <AnalyticsCard
              title='Total Sales'
              value={totalSalesQty.toLocaleString()}
              icon={ShoppingCart}
              color='from-[#860809] to-[#a31f17]'
            />
          </div>
          <div>
            <AnalyticsCard
              title='Total Revenue'
              value={`₱${timeframeRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              icon={PhilippinePeso}
              color='from-[#860809] to-[#a31f17]'
            />
          </div>
        </div>

        {/* Sales & Revenue Line Chart moved here (was the Category Sales Bar Chart section) */}
        <div className='mb-4 sm:mb-6'>
          <motion.div
            className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 overflow-hidden'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <div className='px-4 sm:px-5 md:px-6 py-3 sm:py-4 border-b border-gray-300'>
              <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 sm:gap-3'>
                <h2 className='text-lg sm:text-xl md:text-2xl font-bold text-[#860809] font-libre'>
                {dataSource === 'orders' ? 'Online Orders Sales & Revenue Trends' : 
                 dataSource === 'pos' ? 'POS Sales & Revenue Trends' : 
                 'Sales & Revenue Trends'}
                </h2>
                <div className='flex flex-wrap items-center gap-2'>
                  {selectedYear === -1 ? (
                    <select disabled className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice opacity-60 cursor-not-allowed text-xs sm:text-sm'>
                      <option value=''>—</option>
                    </select>
                  ) : (
                    <select
                      value={selectedMonth}
                      onChange={(e)=>setSelectedMonth(Number(e.target.value))}
                      className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    >
                      <option value={-1}>All</option>
                      {MONTHS.map((m, idx) => (
                        <option key={m} value={idx}>{m}</option>
                      ))}
                    </select>
                  )}
                  <select
                    value={selectedYear}
                    onChange={(e)=>setSelectedYear(Number(e.target.value))}
                    className='px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                  >
                    <option value={-1}>All</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className='text-[#a31f17] opacity-80 mt-1 sm:mt-2 font-alice text-xs sm:text-sm'>Daily sales and revenue performance</p>
            </div>
            <div className='p-3 sm:p-4'>
              <div className='flex flex-col lg:flex-row gap-4 sm:gap-6'>
                {/* Sales Line Chart */}
                <div className='w-full lg:basis-1/2'>
                  <h4 className='text-center text-[#860809] font-libre font-semibold mb-2 text-sm sm:text-base'>Sales</h4>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={processedDailyData} margin={{ top: 20, right: 20, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.2} />
                      <XAxis dataKey='day' stroke='#030105' />
                      <YAxis stroke='#030105' />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fffefc',
                          border: '1px solid #f8f3ed',
                          borderRadius: '8px',
                          color: '#030105'
                        }}
                      />
                      <Line
                        type='monotone'
                        dataKey='sales'
                        stroke='#22c55e'
                        strokeWidth={3}
                        activeDot={{ r: 6, fill: '#16a34a' }}
                        name='Sales'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Revenue Line Chart */}
                <div className='w-full lg:basis-1/2'>
                  <h4 className='text-center text-[#860809] font-libre font-semibold mb-2 text-sm sm:text-base'>Revenue</h4>
                  <ResponsiveContainer width='100%' height={300}>
                    <LineChart data={processedDailyData} margin={{ top: 20, right: 40, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.2} />
                      <XAxis dataKey='day' stroke='#030105' />
                      <YAxis 
                        stroke='#030105' 
                        tickFormatter={(value) => `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
                        width={80}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: '#fffefc',
                          border: '1px solid #f8f3ed',
                          borderRadius: '8px',
                          color: '#030105'
                        }}
                        formatter={(value, name) => [
                          `₱${value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          name
                        ]}
                      />
                      <Line
                        type='monotone'
                        dataKey='revenue'
                        stroke='#3b82f6'
                        strokeWidth={3}
                        activeDot={{ r: 6, fill: '#2563eb' }}
                        name='Revenue'
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Charts Section - Two Columns */}
        <motion.div
          className= 'mb-4 sm:mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          
          <div className='flex flex-col md:flex-row lg:flex-row gap-4 sm:gap-6'>
            {/* Column 1 - Category Sales Bar Chart (50%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-3 sm:pt-4 w-full md:basis-1/2 lg:basis-[40%]'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-3 sm:mb-4 font-libre text-center'>
                Category Sales Trends
              </h3>
              <ResponsiveContainer width='100%' height={300}>
                <BarChart data={completeCategoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.2} />
                  <XAxis 
                    dataKey='category' 
                    stroke='#030105' 
                    angle={-45}
                    textAnchor='end'
                    height={80}
                    fontSize={12}
                  />
                  <YAxis stroke='#030105' />
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
                    {completeCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || '#860809'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Column 2 - Simplified Top Products (25%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-3 sm:pt-4 w-full md:basis-1/4 lg:basis-[30%]'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-1 font-libre text-left px-4 sm:px-5'>
                Top Products
              </h3>
              <div className='px-4 sm:px-5 pb-3 sm:pb-4'>
                <div className='flex justify-between text-xs font-semibold text-[#a31f17] uppercase tracking-wide mb-2 font-alice'>
                  <span>Products</span>
                  <span>Orders</span>
                </div>
                <ul className='space-y-2'>
                  {simpleTopProducts.length > 0 ? (
                    simpleTopProducts.map((p) => (
                      <li key={p.productId} className='flex items-center justify-between text-[#030105] text-xs sm:text-sm font-alice'>
                        <span className='truncate pr-3 sm:pr-5'>{p.productName}</span>
                        <span className='tabular-nums'>{p.quantitySold}</span>
                      </li>
                    ))
                  ) : (
                    [
                      { productName: 'No data', quantitySold: 0 }
                    ].map((p, i) => (
                      <li key={i} className='flex items-center justify-between text-[#030105] text-xs sm:text-sm font-alice'>
                        <span className='truncate pr-3 sm:pr-5'>{p.productName}</span>
                        <span className='tabular-nums'>{p.quantitySold}</span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>

            {/* Column 3 - Inventory Status (25%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-3 sm:pt-4 w-full md:basis-1/4 lg:basis-[30%]'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-1 font-libre text-left px-4 sm:px-5'>
                Inventory Status
              </h3>
              <div className='px-4 sm:px-5 pb-3 sm:pb-4'>
                <div className='flex items-center justify-between mb-2'>
                  <span className='text-xs font-semibold text-[#a31f17] uppercase tracking-wide font-alice'>Ingredient</span>
                  <span className='text-xs font-semibold text-[#a31f17] uppercase tracking-wide font-alice'>Status</span>
                </div>
                <div className='mb-3'>
                  <select
                    value={inventoryStatusCategory}
                    onChange={(e)=>setInventoryStatusCategory(e.target.value)}
                    className='w-full px-2 py-1 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                  >
                    <option value='All'>All Categories</option>
                    {productCategories.map((c)=> (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <ul className='space-y-2 max-h-64 overflow-y-auto pr-1'>
                  {(inventoryShowAll ? inventoryStatusItems : inventoryStatusItems.slice(0, 10)).map((row) => (
                    <li key={row.id} className='flex items-center justify-between text-[#030105] text-xs sm:text-sm font-alice'>
                      <span className='truncate pr-3 sm:pr-4'>{row.name}</span>
                      <span className='flex items-center gap-1.5 sm:gap-2 whitespace-nowrap'>
                        <span className='inline-block h-2.5 w-2.5 rounded-full' style={{ backgroundColor: row.color }} />
                        {row.status}
                      </span>
                    </li>
                  ))}
                </ul>
                {inventoryStatusItems.length > 10 && (
                  <div className='mt-3'>
                    <button
                      type='button'
                      onClick={()=>setInventoryShowAll((v)=>!v)}
                      className='px-2.5 sm:px-3 py-1 rounded-md text-xs sm:text-sm border border-gray-300 text-[#030105] bg-[#f8f3ed] hover:bg-[#efe8de] font-alice'
                    >
                      {inventoryShowAll ? 'Show Less' : `Show All (${inventoryStatusItems.length - 10} more)`}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Customer Section */}
        <motion.div
          className='mb-4 sm:mb-6'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          
          <div className='flex flex-col md:flex-row lg:flex-row gap-4 sm:gap-6'>
            {/* First Column - Customer Table (60%) */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-3 sm:pt-4 w-full md:w-3/5 lg:w-3/5'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre text-center'>
                Top Customers
              </h3>
              <p className='text-xs text-gray-600 text-center mb-3 sm:mb-4 font-alice'>
                All customers (not filtered by timeframe)
              </p>
              <div className='overflow-x-auto'>
                <table className='w-full min-w-[500px]'>
                  <thead>
                    <tr className='border-b border-gray-200'>
                      <th className='text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Customer Name</th>
                      <th className='text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Email</th>
                      <th className='text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Orders</th>
                      <th className='text-center py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCustomers.length > 0 ? (
                      currentCustomers.map((customer, index) => (
                        <tr key={customer._id} className='border-b border-gray-100 hover:bg-gray-50'>
                          <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#030105] font-alice'>{customer.customerName}</td>
                          <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#030105] font-alice'>{customer.customerEmail}</td>
                          <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center text-[#030105] font-alice'>{customer.totalOrders}</td>
                          <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-center text-[#030105] font-alice'>
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
                        <td colSpan="4" className='py-6 sm:py-8 text-center text-gray-500 font-alice text-xs sm:text-sm'>
                          No customer data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {customerTotalPages > 1 && (
                <div className='flex flex-col sm:flex-row items-center justify-between mt-3 sm:mt-4 px-3 sm:px-4 gap-2 sm:gap-0'>
                  <div className='text-xs sm:text-sm text-gray-600 font-alice'>
                    Showing {customerStartIndex + 1} to {Math.min(customerEndIndex, customerData.length)} of {customerData.length} customers
                  </div>
                  <div className='flex items-center space-x-2'>
                    <button
                      onClick={() => setCustomerCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={customerCurrentPage === 1}
                      className='px-2.5 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-alice'
                    >
                      Previous
                    </button>
                    <span className='text-xs sm:text-sm text-gray-600 font-alice'>
                      Page {customerCurrentPage} of {customerTotalPages}
                    </span>
                    <button
                      onClick={() => setCustomerCurrentPage(prev => Math.min(prev + 1, customerTotalPages))}
                      disabled={customerCurrentPage === customerTotalPages}
                      className='px-2.5 sm:px-3 py-1 text-xs sm:text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed font-alice'
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {/* Last Updated Timestamp - Bottom of first column */}
              <div className='text-center mt-3 sm:mt-4'>
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
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 pt-3 sm:pt-4 w-full md:w-2/5 lg:w-2/5'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre text-center'>
                Rating Distribution
              </h3>
              <p className='text-xs text-gray-600 text-center mb-3 sm:mb-4 font-alice'>
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
                <div className='flex items-center justify-center h-[300px] text-gray-500 font-alice text-xs sm:text-sm'>
                  No rating data available
                </div>
              )}
                          {/* Last Updated Timestamp - Bottom of first column */}
            <div className='text-center mt-3 sm:mt-4'>
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

      </div>
    </div>
    </AdminLayout>
  );
};

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <motion.div
            className={`bg-[#fffefc] rounded-lg p-3 sm:p-4 shadow-lg overflow-hidden relative border border-gray-300`}
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
  >
    <div className='flex justify-between items-center'>
      <div className='z-10'>
        <p className='text-[#a31f17] text-xs sm:text-sm mb-1 font-semibold opacity-80 font-alice'>{title}</p>
        <h3 className='text-[#030105] text-xl sm:text-2xl md:text-3xl font-bold font-libre'>{value}</h3>
      </div>
    </div>
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10`} />
    <div className='absolute -bottom-2 -right-2 text-[#860809] opacity-30'>
      <Icon className='h-14 w-14 sm:h-16 sm:w-16 md:h-20 md:w-20' />
    </div>
  </motion.div>
);

export default DashboardPage;