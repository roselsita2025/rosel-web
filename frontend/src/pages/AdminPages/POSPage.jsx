import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Calculator, 
  CreditCard, 
  Receipt, 
  User, 
  Package,
  X,
  Check,
  AlertCircle,
  Percent,
  Hash,
  ScanLine,
  Camera,
  History
} from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { productStore } from '../../store/productStore.js';
import { useAuthStore } from '../../store/authStore.js';
import { usePOSStore } from '../../store/posStore.js';
import AdminLayout from '../../components/AdminLayout.jsx';
import { Link } from 'react-router-dom';

const POSPage = () => {
  const { products, fetchAllProducts, refreshProducts, loading: productsLoading } = productStore();
  const { user } = useAuthStore();
  const { createTransaction, loading: transactionLoading, error: transactionError } = usePOSStore();
  
  // Currency formatting function
  const formatCurrency = (amount) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  // POS State
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    referenceNumber: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentInfo, setPaymentInfo] = useState({
    subtotal: 0,
    tax: 0,
    discount: 0,
    discountType: 'fixed', // 'fixed' or 'percent'
    discountValue: 0,
    total: 0,
    cashReceived: 0,
    change: 0
  });
  const [showPaymentMethodModal, setShowPaymentMethodModal] = useState(false);
  const [showCustomerInfoModal, setShowCustomerInfoModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState(null);
  
  // Barcode scanning state
  const [scanMode, setScanMode] = useState('usb'); // 'usb' or 'camera'
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState('');
  const [scanError, setScanError] = useState('');
  
  // Cart error state
  const [cartError, setCartError] = useState('');
  
  // Added to cart feedback state
  const [addedToCart, setAddedToCart] = useState(null);
  
  // Weight selection modal state
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedWeightOption, setSelectedWeightOption] = useState(null);
  const [quantityInput, setQuantityInput] = useState(1);
  
  // Product not found modal state
  const [showProductNotFoundModal, setShowProductNotFoundModal] = useState(false);

  // Categories
  const categories = ['pork', 'beef', 'chicken', 'sliced', 'processed', 'seafood'];

  // Load products on component mount
  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  // USB Scanner (Keyboard Wedge) functionality
  useEffect(() => {
    if (scanMode !== 'usb') return;
    
    let buffer = '';
    let lastTs = 0;
    
    const handleKeyDown = async (e) => {
      const now = Date.now();
      if (now - lastTs > 50) buffer = '';
      
      if (e.key === 'Enter') {
        const code = buffer.trim();
        buffer = '';
        if (!code) { 
          lastTs = now; 
          return; 
        }
        
        // Normalize to digits only for lookup and display
        const digitsOnly = code.replace(/\D/g, '');
        setLastScannedCode(digitsOnly);
        setScanError('');
        
        // Find and add product to cart
        const result = await productStore.getState().fetchProductByBarcode(digitsOnly);
        if (result) {
          const { product, matchedWeightOptionId } = result;
          addToCart(product, matchedWeightOptionId);
        } else {
          setScanError('Product not found');
        }
        
        lastTs = now;
        return;
      }
      
      if (/^[0-9A-Za-z]$/.test(e.key)) {
        buffer += e.key;
        lastTs = now;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [scanMode]);

  // Camera scanning functions
  const startCameraScan = async () => {
    try {
      setIsScanning(true);
      setScanError('');
      
      const reader = new BrowserMultiFormatReader();
      const controls = await reader.decodeFromVideoDevice(
        null, 
        document.getElementById('pos-scan-video'), 
        (result) => {
          if (result) {
            const code = result.getText();
            setLastScannedCode(code);
            handleScannedCode(code);
          }
        }
      );
      
      // Store controls for cleanup
      window.__posScanControls = controls;
    } catch (error) {
      console.error('Camera scan error:', error);
      setScanError('Failed to start camera');
      setIsScanning(false);
    }
  };

  const stopCameraScan = () => {
    try {
      if (window.__posScanControls) {
        window.__posScanControls.stop();
        window.__posScanControls = null;
      }
      setIsScanning(false);
    } catch (error) {
      console.error('Stop camera error:', error);
    }
  };

  const handleScannedCode = async (code) => {
    setScanError('');
    
    // Find and add product to cart
    const result = await productStore.getState().fetchProductByBarcode(code);
    if (result) {
      const { product, matchedWeightOptionId } = result;
      addToCart(product, matchedWeightOptionId);
      // Stop camera after successful scan
      if (scanMode === 'camera') {
        stopCameraScan();
      }
    } else {
      setScanError('Product not found');
      // Show popup modal and play sound for camera scanner
      if (scanMode === 'camera') {
        setShowProductNotFoundModal(true);
        
        // Auto-close modal after 3 seconds
        setTimeout(() => {
          setShowProductNotFoundModal(false);
        }, 3000);
        
        // Play error sound
        try {
          const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBS13yO/eizEIHWq+8+OWT');
          audio.play().catch(() => {
            // Fallback: create a simple beep sound
            const context = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = context.createOscillator();
            const gainNode = context.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(context.destination);
            oscillator.frequency.setValueAtTime(800, context.currentTime);
            gainNode.gain.setValueAtTime(0.3, context.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.3);
            oscillator.start(context.currentTime);
            oscillator.stop(context.currentTime + 0.3);
          });
        } catch (error) {
          console.log('Could not play sound:', error);
        }
      }
    }
  };

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (window.__posScanControls) {
        try {
          window.__posScanControls.stop();
        } catch (error) {
          console.error('Cleanup camera error:', error);
        }
      }
    };
  }, []);

  // Calculate totals whenever cart changes
  useEffect(() => {
    const subtotal = cart.reduce((sum, item) => sum + ((item.unitPrice || item.price) * item.quantity), 0);
    const tax = 0; // Tax removed
    let discount = 0;
    
    if (paymentInfo.discountType === 'percent') {
      discount = subtotal * (paymentInfo.discountValue / 100);
    } else {
      discount = paymentInfo.discountValue;
    }
    
    const total = subtotal - discount;
    const change = paymentInfo.cashReceived - total;
    
    setPaymentInfo(prev => ({
      ...prev,
      subtotal,
      tax,
      discount,
      total,
      change: change > 0 ? change : 0
    }));
  }, [cart, paymentInfo.discountType, paymentInfo.discountValue, paymentInfo.cashReceived]);

  // Filter products based on search and category
  const filteredProducts = products?.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.barcode?.includes(searchQuery);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    // Check if product has stock (either legacy quantity or weight options with stock)
    const hasStock = product.quantity > 0 || (product.hasWeightOptions && product.weightOptions && product.weightOptions.some(opt => opt.stockUnits > 0));
    
    return matchesSearch && matchesCategory && product.status === 'available' && hasStock;
  }) || [];

  // Cart functions
  const addToCart = (product, matchedWeightOptionId = null) => {
    setCartError(''); // Clear any previous errors
    
    // If a specific weight option was matched by barcode, add it directly
    if (matchedWeightOptionId) {
      const matchedOption = product.weightOptions?.find(opt => String(opt._id) === String(matchedWeightOptionId));
      if (matchedOption) {
        addProductToCart(product, matchedOption);
        return;
      }
    }
    
    // Check if product has weight options (and no specific weight was matched)
    if (product.hasWeightOptions && product.weightOptions && product.weightOptions.length > 0) {
      // Show weight selection modal
      setSelectedProduct(product);
      setShowWeightModal(true);
      return;
    }
    
    // For products without weight options, add directly to cart
    addProductToCart(product);
  };

  const addProductToCart = (product, selectedWeightOption = null) => {
    setCart(prev => {
      const existingItem = prev.find(item => 
        item._id === product._id && 
        (!selectedWeightOption || String(item.weightOptionId) === String(selectedWeightOption._id))
      );
      
      if (existingItem) {
        const maxStock = selectedWeightOption ? selectedWeightOption.stockUnits : (existingItem.stockQuantity || product.quantity);
        if (existingItem.quantity < maxStock) {
          // Show added to cart feedback
          setAddedToCart(product._id);
          setTimeout(() => setAddedToCart(null), 1000);
          
          return prev.map(item =>
            (item._id === product._id && (!selectedWeightOption || String(item.weightOptionId) === String(selectedWeightOption._id)))
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // Show error when trying to exceed stock
          setCartError(`Cannot add more ${product.name}. Only ${maxStock} items available in stock.`);
          return prev;
        }
      } else {
        const stockQuantity = selectedWeightOption ? selectedWeightOption.stockUnits : product.quantity;
        if (stockQuantity > 0) {
          // Show added to cart feedback
          setAddedToCart(product._id);
          setTimeout(() => setAddedToCart(null), 1000);
          
          const cartItem = {
            ...product,
            quantity: 1,
            stockQuantity,
            weightOptionId: selectedWeightOption ? selectedWeightOption._id : null,
            weightKg: selectedWeightOption ? selectedWeightOption.weightKg : null,
            unitPrice: selectedWeightOption ? (selectedWeightOption.price || (product.basePricePerKg * selectedWeightOption.weightKg)) : product.price
          };
          
          return [...prev, cartItem];
        } else {
          // Show error when product is out of stock
          setCartError(`${product.name} is out of stock.`);
          return prev;
        }
      }
    });
  };

  const updateQuantity = (productId, newQuantity, weightOptionId = null) => {
    setCartError(''); // Clear any previous errors
    
    if (newQuantity <= 0) {
      removeFromCart(productId, weightOptionId);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item._id === productId && (!weightOptionId || String(item.weightOptionId) === String(weightOptionId))) {
        const maxQuantity = item.stockQuantity || item.quantity;
        if (newQuantity > maxQuantity) {
          setCartError(`Cannot add more ${item.name}. Only ${maxQuantity} items available in stock.`);
          return item; // Return unchanged item
        }
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (productId, weightOptionId = null) => {
    setCart(prev => prev.filter(item => 
      !(item._id === productId && (!weightOptionId || String(item.weightOptionId) === String(weightOptionId)))
    ));
  };

  const clearCart = () => {
    setCart([]);
    setCartError(''); // Clear cart error
    setCustomerInfo({ name: '', phone: '', email: '', referenceNumber: '' });
    setPaymentMethod('cash');
    setPaymentInfo(prev => ({
      ...prev,
      discount: 0,
      discountValue: 0,
      cashReceived: 0,
      change: 0
    }));
    // Reset modal states
    setShowPaymentMethodModal(false);
    setShowCustomerInfoModal(false);
    setShowPaymentModal(false);
  };

  // Payment functions
  const handlePayment = () => {
    if (cart.length === 0) return;
    setShowPaymentMethodModal(true);
  };

  const handlePaymentMethodSelect = (method) => {
    setPaymentMethod(method);
    setShowPaymentMethodModal(false);
    setShowCustomerInfoModal(true);
  };

  const handleCustomerInfoSubmit = () => {
    // Validate customer info based on payment method
    if (paymentMethod !== 'cash') {
      if (!customerInfo.name.trim()) {
        setCartError('Customer name is required for this payment method');
        return;
      }
      if (!customerInfo.phone.trim()) {
        setCartError('Customer phone number is required for this payment method');
        return;
      }
      if (paymentMethod === 'online' || paymentMethod === 'bank') {
        if (!customerInfo.referenceNumber.trim()) {
          setCartError('Reference number is required for this payment method');
          return;
        }
      }
    }
    
    setShowCustomerInfoModal(false);
    setShowPaymentModal(true);
  };

  const processPayment = async () => {
    // Validate payment based on method
    if (paymentMethod === 'cash' && paymentInfo.cashReceived < paymentInfo.total) {
      return;
    }
    
    // Check if user is authenticated
    if (!user || !user._id) {
      setCartError('You must be logged in to process transactions');
      return;
    }
    
    // Prepare transaction data for backend
    const transactionData = {
      items: cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.unitPrice || item.price,
        quantity: item.quantity,
        total: (item.unitPrice || item.price) * item.quantity,
        weightOptionId: item.weightOptionId || null,
        weightKg: item.weightKg || null
      })),
      customer: customerInfo,
      payment: {
        ...paymentInfo,
        method: paymentMethod
      },
      cashier: {
        id: user._id,
        name: user.name || 'Admin'
      }
    };


    // Save transaction to backend
    const result = await createTransaction(transactionData);
    
    if (result.success) {
      // Create local transaction object for receipt display
      const transaction = {
        id: result.data.transactionId,
        timestamp: new Date(result.data.timestamp),
        customer: customerInfo,
        items: cart,
        payment: paymentInfo,
        cashier: user?.name || 'Admin'
      };
      
      setCurrentTransaction(transaction);
      setShowPaymentModal(false);
      setShowReceipt(true);
      
      // Refresh products to get updated stock counts immediately after successful payment
      refreshProducts();
    } else {
      // Show error message
      setCartError(result.error || 'Failed to process transaction');
    }
  };

  const completeTransaction = () => {
    // Here you would typically save to backend
    clearCart();
    setShowReceipt(false);
    setCurrentTransaction(null);
    
    // Refresh products to get updated stock counts
    refreshProducts();
  };

  const handlePrintReceipt = () => {
    if (!currentTransaction) return;
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    
    // Generate the receipt HTML
    const receiptHTML = generateReceiptHTML(currentTransaction);
    
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      
      // Close the print window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  };

  const generateReceiptHTML = (transaction) => {
    const formatCurrency = (amount) => `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const formatDate = (date) => date.toLocaleString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${transaction.id}</title>
        <style>
          @media print {
            body { margin: 0; padding: 0; }
            .no-print { display: none !important; }
          }
          body {
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            margin: 0;
            padding: 10px;
            background: white;
            color: black;
          }
          .receipt {
            max-width: 300px;
            margin: 0 auto;
          }
          .header {
            text-align: center;
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .company-name {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .company-address {
            font-size: 10px;
            margin-bottom: 5px;
          }
          .transaction-info {
            margin-bottom: 15px;
          }
          .transaction-info div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .items {
            border-bottom: 1px dashed #000;
            padding-bottom: 10px;
            margin-bottom: 10px;
          }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .item-name {
            flex: 1;
          }
          .item-details {
            text-align: right;
            font-size: 10px;
          }
          .totals {
            margin-bottom: 15px;
          }
          .totals div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .total {
            font-weight: bold;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 5px;
          }
          .payment-info {
            border-top: 1px dashed #000;
            padding-top: 10px;
            margin-top: 10px;
          }
          .payment-info div {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 10px;
          }
          .thank-you {
            font-weight: bold;
            margin-bottom: 5px;
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">ROSEL FROZEN MEATS</div>
            <div class="company-address">Blk 8 Lot 4 Alagaw St., Greensite Homes Subd.</div>
            <div class="company-address">Molino II, Bacoor City, Cavite, Philippines</div>
            <div class="company-address">Tel: +639263203832</div>
          </div>

          <div class="transaction-info">
            <div><strong>Transaction ID:</strong> ${transaction.id}</div>
            <div><strong>Date & Time:</strong> ${formatDate(transaction.timestamp)}</div>
            <div><strong>Cashier:</strong> ${transaction.cashier}</div>
            ${transaction.customer.name ? `<div><strong>Customer:</strong> ${transaction.customer.name}</div>` : ''}
          </div>

          <div class="items">
            <div style="font-weight: bold; margin-bottom: 5px;">ITEMS PURCHASED:</div>
            ${transaction.items.map(item => {
              const itemPrice = item.unitPrice || item.price;
              const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
              return `
                <div class="item">
                  <div class="item-name">${item.name}${weightInfo}</div>
                  <div class="item-details">
                    ${formatCurrency(itemPrice)} × ${item.quantity}<br>
                    ${formatCurrency(itemPrice * item.quantity)}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="totals">
            <div><strong>Subtotal:</strong> ${formatCurrency(transaction.payment.subtotal)}</div>
            ${transaction.payment.discount > 0 ? `<div><strong>Discount:</strong> -${formatCurrency(transaction.payment.discount)}</div>` : ''}
            <div class="total"><strong>TOTAL:</strong> ${formatCurrency(transaction.payment.total)}</div>
          </div>

          <div class="payment-info">
            <div><strong>Payment Method:</strong> ${(transaction.payment.method || 'cash').toUpperCase()}</div>
            ${transaction.payment.method === 'cash' ? `
              <div><strong>Cash Received:</strong> ${formatCurrency(transaction.payment.cashReceived)}</div>
              <div><strong>Change:</strong> ${formatCurrency(transaction.payment.change)}</div>
            ` : ''}
            ${(transaction.payment.method === 'online' || transaction.payment.method === 'bank') && transaction.customer.referenceNumber ? `
              <div><strong>Reference Number:</strong> ${transaction.customer.referenceNumber}</div>
            ` : ''}
          </div>

          <div class="footer">
            <div class="thank-you">THANK YOU FOR YOUR PURCHASE!</div>
            <div>Please keep this receipt for your records</div>
            <div>Visit us again soon!</div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  return (
    <AdminLayout>
      <div className="p-3 sm:p-4 md:p-6 bg-[#f8f3ed] min-h-screen">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] font-libre">Point of Sale</h1>
            <Link
              to="/pos/history"
              className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#a31f17] text-white text-sm sm:text-base rounded-lg hover:bg-[#860809] transition-colors font-alice whitespace-nowrap"
            >
              <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Transaction History
            </Link>
          </div>
            <p className="text-sm sm:text-base text-[#a31f17] font-alice">Process cash transactions and manage sales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {/* Left Panel - Product Selection */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
            {/* Search and Filters */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-[#a31f17] w-4 h-4 sm:w-5 sm:h-5" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="capitalize">
                      {category}
                    </option>
                  ))}
                </select>
                <select
                  value={scanMode}
                  onChange={(e) => setScanMode(e.target.value)}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                >
                  <option value="usb">USB Scanner</option>
                  <option value="camera">Camera</option>
                </select>
              </div>
              
              {/* Scanner Status and Controls */}
              {scanMode === 'usb' && (
                <div className="mt-3 bg-[#f8f3ed] border border-gray-300 rounded-lg p-2.5 sm:p-3">
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2">
                    <Hash className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#860809]" />
                    <span className="text-xs sm:text-sm font-medium text-[#860809] font-alice">USB Scanner Ready</span>
                  </div>
                  <p className="text-xs text-[#a31f17] mb-2 font-libre">
                    Connect your USB barcode scanner and scan products directly. The scanner will automatically add items to cart.
                  </p>
                  {lastScannedCode && (
                    <div className="text-xs text-[#860809] font-alice break-all">
                      Last scanned: <span className="font-mono bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{lastScannedCode}</span>
                    </div>
                  )}
                  {scanError && (
                    <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      <span className="break-words">{scanError}</span>
                    </div>
                  )}
                </div>
              )}

              {scanMode === 'camera' && (
                <div className="mt-3 bg-[#f8f3ed] border border-gray-300 rounded-lg p-2.5 sm:p-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-3">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#860809]" />
                      <span className="text-xs sm:text-sm font-medium text-[#860809] font-alice">Camera Scanner</span>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={startCameraScan}
                        disabled={isScanning}
                        className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1 bg-[#860809] text-white text-xs rounded hover:bg-[#a31f17] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-1 font-alice"
                      >
                        <ScanLine className="w-3 h-3" />
                        {isScanning ? 'Scanning...' : 'Start'}
                      </button>
                      <button
                        onClick={stopCameraScan}
                        disabled={!isScanning}
                        className="flex-1 sm:flex-none px-2.5 sm:px-3 py-1 bg-[#a31f17] text-white text-xs rounded hover:bg-[#8a1a14] disabled:bg-gray-400 disabled:cursor-not-allowed font-alice"
                      >
                        Stop
                      </button>
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <video 
                      id="pos-scan-video" 
                      style={{ width: '100%', maxWidth: '100%', height: 'auto', minHeight: '150px', maxHeight: '250px' }} 
                      muted 
                      playsInline 
                      autoPlay
                      className="rounded border border-[#f7e9b8] mx-auto"
                    />
                  </div>
                  
                  {lastScannedCode && (
                    <div className="text-xs text-[#860809] mb-2 break-all">
                      Last scanned: <span className="font-mono bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-xs">{lastScannedCode}</span>
                    </div>
                  )}
                  
                  {scanError && (
                    <div className="text-xs text-red-600 flex items-center gap-1 mb-2">
                      <AlertCircle className="w-3 h-3" />
                      <span className="break-words">{scanError}</span>
                    </div>
                  )}
                  
                  <p className="text-xs text-[#a48674] mt-2">
                    Position the barcode in front of the camera. The scanner will automatically detect and add items to cart.
                  </p>
                </div>
              )}
            </div>

            {/* Products Grid */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-3 sm:mb-4 font-libre">Products</h3>
              {productsLoading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-200 h-24 sm:h-32 rounded-lg mb-2"></div>
                      <div className="h-3 sm:h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-2 sm:h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4 max-h-[400px] sm:max-h-[500px] md:max-h-[600px] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product._id}
                      whileTap={{ scale: 0.98 }}
                      className={`border border-gray-300 rounded-lg p-2 sm:p-3 cursor-pointer hover:shadow-md active:shadow-lg transition-shadow relative ${
                        addedToCart === product._id ? 'bg-green-50 border-green-300' : ''
                      }`}
                      onClick={() => addToCart(product)}
                    >
                      {/* Added to cart overlay */}
                      {addedToCart === product._id && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="absolute inset-0 bg-green-500 bg-opacity-90 rounded-lg flex items-center justify-center z-10"
                        >
                          <div className="text-white text-center">
                            <Check className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1" />
                            <p className="text-xs sm:text-sm font-medium">Added to cart</p>
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="aspect-square mb-1.5 sm:mb-2 overflow-hidden rounded-lg">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-medium text-xs sm:text-sm text-[#030105] line-clamp-2 mb-1 font-alice">
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#a31f17] capitalize mb-1.5 sm:mb-2 font-libre">
                        {product.category}
                      </p>
                      <div className="flex justify-center items-center">
                        <span className="text-xs sm:text-sm font-semibold text-[#860809] font-alice">
                          Stock: {product.totalStockUnits || product.quantity}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Cart and Checkout */}
          <div className="space-y-3 sm:space-y-4 md:space-y-6">
            {/* Cart */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#860809] flex items-center gap-1.5 sm:gap-2 font-libre">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-xs sm:text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    Clear
                  </button>
                )}
              </div>

              {/* Cart Error Message */}
              {(cartError || transactionError) && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 sm:mb-4 p-2 sm:p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2"
                >
                  <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-red-700 flex-1 break-words">{cartError || transactionError}</span>
                  <button
                    onClick={() => {
                      setCartError('');
                      usePOSStore.getState().clearError();
                    }}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </motion.div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-6 sm:py-8 text-[#a31f17]">
                  <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm sm:text-base">Cart is empty</p>
                  <p className="text-xs sm:text-sm font-alice">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-2 sm:space-y-3 max-h-56 sm:max-h-64 overflow-y-auto">
                  {cart.map(item => {
                    const itemPrice = item.unitPrice || item.price;
                    const weightInfo = item.weightKg ? ` (${item.weightKg}kg)` : '';
                    return (
                      <div key={`${item._id}-${item.weightOptionId || 'default'}`} className="flex items-center gap-2 sm:gap-3 p-2 border border-gray-300 rounded-lg">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-xs sm:text-sm text-[#030105] line-clamp-1 font-alice">
                            {item.name}{weightInfo}
                          </h4>
                          <p className="text-xs text-[#a31f17] font-libre">
                            {formatCurrency(itemPrice)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity - 1, item.weightOptionId)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f8f3ed] flex items-center justify-center hover:bg-[#860809] hover:text-white active:bg-[#a31f17] transition-colors flex-shrink-0"
                          >
                            <Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                          <span className="w-6 sm:w-8 text-center text-xs sm:text-sm font-medium font-alice">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item._id, item.quantity + 1, item.weightOptionId)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#f8f3ed] flex items-center justify-center hover:bg-[#860809] hover:text-white active:bg-[#a31f17] transition-colors flex-shrink-0"
                          >
                            <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                          </button>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-xs sm:text-sm text-[#860809] whitespace-nowrap">
                            {formatCurrency(itemPrice * item.quantity)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item._id, item.weightOptionId)}
                            className="text-red-500 hover:text-red-700 text-xs inline-flex items-center justify-center mt-0.5"
                          >
                            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>


            {/* Order Summary */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-3 sm:p-4">
              <h3 className="text-base sm:text-lg font-semibold text-[#860809] mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 font-libre">
                <Calculator className="w-4 h-4 sm:w-5 sm:h-5" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#a31f17] font-alice">Subtotal:</span>
                  <span className="font-medium font-libre">{formatCurrency(paymentInfo.subtotal)}</span>
                </div>
                {/* Tax removed */}
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-[#a31f17] font-alice">Discount:</span>
                  <span className="font-medium text-green-600 font-libre">-{formatCurrency(paymentInfo.discount)}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span className="text-[#860809] font-libre">Total:</span>
                  <span className="text-[#860809] font-libre">{formatCurrency(paymentInfo.total)}</span>
                </div>
              </div>

              {/* Discount Controls */}
              <div className="mt-3 sm:mt-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentInfo(prev => ({ ...prev, discountType: 'fixed' }))}
                    className={`flex-1 py-1.5 px-2 text-xs sm:text-sm rounded font-alice ${
                      paymentInfo.discountType === 'fixed'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105] hover:bg-gray-200'
                    }`}
                  >
                    <span className="text-sm sm:text-base font-bold mr-1">₱</span>
                    Fixed
                  </button>
                  <button
                    onClick={() => setPaymentInfo(prev => ({ ...prev, discountType: 'percent' }))}
                    className={`flex-1 py-1.5 px-2 text-xs sm:text-sm rounded font-alice ${
                      paymentInfo.discountType === 'percent'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105] hover:bg-gray-200'
                    }`}
                  >
                    <Percent className="w-3 h-3 inline mr-1" />
                    Percent
                  </button>
                </div>
                <input
                  type="number"
                  placeholder={paymentInfo.discountType === 'percent' ? 'Discount %' : 'Discount Amount'}
                  value={paymentInfo.discountValue || ''}
                  onChange={(e) => setPaymentInfo(prev => ({ ...prev, discountValue: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handlePayment}
                disabled={cart.length === 0}
                className="w-full mt-3 sm:mt-4 bg-[#860809] text-white py-2.5 sm:py-3 px-4 rounded-lg text-sm sm:text-base font-semibold hover:bg-[#a31f17] active:bg-[#a31f17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-alice"
              >
                <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
                Process Payment
              </button>
            </div>
          </div>
        </div>

        {/* Product Not Found Modal */}
        {showProductNotFoundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-sm"
            >
              <div className="text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-3 sm:mb-4 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-[#860809] mb-2 font-libre">
                  Product Not Found
                </h3>
                <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 font-alice">
                  The scanned barcode does not match any product in our system.
                </p>
                <button
                  onClick={() => setShowProductNotFoundModal(false)}
                  className="w-full py-2.5 sm:py-3 px-4 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors font-alice"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Method Modal */}
        {showPaymentMethodModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md"
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#860809] mb-3 sm:mb-4 font-libre">
                Payment Method
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => handlePaymentMethodSelect('cash')}
                  className="w-full p-2.5 sm:p-3 rounded-lg border-2 border-gray-300 hover:border-[#860809] text-[#030105] transition-colors font-alice"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-bold text-[#860809]">₱</span>
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-medium">Cash</div>
                      <div className="text-xs sm:text-sm opacity-75">Customer info optional</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handlePaymentMethodSelect('online')}
                  className="w-full p-2.5 sm:p-3 rounded-lg border-2 border-gray-300 hover:border-[#860809] text-[#030105] transition-colors font-alice"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-medium">Online Payment</div>
                      <div className="text-xs sm:text-sm opacity-75">GCash / PayMaya</div>
                    </div>
                  </div>
                </button>
                
                <button
                  onClick={() => handlePaymentMethodSelect('bank')}
                  className="w-full p-2.5 sm:p-3 rounded-lg border-2 border-gray-300 hover:border-[#860809] text-[#030105] transition-colors font-alice"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <div className="text-left">
                      <div className="text-sm sm:text-base font-medium">Bank Transfer</div>
                      <div className="text-xs sm:text-sm opacity-75">Info required</div>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => setShowPaymentMethodModal(false)}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-[#860809] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-alice"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Customer Info Modal */}
        {showCustomerInfoModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#860809] mb-3 sm:mb-4 font-libre">
                Customer Info
                {paymentMethod !== 'cash' && (
                  <span className="text-xs sm:text-sm text-red-600 font-normal font-alice ml-2">(Required)</span>
                )}
              </h3>
              
              <div className="space-y-2 sm:space-y-3">
                <input
                  type="text"
                  placeholder={paymentMethod === 'cash' ? "Customer Name (Optional)" : "Customer Name (Required)"}
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice ${
                    paymentMethod !== 'cash' && !customerInfo.name.trim() 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                />
                <input
                  type="tel"
                  placeholder={paymentMethod === 'cash' ? "Phone Number (Optional)" : "Phone Number (Required)"}
                  value={customerInfo.phone}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                  className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice ${
                    paymentMethod !== 'cash' && !customerInfo.phone.trim() 
                      ? 'border-red-300' 
                      : 'border-gray-300'
                  }`}
                />
                <input
                  type="email"
                  placeholder="Email (Optional)"
                  value={customerInfo.email}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                />
                {(paymentMethod === 'online' || paymentMethod === 'bank') && (
                  <input
                    type="text"
                    placeholder="Reference Number (Required)"
                    value={customerInfo.referenceNumber}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className={`w-full px-3 py-2 text-sm sm:text-base border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice ${
                      !customerInfo.referenceNumber.trim() 
                        ? 'border-red-300' 
                        : 'border-gray-300'
                    }`}
                  />
                )}
              </div>

              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowCustomerInfoModal(false);
                    setShowPaymentMethodModal(true);
                  }}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-[#860809] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-alice"
                >
                  Back
                </button>
                <button
                  onClick={handleCustomerInfoSubmit}
                  className="flex-1 py-2 px-4 text-sm sm:text-base bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors font-alice"
                >
                  Continue
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md"
            >
              <h3 className="text-lg sm:text-xl font-bold text-[#860809] mb-3 sm:mb-4 font-libre">
                {paymentMethod === 'cash' ? 'Cash Payment' : 
                 paymentMethod === 'online' ? 'Online Payment' : 'Bank Transfer'}
              </h3>
              
              <div className="space-y-3 sm:space-y-4">
                <div className="text-center">
                  <p className="text-xl sm:text-2xl font-bold text-[#860809] font-libre">
                    {formatCurrency(paymentInfo.total)}
                  </p>
                  <p className="text-sm sm:text-base text-[#a48674] font-alice">Amount to be paid</p>
                </div>

                {paymentMethod === 'cash' ? (
                  <>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-[#860809] mb-2 font-alice">
                        Cash Received
                      </label>
                      <input
                        type="number"
                        value={paymentInfo.cashReceived || ''}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cashReceived: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 text-base sm:text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                        placeholder="0.00"
                      />
                    </div>

                    {paymentInfo.cashReceived > 0 && (
                      <div className="text-center p-3 bg-[#f8f3ed] rounded-lg">
                        <p className="text-xs sm:text-sm text-[#a48674] font-alice">Change</p>
                        <p className="text-lg sm:text-xl font-bold text-[#860809] font-libre">
                          {formatCurrency(paymentInfo.change)}
                        </p>
                      </div>
                    )}

                    {paymentInfo.cashReceived < paymentInfo.total && paymentInfo.cashReceived > 0 && (
                      <div className="flex items-center gap-2 text-red-600 text-xs sm:text-sm font-alice">
                        <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Insufficient cash received</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-3 sm:p-4 bg-[#f8f3ed] rounded-lg">
                    <div className="mb-3">
                      <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-[#860809] mx-auto mb-2" />
                      <p className="text-xs sm:text-sm text-[#a48674] mb-2 font-alice">
                        {paymentMethod === 'online' 
                          ? 'Customer will pay via GCash or PayMaya' 
                          : 'Customer will pay via Bank Transfer'}
                      </p>
                    </div>
                    <div className="text-xs sm:text-sm text-[#030105] space-y-1 font-alice">
                      <p><strong>Customer:</strong> {customerInfo.name}</p>
                      <p><strong>Phone:</strong> {customerInfo.phone}</p>
                      <p><strong>Reference:</strong> {customerInfo.referenceNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={() => {
                    setShowPaymentModal(false);
                    setShowCustomerInfoModal(true);
                  }}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-[#860809] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-alice"
                >
                  Back
                </button>
                <button
                  onClick={processPayment}
                  disabled={
                    (paymentMethod === 'cash' && paymentInfo.cashReceived < paymentInfo.total) || 
                    transactionLoading
                  }
                  className="flex-1 py-2 px-4 text-sm sm:text-base bg-[#a31f17] text-white rounded-lg hover:bg-[#860809] active:bg-[#860809] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-alice"
                >
                  {transactionLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    'Complete Payment'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Receipt Modal */}
        {showReceipt && currentTransaction && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md"
            >
              <div className="text-center mb-4 sm:mb-6">
                <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-[#860809] mx-auto mb-2" />
                <h3 className="text-lg sm:text-xl font-bold text-[#860809] font-libre">Transaction Complete</h3>
                <p className="text-xs sm:text-sm text-[#a48674] font-alice break-all">Transaction ID: {currentTransaction.id}</p>
              </div>

              <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm font-alice">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span className="text-right">{currentTransaction.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span className="text-right">{currentTransaction.cashier}</span>
                </div>
                {currentTransaction.customer.name && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span className="text-right">{currentTransaction.customer.name}</span>
                  </div>
                )}
                <hr className="border-gray-300" />
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize text-right">{currentTransaction.payment.method || 'cash'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span className="text-right">{formatCurrency(currentTransaction.payment.total)}</span>
                </div>
                {currentTransaction.payment.method === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash Received:</span>
                      <span className="text-right">{formatCurrency(currentTransaction.payment.cashReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className="text-right">{formatCurrency(currentTransaction.payment.change)}</span>
                    </div>
                  </>
                )}
                {(currentTransaction.payment.method === 'online' || currentTransaction.payment.method === 'bank') && (
                  <div className="flex justify-between">
                    <span>Reference Number:</span>
                    <span className="text-right break-all">{currentTransaction.customer.referenceNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-[#860809] rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-alice"
                >
                  <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  Print Receipt
                </button>
                <button
                  onClick={completeTransaction}
                  className="flex-1 py-2 px-4 text-sm sm:text-base bg-[#a31f17] text-white rounded-lg hover:bg-[#860809] active:bg-[#860809] transition-colors flex items-center justify-center gap-2 font-alice"
                >
                  <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  New Sale
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Weight Selection Modal */}
        {showWeightModal && selectedProduct && !selectedWeightOption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#860809] font-libre">Select Weight Option</h3>
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setSelectedProduct(null);
                    setSelectedWeightOption(null);
                    setQuantityInput(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="mb-3 sm:mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1 font-alice">Product: <span className="font-medium">{selectedProduct.name}</span></p>
                <p className="text-xs sm:text-sm text-gray-600 font-alice">Base Price: {formatCurrency(selectedProduct.basePricePerKg || 0)} per kg</p>
              </div>
              
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {selectedProduct.weightOptions?.map((option) => {
                  const price = option.price || (selectedProduct.basePricePerKg * option.weightKg);
                  return (
                    <button
                      key={option._id}
                      onClick={() => {
                        setSelectedWeightOption(option);
                        setQuantityInput(1);
                      }}
                      disabled={option.stockUnits <= 0}
                      className={`w-full p-3 sm:p-4 rounded-lg border-2 text-left transition-colors font-alice ${
                        option.stockUnits <= 0
                          ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-[#860809] hover:bg-[#f8f3ed] active:bg-[#f8f3ed]'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm sm:text-base font-medium text-[#030105]">
                            {option.weightKg} kg
                          </div>
                          <div className="text-xs sm:text-sm text-gray-600">
                            Stock: {option.stockUnits} units
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-base font-semibold text-[#860809]">
                            {formatCurrency(price)}
                          </div>
                          <div className="text-xs text-gray-500">
                            per unit
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              <div className="flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setSelectedProduct(null);
                    setSelectedWeightOption(null);
                    setQuantityInput(1);
                  }}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-alice"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Quantity Input Modal */}
        {showWeightModal && selectedProduct && selectedWeightOption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-lg p-4 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="text-base sm:text-lg font-semibold text-[#860809] font-libre">Enter Quantity</h3>
                <button
                  onClick={() => {
                    setShowWeightModal(false);
                    setSelectedProduct(null);
                    setSelectedWeightOption(null);
                    setQuantityInput(1);
                  }}
                  className="text-gray-400 hover:text-gray-600 active:text-gray-800"
                >
                  <X size={18} className="sm:w-5 sm:h-5" />
                </button>
              </div>
              
              <div className="mb-3 sm:mb-4 space-y-1">
                <p className="text-xs sm:text-sm text-gray-600 font-alice">Product: <span className="font-medium">{selectedProduct.name}</span></p>
                <p className="text-xs sm:text-sm text-gray-600 font-alice">Weight: <span className="font-medium">{selectedWeightOption.weightKg} kg</span></p>
                <p className="text-xs sm:text-sm text-gray-600 font-alice">Available Stock: <span className="font-medium">{selectedWeightOption.stockUnits} units</span></p>
                <p className="text-xs sm:text-sm text-gray-600 font-alice">Price: <span className="font-medium">{formatCurrency(selectedWeightOption.price || (selectedProduct.basePricePerKg * selectedWeightOption.weightKg))} per unit</span></p>
              </div>
              
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 font-alice">
                  Quantity to Add:
                </label>
                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => setQuantityInput(Math.max(0, quantityInput - 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#860809] text-white hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors flex items-center justify-center font-alice"
                  >
                    <Minus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={selectedWeightOption.stockUnits}
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(Math.max(0, Math.min(selectedWeightOption.stockUnits, parseInt(e.target.value) || 0)))}
                    className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-center"
                  />
                  <button
                    onClick={() => setQuantityInput(Math.min(selectedWeightOption.stockUnits, quantityInput + 1))}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#860809] text-white hover:bg-[#a31f17] active:bg-[#a31f17] transition-colors flex items-center justify-center font-alice"
                  >
                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1.5 sm:mt-2 font-alice">
                  Total: {formatCurrency((selectedWeightOption.price || (selectedProduct.basePricePerKg * selectedWeightOption.weightKg)) * quantityInput)}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setSelectedWeightOption(null);
                    setQuantityInput(1);
                  }}
                  className="flex-1 py-2 px-4 text-sm sm:text-base border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors font-alice"
                >
                  Back
                </button>
                <button
                  onClick={() => {
                    if (quantityInput > 0) {
                      // Add multiple quantities to cart
                      for (let i = 0; i < quantityInput; i++) {
                        addProductToCart(selectedProduct, selectedWeightOption);
                      }
                    }
                    setShowWeightModal(false);
                    setSelectedProduct(null);
                    setSelectedWeightOption(null);
                    setQuantityInput(1);
                  }}
                  disabled={quantityInput === 0}
                  className="flex-1 py-2 px-4 text-sm sm:text-base bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] active:bg-[#a31f17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-alice"
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </div>
        )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default POSPage;
