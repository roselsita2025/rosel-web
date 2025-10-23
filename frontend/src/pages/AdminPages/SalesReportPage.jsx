import { useState, useMemo, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout.jsx';
import { ShoppingCart, PhilippinePeso, DollarSign, TrendingUp, Ticket, AlertTriangle } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { exportToCSV, exportToPDF } from '../../utils/reportExport.js';

const MONTHS = [
  'January','February','March','April','May','June','July','August','September','October','November','December'
];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: currentYear - 2021 + 1 }, (_, i) => 2021 + i);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
axios.defaults.withCredentials = true;

const SalesReportPage = () => {
  // Section 1: filters
  const [dataSource, setDataSource] = useState('combined'); // 'orders' | 'pos' | 'combined'
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedWeek, setSelectedWeek] = useState(-1); // -1 = All Time, 1..4 = week buckets

  // When year is All Time, force month to All Time and disable month select
  useEffect(() => {
    if (selectedYear === -1) {
      if (selectedMonth !== -1) setSelectedMonth(-1);
      if (selectedWeek !== -1) setSelectedWeek(-1);
    }
  }, [selectedYear]);

  useEffect(() => {
    if (selectedMonth === -1 && selectedWeek !== -1) {
      setSelectedWeek(-1);
    }
  }, [selectedMonth]);

  // Reset showAllProducts when filters change
  useEffect(() => {
    setShowAllProducts(false);
  }, [dataSource, selectedYear, selectedMonth, selectedWeek]);

  // Build labels based on Month/Year selection
  const labels = useMemo(() => {
    const startYear = 2021;
    const endYear = currentYear;
    if (selectedYear === -1) {
      // All years
      return Array.from({ length: endYear - startYear + 1 }, (_, i) => String(startYear + i));
    }
    if (selectedMonth === -1) {
      // All months in selected year → 1..12
      return Array.from({ length: 12 }, (_, i) => String(i + 1));
    }
    // Specific month → 1..daysInMonth
    const year = selectedYear;
    const monthIndex = selectedMonth; // 0-based
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    if (selectedWeek !== -1) {
      const startDay = (selectedWeek - 1) * 7 + 1; // 1, 8, 15, 22
      const endDay = selectedWeek === 4 ? daysInMonth : Math.min(selectedWeek * 7, daysInMonth);
      const len = Math.max(0, endDay - startDay + 1);
      return Array.from({ length: len }, (_, i) => String(startDay + i));
    }
    return Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  }, [selectedYear, selectedMonth, selectedWeek]);

  // Raw from backend
  const [dailySalesData, setDailySalesData] = useState([]); // [{ date: YYYY-MM-DD, sales, revenue }]
  const [previousYearData, setPreviousYearData] = useState([]); // Previous year data for target lines
  const [topProducts, setTopProducts] = useState([]);
  const [showAllProducts, setShowAllProducts] = useState(false);
  const [revenueSum, setRevenueSum] = useState(0);
  const [salesCount, setSalesCount] = useState(0);
  const [couponsTable, setCouponsTable] = useState([]);
  const [discountsUsedSum, setDiscountsUsedSum] = useState(0);
  const [discrepancyTrends, setDiscrepancyTrends] = useState([]);
  const [discrepancyCostImpact, setDiscrepancyCostImpact] = useState(0);

  // Modal states
  const [showDateModal, setShowDateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [reportDateRange, setReportDateRange] = useState({ start: '', end: '' });
  const [isExporting, setIsExporting] = useState(false);
  
  // Report filter states (separate from main page filters)
  const [reportYear, setReportYear] = useState(currentYear);
  const [reportMonth, setReportMonth] = useState(new Date().getMonth());
  const [reportWeek, setReportWeek] = useState(-1);
  const [isLoadingReportData, setIsLoadingReportData] = useState(false);
  const [waitingForExport, setWaitingForExport] = useState(false);

  // Product markup from env (prefer Vite-exposed var), default 0.10
  const PRODUCT_MARKUP = useMemo(() => {
    const raw = import.meta.env.VITE_PRODUCT_MARKUP ?? import.meta.env.PRODUCT_MARKUP;
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0.10;
  }, []);

  // Aggregate backend dailySalesData into current labels (year/month/day)
  const dailyData = useMemo(() => {
    // Determine grouping mode
    const mode = selectedYear === -1 ? 'year' : (selectedMonth === -1 ? 'month' : 'day');
    
    // Aggregate current year data
    const sumByKey = new Map();
    for (const row of dailySalesData || []) {
      // Parse date as YYYY-MM-DD (backend format)
      const parts = row.date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      let key = '';
      if (mode === 'year') key = String(year);
      else if (mode === 'month') key = String(month);
      else key = String(day);
      const prev = sumByKey.get(key) || { sales: 0, revenue: 0 };
      sumByKey.set(key, { sales: prev.sales + (row.sales || 0), revenue: prev.revenue + (row.revenue || 0) });
    }
    
    // Aggregate previous year data for targets
    const targetByKey = new Map();
    for (const row of previousYearData || []) {
      // Parse date as YYYY-MM-DD (backend format)
      const parts = row.date.split('-');
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]);
      const day = parseInt(parts[2]);
      
      let key = '';
      if (mode === 'year') {
        // For year mode, the key should be the NEXT year (since this is previous year data)
        // e.g., if previousYearData has 2021 data, it becomes the target for 2022
        key = String(year + 1);
      } else if (mode === 'month') {
        key = String(month);
      } else {
        key = String(day);
      }
      const prev = targetByKey.get(key) || { sales: 0, revenue: 0 };
      targetByKey.set(key, { sales: prev.sales + (row.sales || 0), revenue: prev.revenue + (row.revenue || 0) });
    }
    
    return labels.map((label) => {
      const agg = sumByKey.get(String(label)) || { sales: 0, revenue: 0 };
      const target = targetByKey.get(String(label)) || { sales: 0, revenue: 0 };
      return {
        date: label,
        targetSales: target.sales,
        actualSales: agg.sales,
        targetRevenue: target.revenue,
        actualRevenue: agg.revenue,
      };
    });
  }, [labels, dailySalesData, previousYearData, selectedYear, selectedMonth]);

  // Swapped: Use Profit series in the composed chart (Profit = Revenue * PRODUCT_MARKUP)
  const profitComposedData = useMemo(() => {
    return dailyData.map((d) => ({
      date: d.date,
      targetProfit: d.targetRevenue * PRODUCT_MARKUP,
      actualProfit: d.actualRevenue * PRODUCT_MARKUP,
    }));
  }, [dailyData, PRODUCT_MARKUP]);

  // Swapped: Revenue (positive/up) vs Cost (negative/down) dataset
  const revenueCostData = useMemo(() => {
    return dailyData.map((d) => ({
      date: d.date,
      revenue: d.actualRevenue,
      revenueTarget: d.targetRevenue,
      cost: d.actualRevenue - (d.actualRevenue * PRODUCT_MARKUP) // Cost = Revenue - Profit
    }));
  }, [dailyData, PRODUCT_MARKUP]);

  // Payment gateway by label (Cash, Bank, Online) aggregated from POS transactions and online orders
  const [posTxns, setPosTxns] = useState([]);
  const [onlineOrders, setOnlineOrders] = useState([]);
  const paymentGatewayData = useMemo(() => {
    const mode = selectedYear === -1 ? 'year' : (selectedMonth === -1 ? 'month' : 'day');
    const mapByKey = new Map();
    
    // Process POS transactions
    for (const t of posTxns) {
      const d = new Date(t.createdAt || t.timestamp);
      let key = '';
      if (mode === 'year') key = String(d.getFullYear());
      else if (mode === 'month') key = String(d.getMonth() + 1);
      else key = String(d.getDate());
      const prev = mapByKey.get(key) || { cash: 0, bank: 0, online: 0 };
      const method = (t.payment?.method || '').toLowerCase();
      const amount = Number(t.payment?.productSubtotal || 0) - Number(t.payment?.discount || 0); // Net amount after discount
      
      if (method === 'cash') {
        prev.cash += amount;
      } else if (method === 'bank transfer' || method === 'bank') {
        prev.bank += amount;
      } else if (method === 'online payment' || method === 'online') {
        prev.online += amount;
      } else {
      }
      mapByKey.set(key, prev);
    }
    
    // Process online orders (all go to Bank)
    for (const order of onlineOrders) {
      const d = new Date(order.createdAt || order.created);
      let key = '';
      if (mode === 'year') key = String(d.getFullYear());
      else if (mode === 'month') key = String(d.getMonth() + 1);
      else key = String(d.getDate());
      const prev = mapByKey.get(key) || { cash: 0, bank: 0, online: 0 };
      const amount = Number(order.totalAmount || 0); // Online orders total amount is already net
      prev.bank += amount;
      mapByKey.set(key, prev);
    }
    
    return labels.map((label) => ({ day: label, ...(mapByKey.get(String(label)) || { cash: 0, bank: 0, online: 0 }) }));
  }, [labels, posTxns, onlineOrders, selectedYear, selectedMonth]);

  // Coupons/Discounts data combining online orders coupons and POS discounts
  const couponsDiscounts = useMemo(() => {
    const discountsList = [];
    
    // Add online orders with coupons
    for (const order of onlineOrders) {
      if (order.coupon && order.coupon.discount > 0) {
        discountsList.push({
          code: order.coupon.code || 'N/A',
          date: new Date(order.createdAt || order.created),
          amount: order.coupon.discount
        });
      }
    }
    
    // Add POS transactions with discounts
    for (const txn of posTxns) {
      if (txn.payment?.discount && txn.payment.discount > 0) {
        discountsList.push({
          code: 'POS',
          date: new Date(txn.timestamp || txn.createdAt),
          amount: txn.payment.discount
        });
      }
    }
    
    // Sort by date descending (most recent first)
    return discountsList.sort((a, b) => b.date - a.date);
  }, [onlineOrders, posTxns]);

  // Format discrepancy trends to match labels (same as other charts)
  const formattedDiscrepancyTrends = useMemo(() => {
    const mode = selectedYear === -1 ? 'year' : (selectedMonth === -1 ? 'month' : 'day');
    const quantityByKey = new Map();
    const costByKey = new Map();
    
    // Aggregate discrepancy data by date
    for (const item of discrepancyTrends || []) {
      const d = new Date(item.date);
      let key = '';
      if (mode === 'year') key = String(d.getFullYear());
      else if (mode === 'month') key = String(d.getMonth() + 1);
      else key = String(d.getDate());
      const prevQuantity = quantityByKey.get(key) || 0;
      const prevCost = costByKey.get(key) || 0;
      quantityByKey.set(key, prevQuantity + (item.quantity || 0));
      costByKey.set(key, prevCost + (item.cost || 0));
    }
    
    // Map to labels to ensure all dates are shown
    return labels.map((label) => ({
      date: label,
      quantity: quantityByKey.get(String(label)) || 0,
      cost: costByKey.get(String(label)) || 0
    }));
  }, [labels, discrepancyTrends, selectedYear, selectedMonth]);

  // Derived cards: Cost and Profit based on revenue and product markup
  const costDerived = useMemo(() => {
    const rev = Number(revenueSum) || 0;
    return rev - rev * PRODUCT_MARKUP;
  }, [revenueSum, PRODUCT_MARKUP]);

  const profitDerived = useMemo(() => {
    const rev = Number(revenueSum) || 0;
    return rev * PRODUCT_MARKUP;
  }, [revenueSum, PRODUCT_MARKUP]);

  // Export handlers
  const handleCSVExport = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        salesCount,
        revenueSum,
        costDerived,
        profitDerived,
        discountsUsedSum,
        discrepancyCostImpact,
        dailyData,
        topProducts,
        paymentGatewayData,
        couponsDiscounts,
        discrepancyTrends: formattedDiscrepancyTrends
      };

      const result = await exportToCSV(exportData, reportDateRange, dataSource);
      
      if (result.success) {
        alert(`✅ CSV Report exported successfully!\n\nFile: ${result.fileName}`);
      } else {
        alert(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  const handlePDFExport = async () => {
    setIsExporting(true);
    try {
      // Capture chart images
      const chartImages = {};
      const chartIds = [
        'sales-forecast-chart',
        'profit-forecast-chart',
        'revenue-forecast-chart',
        'payment-gateway-chart',
        'discrepancy-trends-chart'
      ];

      for (const id of chartIds) {
        const element = document.getElementById(id);
        if (element) {
          const html2canvas = (await import('html2canvas')).default;
          const canvas = await html2canvas(element, {
            backgroundColor: '#fffefc',
            scale: 2
          });
          chartImages[id] = canvas.toDataURL('image/png');
        }
      }

      const exportData = {
        salesCount,
        revenueSum,
        costDerived,
        profitDerived,
        discountsUsedSum,
        discrepancyCostImpact,
        dailyData,
        topProducts,
        paymentGatewayData,
        couponsDiscounts,
        discrepancyTrends: formattedDiscrepancyTrends,
        PRODUCT_MARKUP,
        chartImages
      };

      const result = await exportToPDF(exportData, reportDateRange, dataSource);
      
      if (result.success) {
        alert(`✅ PDF Report generated successfully!\n\nFile: ${result.fileName}`);
      } else {
        alert(`❌ Export failed: ${result.error}`);
      }
    } catch (error) {
      alert(`❌ Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
      setShowExportModal(false);
    }
  };

  // Build date range for API calls based on Year/Month/Week
  const buildRange = useMemo(() => {
    const pad = (n) => String(n).padStart(2, '0');
    return () => {
      if (selectedYear === -1) {
        return { start: `2021-01-01`, end: `${currentYear}-12-31` };
      }
      if (selectedMonth === -1) {
        return { start: `${selectedYear}-01-01`, end: `${selectedYear}-12-31` };
      }
      const startDay = selectedWeek !== -1 ? Math.min((selectedWeek - 1) * 7 + 1, 28) : 1;
      const lastDayOfMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const endDay = selectedWeek !== -1 ? Math.min(selectedWeek === 4 ? lastDayOfMonth : selectedWeek * 7, lastDayOfMonth) : lastDayOfMonth;
      const start = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(startDay)}`;
      const end = `${selectedYear}-${pad(selectedMonth + 1)}-${pad(endDay)}`;
      return { start, end };
    };
  }, [selectedYear, selectedMonth, selectedWeek]);

  // Build date range for report generation based on report filters
  const buildReportRange = (year, month, week) => {
    const pad = (n) => String(n).padStart(2, '0');
    
    if (year === -1) {
      return { start: `2021-01-01`, end: `${currentYear}-12-31` };
    }
    if (month === -1) {
      return { start: `${year}-01-01`, end: `${year}-12-31` };
    }
    const startDay = week !== -1 ? Math.min((week - 1) * 7 + 1, 28) : 1;
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const endDay = week !== -1 ? Math.min(week === 4 ? lastDayOfMonth : week * 7, lastDayOfMonth) : lastDayOfMonth;
    const start = `${year}-${pad(month + 1)}-${pad(startDay)}`;
    const end = `${year}-${pad(month + 1)}-${pad(endDay)}`;
    return { start, end };
  };

  // Fetch data on filter change
  useEffect(() => {
    const { start, end } = buildRange();
    const params = { source: dataSource, timeframe: 'custom', start, end };

    const fetchBySource = async () => {
      try {
        const res = await axios.get(`${API_URL}/analytics/by-source`, { params });
        setDailySalesData(res.data?.dailySalesData || []);
        // Do NOT set card totals here to avoid overriding date-filtered values
      } catch (_) { setDailySalesData([]); }
    };

    const fetchPreviousYearData = async () => {
      try {
        // Calculate previous year date range
        let prevStart, prevEnd;
        
        if (selectedYear === -1) {
          // All time: get data from 2020-2024 (one year before 2021-2025)
          prevStart = '2020-01-01';
          prevEnd = `${currentYear - 1}-12-31`;
        } else if (selectedMonth === -1) {
          // All months: get previous year
          prevStart = `${selectedYear - 1}-01-01`;
          prevEnd = `${selectedYear - 1}-12-31`;
        } else {
          // Specific month/week: get same period from previous year
          const pad = (n) => String(n).padStart(2, '0');
          const startDay = selectedWeek !== -1 ? Math.min((selectedWeek - 1) * 7 + 1, 28) : 1;
          const lastDayOfMonth = new Date(selectedYear - 1, selectedMonth + 1, 0).getDate();
          const endDay = selectedWeek !== -1 ? Math.min(selectedWeek === 4 ? lastDayOfMonth : selectedWeek * 7, lastDayOfMonth) : lastDayOfMonth;
          prevStart = `${selectedYear - 1}-${pad(selectedMonth + 1)}-${pad(startDay)}`;
          prevEnd = `${selectedYear - 1}-${pad(selectedMonth + 1)}-${pad(endDay)}`;
        }
        
        const prevParams = { source: dataSource, timeframe: 'custom', start: prevStart, end: prevEnd };
        const res = await axios.get(`${API_URL}/analytics/by-source`, { params: prevParams });
        setPreviousYearData(res.data?.dailySalesData || []);
      } catch (_) { 
        setPreviousYearData([]); 
      }
    };

    const fetchTopProducts = async () => {
      try {
        const r = await axios.get(`${API_URL}/analytics/top-products-by-source`, { params: { ...params, limit: 10 } });
        const products = r.data?.products || [];
        // Sort by revenue in descending order (highest to lowest)
        const sortedProducts = products.sort((a, b) => {
          const revenueA = Number(a.revenue || 0);
          const revenueB = Number(b.revenue || 0);
          return revenueB - revenueA;
        });
        setTopProducts(sortedProducts);
      } catch (_) { setTopProducts([]); }
    };

    const fetchRevenueBySource = async () => {
      try {
        const r = await axios.get(`${API_URL}/analytics/revenue-by-source`, { params });
        setRevenueSum(r.data?.revenue || 0);
      } catch (_) {}
    };

    const fetchTotalSalesBySource = async () => {
      try {
        const r = await axios.get(`${API_URL}/analytics/total-sales-by-source`, { params });
        setSalesCount(r.data?.totalSalesQuantity || 0);
      } catch (_) {}
    };

    const fetchPosTxns = async () => {
      try {
        // Only fetch POS transactions if dataSource includes 'pos' or 'combined'
        if (dataSource === 'orders') {
          setPosTxns([]);
          return;
        }
        
        // Fetch all POS transactions (backend date filtering not working)
        const r = await axios.get(`${API_URL}/pos/transactions`, { params: { timeframe: 'all', limit: 100000 } });
        const allTxns = r.data?.data || [];
        
        // Filter by date range on frontend
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        const filteredTxns = allTxns.filter(txn => {
          const txnDate = new Date(txn.timestamp || txn.createdAt);
          return txnDate >= startDate && txnDate <= endDate;
        });
        
        setPosTxns(filteredTxns);
      } catch (error) { 
        console.error('Error fetching POS transactions:', error);
        setPosTxns([]); 
      }
    };

    const fetchOnlineOrders = async () => {
      try {
        // Only fetch online orders if dataSource includes 'orders' or 'combined'
        if (dataSource === 'pos') {
          setOnlineOrders([]);
          return;
        }
        
        const r = await axios.get(`${API_URL}/admin/orders`, { 
          params: { 
            timeframe: 'all',
            limit: 100000
          } 
        });
        const allOrders = r.data?.data?.orders || [];
        
        // Filter by date range on frontend
        const startDate = new Date(start);
        const endDate = new Date(end);
        endDate.setHours(23, 59, 59, 999);
        
        const filteredOrders = allOrders.filter(order => {
          const orderDate = new Date(order.createdAt || order.created);
          return orderDate >= startDate && orderDate <= endDate;
        });
        
        setOnlineOrders(filteredOrders);
      } catch (_) { 
        setOnlineOrders([]); 
      }
    };

    const fetchDiscountsUsed = async () => {
      try {
        let totalDiscounts = 0;
        
        // Use all-time data when "All Time" is selected, otherwise use filtered data
        const useAllTime = selectedYear === -1 || (selectedYear !== -1 && selectedMonth === -1);
        
        if (dataSource !== 'pos') {
          // Always fetch all orders since backend date filtering is not working
          const allTimeOrders = await axios.get(`${API_URL}/admin/orders`, { 
            params: { 
              timeframe: 'all', 
              limit: 100000
            } 
          });
          const allOrders = allTimeOrders.data?.data?.orders || [];
          
          // Filter orders on frontend based on date range
          let orders = allOrders;
          if (!useAllTime) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            
            orders = allOrders.filter(order => {
              const orderDate = new Date(order.createdAt || order.created || order._id);
              return orderDate >= startDate && orderDate <= endDate;
            });
          }
          
          const ordersDiscount = orders.reduce((sum, order) => {
            let discount = 0;
            if (order.coupon && typeof order.coupon.discount === 'number') {
              discount = order.coupon.discount;
            }
            return sum + discount;
          }, 0);
          
          totalDiscounts += ordersDiscount;
        }
        
        if (dataSource !== 'orders') {
          // Always fetch all POS transactions since backend date filtering is not working
          const allTimePos = await axios.get(`${API_URL}/pos/transactions`, { 
            params: { 
              timeframe: 'all', 
              limit: 100000 
            } 
          });
          const allTxns = allTimePos.data?.data || [];
          
          // Filter POS transactions on frontend based on date range
          let txns = allTxns;
          if (!useAllTime) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999); // Include the entire end date
            
            txns = allTxns.filter(txn => {
              const txnDate = new Date(txn.timestamp || txn.createdAt || txn._id);
              return txnDate >= startDate && txnDate <= endDate;
            });
          }
          
          const posDiscount = txns.reduce((sum, txn) => {
            const discount = Number(txn?.payment?.discount) || 0;
            return sum + discount;
          }, 0);
          
          totalDiscounts += posDiscount;
        }
        
        setDiscountsUsedSum(totalDiscounts);
      } catch (error) { 
        console.error('Error fetching discounts:', error);
        setDiscountsUsedSum(0); 
      }
      
      // Keep table list available (not scoped by range yet; optional)
      try {
        const r = await axios.get(`${API_URL}/coupons/admin`);
        setCouponsTable(r.data || []);
      } catch (_) { setCouponsTable([]); }
    };

    const fetchDiscrepancy = async () => {
      try {
        const useAllTime = selectedYear === -1 || (selectedYear !== -1 && selectedMonth === -1);
        
        // Fetch all write-offs and replacement requests
        const [writeOffsRes, replacementsRes] = await Promise.all([
          axios.get(`${API_URL}/write-offs`, { params: { limit: 100000 } }),
          axios.get(`${API_URL}/replacement-requests/admin/all`, { params: { limit: 100000 } })
        ]);
        
        const allWriteOffs = writeOffsRes.data?.data?.writeOffs || [];
        const allReplacements = replacementsRes.data?.data?.requests || [];
        
        // Filter by date range on frontend
        let writeOffs = allWriteOffs;
        let replacements = allReplacements;
        
        if (!useAllTime) {
          const startDate = new Date(start);
          const endDate = new Date(end);
          endDate.setHours(23, 59, 59, 999);
          
          writeOffs = allWriteOffs.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= startDate && itemDate <= endDate;
          });
          
          replacements = allReplacements.filter(item => {
            const itemDate = new Date(item.createdAt);
            return itemDate >= startDate && itemDate <= endDate && item.status === 'approved';
          });
        } else {
          // For all-time, only include approved replacements
          replacements = allReplacements.filter(item => item.status === 'approved');
        }
        
        // Combine and group by date for trends (track both quantity and cost)
        const dateMap = {};
        let totalCostImpact = 0;
        
        writeOffs.forEach(item => {
          const date = new Date(item.createdAt).toISOString().split('T')[0];
          if (!dateMap[date]) dateMap[date] = { quantity: 0, cost: 0 };
          dateMap[date].quantity += item.quantity || 1;
          // Write-offs have a direct cost field
          const costValue = Number(item.cost) || 0;
          dateMap[date].cost += costValue;
          totalCostImpact += costValue;
        });
        
        replacements.forEach(item => {
          const date = new Date(item.createdAt).toISOString().split('T')[0];
          if (!dateMap[date]) dateMap[date] = { quantity: 0, cost: 0 };
          dateMap[date].quantity += item.quantity || 1;
          // Replacement requests: calculate cost from product price * quantity
          const productPrice = Number(item.product?.price) || 0;
          const quantity = Number(item.quantity) || 1;
          const costValue = productPrice * quantity;
          dateMap[date].cost += costValue;
          totalCostImpact += costValue;
        });
        
        // Convert to array format
        const formatted = Object.entries(dateMap).map(([date, data]) => ({
          date,
          quantity: data.quantity,
          cost: data.cost
        })).sort((a, b) => new Date(a.date) - new Date(b.date));
        
        setDiscrepancyTrends(formatted);
        setDiscrepancyCostImpact(totalCostImpact);
      } catch (error) { 
        console.error('Error fetching discrepancy:', error);
        setDiscrepancyTrends([]);
        setDiscrepancyCostImpact(0);
      }
    };

    const fetchAllData = async () => {
      setIsLoadingReportData(true);
      await Promise.all([
        fetchBySource(),
        fetchPreviousYearData(),
        fetchTopProducts(),
        fetchRevenueBySource(),
        fetchTotalSalesBySource(),
        fetchPosTxns(),
        fetchOnlineOrders(),
        fetchDiscountsUsed(),
        fetchDiscrepancy()
      ]);
      setIsLoadingReportData(false);
    };
    
    fetchAllData();
  }, [dataSource, selectedYear, selectedMonth, selectedWeek, buildRange]);

  // When data loading completes and we're waiting for export, show export modal
  useEffect(() => {
    if (!isLoadingReportData && waitingForExport) {
      setWaitingForExport(false);
      setShowExportModal(true);
    }
  }, [isLoadingReportData, waitingForExport]);

  return (
    <AdminLayout>
      <div className='py-4 sm:py-6 md:py-8 bg-[#f8f3ed] min-h-screen'>
        <div className='relative z-10 container mx-auto px-3 sm:px-4'>
          {/* Section 1 - Headers & Filters */}
          <div className='mb-4 sm:mb-6'>
            {/* Row 1: Title */}
            <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre mb-3 sm:mb-4'>Sales Analytics</h1>
            {/* Row 2: 3 Columns - Data Source | Date Filter | Button */}
            <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 items-center'>
                {/* Column 1: Data Source */}
                <div className='w-full flex justify-start'>
                  <div className='flex flex-wrap gap-1.5 sm:gap-2 items-center bg-white p-1 rounded-lg w-full'>
                    <span className='text-xs sm:text-sm font-medium text-[#030105] mr-1 sm:mr-2 font-alice whitespace-nowrap'>Data Source:</span>
                    {[
                      { key: 'orders', label: 'Online' },
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
                        } px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-md text-xs sm:text-sm font-medium transition-colors duration-200 font-alice active:scale-95 whitespace-nowrap`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Column 2: Date Filter (Month / Year) */}
                <div className='w-full flex flex-col sm:flex-row gap-2 justify-center'>
                  <select
                    value={selectedWeek}
                    onChange={(e)=>setSelectedWeek(Number(e.target.value))}
                    className='px-2 sm:px-3 py-2 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    disabled={selectedYear === -1 || selectedMonth === -1}
                  >
                    <option value={-1}>All Time</option>
                    <option value={1}>Week 1</option>
                    <option value={2}>Week 2</option>
                    <option value={3}>Week 3</option>
                    <option value={4}>Week 4</option>
                  </select>
                  <select
                    value={selectedMonth}
                    onChange={(e)=>setSelectedMonth(Number(e.target.value))}
                    className='px-2 sm:px-3 py-2 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                    disabled={selectedYear === -1}
                  >
                    <option value={-1}>All Time</option>
                    {MONTHS.map((m, idx) => (
                      <option key={m} value={idx}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={selectedYear}
                    onChange={(e)=>setSelectedYear(Number(e.target.value))}
                    className='px-2 sm:px-3 py-2 rounded-md border border-gray-300 text-[#030105] bg-[#fffefc] font-alice text-xs sm:text-sm'
                  >
                    <option value={-1}>All Time</option>
                    {YEARS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                {/* Column 3: Generate Reports Button */}
                <div className='w-full flex justify-center md:justify-end'>
                  <button
                    type='button'
                    onClick={() => setShowDateModal(true)}
                    className='px-3 sm:px-4 py-2 rounded-md bg-[#860809] text-white hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors duration-200 font-alice text-xs sm:text-sm active:scale-95 whitespace-nowrap w-full md:w-auto'
                  >
                    Generate Reports
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2 - Cards & Graphs (Two Columns) */}
          <div className='flex flex-col lg:flex-row gap-4 sm:gap-6'>
            {/* Column 1 - Analytics Cards (15%) */}
            <div className='w-full lg:basis-[15%]'>
              <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 lg:grid-cols-1 gap-3 sm:gap-4 lg:space-y-0 lg:sticky lg:top-24'>
                <AnalyticsCard title='Sales' icon={ShoppingCart} value={Number(salesCount).toLocaleString()} color='from-[#860809] to-[#a31f17]' />
                <AnalyticsCard title='Revenue' icon={PhilippinePeso} value={`₱${Math.round(Number(revenueSum) || 0).toLocaleString()}`} color='from-[#860809] to-[#a31f17]' />
                <AnalyticsCard title='Cost' icon={DollarSign} value={`₱${Math.round(Number(costDerived) || 0).toLocaleString()}`} color='from-[#860809] to-[#a31f17]' />
                <AnalyticsCard title='Profit' icon={TrendingUp} value={`₱${Math.round(Number(profitDerived) || 0).toLocaleString()}`} color='from-[#860809] to-[#a31f17]' />
                <AnalyticsCard title='Discounts Used' icon={Ticket} value={`₱${Math.round(Number(discountsUsedSum) || 0).toLocaleString()}`} color='from-[#860809] to-[#a31f17]' />
                <AnalyticsCard title='Discrepancies' icon={AlertTriangle} value={`₱${Math.round(Number(discrepancyCostImpact) || 0).toLocaleString()}`} color='from-[#860809] to-[#a31f17]' />
              </div>
            </div>

            {/* Column 2 - Charts, Graphs, Tables (85%) */}
            <div className='w-full lg:basis-[85%]'>
              {/* Subsection 1: Sales Line Chart & Profit Composed Chart */}
              <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6'>
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                  <div id="sales-forecast-chart">
                    <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre'>Sales Forecast</h3>
                    <p className='text-xs sm:text-sm text-gray-600 mb-3'>
                      Target Sales are from the previous {selectedYear === -1 ? 'years' : `year (${selectedYear - 1})`}.
                    </p>
                    <ResponsiveContainer width='100%' height={200} className="sm:!h-[260px]">
                      <LineChart data={dailyData}>
                        <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.1} />
                        <XAxis dataKey='date' stroke='#030105' />
                        <YAxis stroke='#030105' />
                        <Tooltip />
                        <Legend />
                        <Line type='monotone' dataKey='targetSales' stroke='#a31f17' strokeWidth={3} name='Target' />
                        <Line type='monotone' dataKey='actualSales' stroke='#22c55e' strokeWidth={3} name='Actual' />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div id="profit-forecast-chart">
                    <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre'>Profit Forecast</h3>
                    <p className='text-xs sm:text-sm text-gray-600 mb-3'>
                      Target Profit are from the previous {selectedYear === -1 ? 'years' : `year (${selectedYear - 1})`}.
                    </p>
                    <ResponsiveContainer width='100%' height={200} className="sm:!h-[260px]">
                      <ComposedChart data={profitComposedData}>
                        <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.1} />
                        <XAxis dataKey='date' stroke='#030105' />
                        <YAxis stroke='#030105' />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey='targetProfit' fill='#a31f17' name='Target' radius={[4,4,0,0]} />
                        <Line type='monotone' dataKey='actualProfit' stroke='#3b82f6' strokeWidth={3} name='Actual' />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

            {/* Subsection 1.5: Revenue vs Cost (Bar: Actual, Line: Target) */}
            <div id="revenue-forecast-chart" className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 mb-4 sm:mb-6'>
              <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre'>Revenue Forecast</h3>
              <p className='text-xs sm:text-sm text-gray-600 mb-3'>
                Target Revenue are from the previous {selectedYear === -1 ? 'years' : `year (${selectedYear - 1})`}.
              </p>
              <ResponsiveContainer width='100%' height={200} className="sm:!h-[260px]">
                <ComposedChart data={revenueCostData}>
                  <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.1} />
                  <XAxis dataKey='date' stroke='#030105' />
                  <YAxis stroke='#030105' />
                  <Tooltip />
                  <Legend />
                  <ReferenceLine y={0} stroke='#9ca3af' />
                  <Bar dataKey='revenue' fill='#22c55e' name='Revenue' radius={[4,4,0,0]} />
                  <Bar dataKey='cost' fill='#ef4444' name='Cost' radius={[0,0,4,4]} />
                  <Line type='monotone' dataKey='revenueTarget' stroke='#2563eb' strokeWidth={3} name='Revenue Target' />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

              {/* Subsection 2: Top Products Table & Payment Gateway Triple Bar */}
              <div className='flex flex-col lg:flex-row gap-4 sm:gap-6 mb-4 sm:mb-6'>
                <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 w-full lg:basis-[40%] flex flex-col'>
                  <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre'>Top Selling Products</h3>
                  <div className='overflow-x-auto overflow-y-auto' style={{ maxHeight: showAllProducts ? '350px' : 'none' }}>
                    <table className='w-full'>
                      <thead className='sticky top-0 bg-[#fffefc] z-10'>
                        <tr className='border-b border-gray-200'>
                          <th className='text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Product</th>
                          <th className='text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Orders</th>
                          <th className='text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {topProducts.length === 0 ? (
                          <tr><td colSpan='3' className='py-6 text-center text-xs sm:text-sm text-[#030105] font-alice'>No data</td></tr>
                        ) : (
                          (showAllProducts ? topProducts : topProducts.slice(0, 5)).map((p) => (
                            <tr key={p.productId} className='border-b border-gray-100'>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#030105] font-alice break-words'>{p.productName}</td>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-[#030105] font-alice'>{p.quantitySold}</td>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-[#030105] font-alice whitespace-nowrap'>₱{Number(p.revenue || 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  {topProducts.length > 5 && (
                    <button 
                      onClick={() => setShowAllProducts(!showAllProducts)}
                      className='mt-3 px-3 sm:px-4 py-2 bg-[#860809] text-white rounded-md hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors text-xs sm:text-sm font-alice self-center active:scale-95 whitespace-nowrap'
                    >
                      {showAllProducts ? 'Show Less' : `Show More (${topProducts.length - 5} more)`}
                    </button>
                  )}
                </div>
                <div id="payment-gateway-chart" className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6 w-full lg:basis-[60%]'>
                  <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre'>Payment Gateway Performance</h3>
                  <ResponsiveContainer width='100%' height={200} className="sm:!h-[260px]">
                    <BarChart data={paymentGatewayData}>
                      <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.1} />
                      <XAxis dataKey='day' stroke='#030105' />
                      <YAxis stroke='#030105' />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey='cash' fill='#22c55e' name='Cash' radius={[4,4,0,0]} />
                      <Bar dataKey='bank' fill='#a31f17' name='Bank' radius={[4,4,0,0]} />
                      <Bar dataKey='online' fill='#3b82f6' name='Online' radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Subsection 3: Discrepancy Trends Line & Coupons Table */}
              <div className='grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6'>
                <div id="discrepancy-trends-chart" className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6'>
                  <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 font-libre'>Discrepancy Trends</h3>
                  <ResponsiveContainer width='100%' height={200} className="sm:!h-[260px]">
                    <LineChart data={formattedDiscrepancyTrends}>
                      <CartesianGrid strokeDasharray='3 3' stroke='black' strokeOpacity={0.1} />
                      <XAxis dataKey='date' stroke='#030105' />
                      <YAxis yAxisId="left" stroke='#030105' />
                      <YAxis yAxisId="right" orientation="right" stroke='#030105' />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'Cost Impact') return ['₱' + Number(value).toLocaleString(), name];
                        return [value, name];
                      }} />
                      <Legend />
                      <Line yAxisId="left" type='monotone' dataKey='quantity' stroke='#ef4444' strokeWidth={3} name='Quantity' />
                      <Line yAxisId="right" type='monotone' dataKey='cost' stroke='#f97316' strokeWidth={3} name='Cost Impact' />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className='bg-[#fffefc] rounded-lg shadow-lg border border-gray-300 p-3 sm:p-4 md:p-6'>
                  <h3 className='text-base sm:text-lg font-semibold text-[#860809] mb-2 sm:mb-3 font-libre'>Discounts Used</h3>
                  <div className='overflow-x-auto max-h-[300px] overflow-y-auto'>
                    <table className='w-full'>
                      <thead className='sticky top-0 bg-[#fffefc] z-10'>
                        <tr className='border-b border-gray-200'>
                          <th className='text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Code</th>
                          <th className='text-left py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Date</th>
                          <th className='text-right py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm font-semibold text-[#860809] font-alice'>Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {couponsDiscounts.length === 0 ? (
                          <tr><td colSpan='3' className='py-6 text-center text-xs sm:text-sm text-[#030105] font-alice'>No data</td></tr>
                        ) : (
                          couponsDiscounts.map((item, idx) => (
                            <tr key={`${item.code}-${idx}`} className='border-b border-gray-100'>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#030105] font-alice'>{item.code}</td>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-[#030105] font-alice whitespace-nowrap'>
                                {item.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </td>
                              <td className='py-2 sm:py-3 px-2 sm:px-4 text-xs sm:text-sm text-right text-[#030105] font-alice whitespace-nowrap'>₱{item.amount.toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date Range Selection Modal */}
      {/* Loading overlay while fetching report data */}
      {waitingForExport && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-8 text-center'>
            <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-[#860809] mx-auto mb-4'></div>
            <p className='text-lg font-semibold text-[#030105] font-alice'>Loading report data...</p>
            <p className='text-sm text-gray-600 font-alice mt-2'>Please wait while we fetch the selected period's data</p>
          </div>
        </div>
      )}

      {showDateModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4'>
          <div className='bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-bold text-[#860809] mb-3 sm:mb-4 font-libre'>Select Report Period</h2>
            <p className='text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4 font-alice'>Choose the time period for the report you want to generate.</p>
            
            <div className='space-y-3 sm:space-y-4'>
              <div>
                <label className='block text-xs sm:text-sm font-semibold text-[#030105] mb-2 font-alice'>Year</label>
                <select
                  value={reportYear}
                  onChange={(e) => {
                    const year = Number(e.target.value);
                    setReportYear(year);
                    if (year === -1) {
                      setReportMonth(-1);
                      setReportWeek(-1);
                    }
                  }}
                  className='w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] font-alice'
                >
                  <option value={-1}>All Time</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className='block text-xs sm:text-sm font-semibold text-[#030105] mb-2 font-alice'>Month</label>
                <select
                  value={reportMonth}
                  onChange={(e) => {
                    const month = Number(e.target.value);
                    setReportMonth(month);
                    if (month === -1) {
                      setReportWeek(-1);
                    }
                  }}
                  disabled={reportYear === -1}
                  className='w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] font-alice disabled:bg-gray-100 disabled:cursor-not-allowed'
                >
                  <option value={-1}>All Time</option>
                  {MONTHS.map((m, idx) => (
                    <option key={m} value={idx}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className='block text-xs sm:text-sm font-semibold text-[#030105] mb-2 font-alice'>Week</label>
                <select
                  value={reportWeek}
                  onChange={(e) => setReportWeek(Number(e.target.value))}
                  disabled={reportYear === -1 || reportMonth === -1}
                  className='w-full px-2 sm:px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#860809] font-alice disabled:bg-gray-100 disabled:cursor-not-allowed'
                >
                  <option value={-1}>All Time</option>
                  <option value={1}>Week 1</option>
                  <option value={2}>Week 2</option>
                  <option value={3}>Week 3</option>
                  <option value={4}>Week 4</option>
                </select>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-3 mt-4 sm:mt-6'>
              <button
                onClick={() => {
                  setShowDateModal(false);
                  // Reset to current date
                  setReportYear(currentYear);
                  setReportMonth(new Date().getMonth());
                  setReportWeek(-1);
                }}
                className='flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 text-[#030105] rounded-md hover:bg-gray-50 active:bg-gray-50 transition-colors font-alice active:scale-95'
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const range = buildReportRange(reportYear, reportMonth, reportWeek);
                  setReportDateRange(range);
                  
                  // Update main page filters to match report filters
                  // This will trigger data fetch for the selected report period
                  setSelectedYear(reportYear);
                  setSelectedMonth(reportMonth);
                  setSelectedWeek(reportWeek);
                  
                  setShowDateModal(false);
                  
                  // Set flag to show export modal once data loading completes
                  setWaitingForExport(true);
                }}
                className='flex-1 px-3 sm:px-4 py-2 text-xs sm:text-sm bg-[#860809] text-white rounded-md hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors font-alice active:scale-95'
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export Format Selection Modal */}
      {showExportModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4'>
          <div className='bg-white rounded-lg p-4 sm:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto'>
            <h2 className='text-lg sm:text-xl md:text-2xl font-bold text-[#860809] mb-3 sm:mb-4 font-libre'>Select Export Format</h2>
            <div className='bg-gray-50 rounded-md p-3 mb-4 sm:mb-6'>
              <p className='text-xs sm:text-sm font-semibold text-[#030105] mb-1 font-alice'>Report Period:</p>
              <p className='text-xs sm:text-sm text-gray-700 font-alice break-words'>
                {reportYear === -1 
                  ? 'All Time (2021 - Present)'
                  : reportMonth === -1
                  ? `${reportYear} (Full Year)`
                  : reportWeek === -1
                  ? `${MONTHS[reportMonth]} ${reportYear}`
                  : `${MONTHS[reportMonth]} ${reportYear} - Week ${reportWeek}`
                }
              </p>
              <p className='text-xs text-gray-500 mt-1 font-alice'>
                {new Date(reportDateRange.start).toLocaleDateString()} - {new Date(reportDateRange.end).toLocaleDateString()}
              </p>
            </div>
            
            <div className='space-y-3'>
              <button
                onClick={handleCSVExport}
                disabled={isExporting}
                className='w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-[#860809] text-[#860809] rounded-lg hover:bg-[#860809] hover:text-white active:bg-[#860809] active:text-white transition-colors font-alice text-left disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
              >
                <div className='font-bold text-base sm:text-lg mb-1'>
                  {isExporting ? '⏳ Exporting...' : '📊 Export as CSV'}
                </div>
                <div className='text-xs sm:text-sm opacity-80'>Download all data in spreadsheet format</div>
              </button>
              
              <button
                onClick={handlePDFExport}
                disabled={isExporting}
                className='w-full px-4 sm:px-6 py-3 sm:py-4 bg-white border-2 border-[#860809] text-[#860809] rounded-lg hover:bg-[#860809] hover:text-white active:bg-[#860809] active:text-white transition-colors font-alice text-left disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]'
              >
                <div className='font-bold text-base sm:text-lg mb-1'>
                  {isExporting ? '⏳ Generating...' : '📄 Export as PDF'}
                </div>
                <div className='text-xs sm:text-sm opacity-80'>Generate comprehensive report with charts and analysis</div>
              </button>
            </div>

            <button
              onClick={() => {
                setShowExportModal(false);
                setShowDateModal(true);
              }}
              className='w-full mt-4 px-3 sm:px-4 py-2 text-xs sm:text-sm border border-gray-300 text-[#030105] rounded-md hover:bg-gray-50 active:bg-gray-50 transition-colors font-alice active:scale-95'
            >
              Back
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

const AnalyticsCard = ({ title, value, icon: Icon, color }) => (
  <div className={`bg-[#fffefc] rounded-lg p-3 sm:p-4 shadow-lg overflow-hidden relative border border-gray-300`}>
    <div className='flex justify-between items-center'>
      <div className='z-10'>
        <p className='text-[#a31f17] text-xs sm:text-sm mb-1 font-semibold opacity-80 font-alice'>{title}</p>
        <h3 className='text-[#030105] text-lg sm:text-xl md:text-2xl font-bold font-libre break-words'>{value}</h3>
      </div>
      <div className='text-[#860809] opacity-30 flex-shrink-0'>
        <Icon className='h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8' />
      </div>
    </div>
    <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-10 pointer-events-none`} />
  </div>
);

export default SalesReportPage;


