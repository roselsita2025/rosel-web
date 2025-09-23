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

  // Categories
  const categories = ['pork', 'beef', 'chicken', 'sliced', 'processed', 'ground'];

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
        
        // Format the scanned code to match expected barcode format (ABCabc1234 -> ABC-abc-1234)
        let formattedCode = code;
        if (code.length >= 9 && /^[A-Za-z0-9]+$/.test(code)) {
          formattedCode = code.slice(0, 3) + '-' + code.slice(3, 6) + '-' + code.slice(6);
        }
        
        setLastScannedCode(formattedCode);
        setScanError('');
        
        // Find and add product to cart
        const product = await productStore.getState().fetchProductByBarcode(formattedCode);
        if (product) {
          addToCart(product);
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
    const product = await productStore.getState().fetchProductByBarcode(code);
    if (product) {
      addToCart(product);
      // Stop camera after successful scan
      if (scanMode === 'camera') {
        stopCameraScan();
      }
    } else {
      setScanError('Product not found');
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
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.12; // 12% VAT
    let discount = 0;
    
    if (paymentInfo.discountType === 'percent') {
      discount = subtotal * (paymentInfo.discountValue / 100);
    } else {
      discount = paymentInfo.discountValue;
    }
    
    const total = subtotal + tax - discount;
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
    return matchesSearch && matchesCategory && product.status === 'available' && product.quantity > 0;
  }) || [];

  // Cart functions
  const addToCart = (product) => {
    setCartError(''); // Clear any previous errors
    
    setCart(prev => {
      const existingItem = prev.find(item => item._id === product._id);
      if (existingItem) {
        const maxStock = existingItem.stockQuantity || product.quantity;
        if (existingItem.quantity < maxStock) {
          // Show added to cart feedback
          setAddedToCart(product._id);
          setTimeout(() => setAddedToCart(null), 1000);
          
          return prev.map(item =>
            item._id === product._id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          // Show error when trying to exceed stock
          setCartError(`Cannot add more ${product.name}. Only ${maxStock} items available in stock.`);
          return prev;
        }
      } else {
        if (product.quantity > 0) {
          // Show added to cart feedback
          setAddedToCart(product._id);
          setTimeout(() => setAddedToCart(null), 1000);
          
          return [...prev, { ...product, quantity: 1, stockQuantity: product.quantity }];
        } else {
          // Show error when product is out of stock
          setCartError(`${product.name} is out of stock.`);
          return prev;
        }
      }
    });
  };

  const updateQuantity = (productId, newQuantity) => {
    setCartError(''); // Clear any previous errors
    
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item._id === productId) {
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

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item._id !== productId));
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
  };

  // Payment functions
  const handlePayment = () => {
    if (cart.length === 0) return;
    
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
        price: item.price,
        quantity: item.quantity,
        total: item.price * item.quantity
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
    console.log('Transaction completed:', currentTransaction);
    clearCart();
    setShowReceipt(false);
    setCurrentTransaction(null);
    
    // Refresh products to get updated stock counts
    refreshProducts();
  };

  return (
    <AdminLayout>
      <div className="p-6 bg-[#f8f3ed] min-h-screen">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-[#860809] font-libre">Point of Sale</h1>
            <Link
              to="/pos/history"
              className="flex items-center gap-2 px-4 py-2 bg-[#a31f17] text-white rounded-lg hover:bg-[#860809] transition-colors font-alice"
            >
              <History className="w-4 h-4" />
              Transaction History
            </Link>
          </div>
            <p className="text-[#a31f17] font-alice">Process cash transactions and manage sales</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Product Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search and Filters */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#a31f17] w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search products by name or barcode..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                  />
                </div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category} className="capitalize">
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Barcode Scanner */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <h3 className="text-lg font-semibold text-[#860809] mb-4 flex items-center gap-2 font-libre">
                <ScanLine className="w-5 h-5" />
                Barcode Scanner
              </h3>
              
              <div className="space-y-4">
                {/* Scanner Mode Selection */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setScanMode('usb')}
                    className={`flex-1 py-2 px-4 text-sm rounded-lg font-medium transition-colors font-alice ${
                      scanMode === 'usb'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105] hover:bg-[#a31f17] hover:text-white'
                    }`}
                  >
                    <Hash className="w-4 h-4 inline mr-2" />
                    USB Scanner
                  </button>
                  <button
                    onClick={() => setScanMode('camera')}
                    className={`flex-1 py-2 px-4 text-sm rounded-lg font-medium transition-colors font-alice ${
                      scanMode === 'camera'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105] hover:bg-[#a31f17] hover:text-white'
                    }`}
                  >
                    <Camera className="w-4 h-4 inline mr-2" />
                    Camera
                  </button>
                </div>

                {/* USB Scanner Info */}
                {scanMode === 'usb' && (
                  <div className="bg-[#f8f3ed] border border-gray-300 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-[#860809]" />
                      <span className="text-sm font-medium text-[#860809] font-alice">USB Scanner Ready</span>
                    </div>
                    <p className="text-xs text-[#a31f17] mb-2 font-libre">
                      Connect your USB barcode scanner and scan products directly. The scanner will automatically add items to cart.
                    </p>
                    {lastScannedCode && (
                      <div className="text-xs text-[#860809] font-alice">
                        Last scanned: <span className="font-mono bg-white px-2 py-1 rounded">{lastScannedCode}</span>
                      </div>
                    )}
                    {scanError && (
                      <div className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {scanError}
                      </div>
                    )}
                  </div>
                )}

                {/* Camera Scanner */}
                {scanMode === 'camera' && (
                  <div className="bg-[#f8f3ed] border border-gray-300 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#860809]" />
                        <span className="text-sm font-medium text-[#860809] font-alice">Camera Scanner</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={startCameraScan}
                          disabled={isScanning}
                          className="px-3 py-1 bg-[#860809] text-white text-xs rounded hover:bg-[#a31f17] disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-1 font-alice"
                        >
                          <ScanLine className="w-3 h-3" />
                          {isScanning ? 'Scanning...' : 'Start'}
                        </button>
                        <button
                          onClick={stopCameraScan}
                          disabled={!isScanning}
                          className="px-3 py-1 bg-[#a31f17] text-white text-xs rounded hover:bg-[#8a1a14] disabled:bg-gray-400 disabled:cursor-not-allowed font-alice"
                        >
                          Stop
                        </button>
                      </div>
                    </div>
                    
                    {isScanning && (
                      <div className="mb-3">
                        <video 
                          id="pos-scan-video" 
                          style={{ width: '100%', maxWidth: '300px', height: '200px' }} 
                          muted 
                          playsInline 
                          className="rounded border border-[#f7e9b8]"
                        />
                      </div>
                    )}
                    
                    {lastScannedCode && (
                      <div className="text-xs text-[#860809] mb-2">
                        Last scanned: <span className="font-mono bg-white px-2 py-1 rounded">{lastScannedCode}</span>
                      </div>
                    )}
                    
                    {scanError && (
                      <div className="text-xs text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {scanError}
                      </div>
                    )}
                    
                    <p className="text-xs text-[#a48674] mt-2">
                      Position the barcode in front of the camera. The scanner will automatically detect and add items to cart.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Products Grid */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <h3 className="text-lg font-semibold text-[#860809] mb-4 font-libre">Products</h3>
              {productsLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className="animate-pulse">
                      <div className="bg-gray-200 h-32 rounded-lg mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-[600px] overflow-y-auto">
                  {filteredProducts.map(product => (
                    <motion.div
                      key={product._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`border border-gray-300 rounded-lg p-3 cursor-pointer hover:shadow-md transition-shadow relative ${
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
                            <Check className="w-8 h-8 mx-auto mb-1" />
                            <p className="text-sm font-medium">Added to cart</p>
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="aspect-square mb-2 overflow-hidden rounded-lg">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h4 className="font-medium text-sm text-[#030105] line-clamp-2 mb-1 font-alice">
                        {product.name}
                      </h4>
                      <p className="text-xs text-[#a31f17] capitalize mb-2 font-libre">
                        {product.category}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#860809] font-libre">
                          ₱{product.price.toFixed(2)}
                        </span>
                        <span className="text-xs text-[#a31f17] font-alice">
                          Stock: {product.quantity}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Cart and Checkout */}
          <div className="space-y-6">
            {/* Cart */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[#860809] flex items-center gap-2 font-libre">
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({cart.length})
                </h3>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                  >
                    <Trash2 className="w-4 h-4" />
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
                  className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="text-sm text-red-700">{cartError || transactionError}</span>
                  <button
                    onClick={() => {
                      setCartError('');
                      usePOSStore.getState().clearError();
                    }}
                    className="ml-auto text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              )}

              {cart.length === 0 ? (
                <div className="text-center py-8 text-[#a31f17]">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Cart is empty</p>
                  <p className="text-sm font-alice">Add products to get started</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {cart.map(item => (
                    <div key={item._id} className="flex items-center gap-3 p-2 border border-gray-300 rounded-lg">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-[#030105] line-clamp-1 font-alice">
                          {item.name}
                        </h4>
                        <p className="text-xs text-[#a31f17] font-libre">
                          ₱{item.price.toFixed(2)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity - 1)}
                          className="w-6 h-6 rounded-full bg-[#f8f3ed] flex items-center justify-center hover:bg-[#860809] hover:text-white transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium font-alice">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item._id, item.quantity + 1)}
                          className="w-6 h-6 rounded-full bg-[#f8f3ed] flex items-center justify-center hover:bg-[#860809] hover:text-white transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-[#860809]">
                          ₱{(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button
                          onClick={() => removeFromCart(item._id)}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <h3 className="text-lg font-semibold text-[#860809] mb-4 flex items-center gap-2 font-libre">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 transition-colors font-alice ${
                      paymentMethod === 'cash'
                        ? 'border-[#860809] bg-[#f8f3ed] text-[#860809]'
                        : 'border-gray-300 hover:border-[#860809] text-[#030105]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-[#860809]">₱</span>
                      <div className="text-left">
                        <div className="font-medium">Cash</div>
                        <div className="text-sm opacity-75">Customer info optional</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('online')}
                    className={`p-3 rounded-lg border-2 transition-colors font-alice ${
                      paymentMethod === 'online'
                        ? 'border-[#860809] bg-[#f8f3ed] text-[#860809]'
                        : 'border-gray-300 hover:border-[#860809] text-[#030105]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Online Payment</div>
                        <div className="text-sm opacity-75">GCash / PayMaya - Customer info required</div>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => setPaymentMethod('bank')}
                    className={`p-3 rounded-lg border-2 transition-colors font-alice ${
                      paymentMethod === 'bank'
                        ? 'border-[#860809] bg-[#f8f3ed] text-[#860809]'
                        : 'border-gray-300 hover:border-[#860809] text-[#030105]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-5 h-5" />
                      <div className="text-left">
                        <div className="font-medium">Bank Transfer</div>
                        <div className="text-sm opacity-75">Customer info required</div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <h3 className="text-lg font-semibold text-[#860809] mb-4 flex items-center gap-2 font-libre">
                <User className="w-5 h-5" />
                Customer Info
                {paymentMethod !== 'cash' && (
                  <span className="text-sm text-red-600 font-normal font-alice">(Required)</span>
                )}
              </h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder={paymentMethod === 'cash' ? "Customer Name (Optional)" : "Customer Name (Required)"}
                  value={customerInfo.name}
                  onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice ${
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice ${
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
                  className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:border-transparent"
                />
                {(paymentMethod === 'online' || paymentMethod === 'bank') && (
                  <input
                    type="text"
                    placeholder="Reference Number (Required)"
                    value={customerInfo.referenceNumber}
                    onChange={(e) => setCustomerInfo(prev => ({ ...prev, referenceNumber: e.target.value }))}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:border-transparent ${
                      !customerInfo.referenceNumber.trim() 
                        ? 'border-red-300' 
                        : 'border-[#f7e9b8]'
                    }`}
                  />
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#fffefc] rounded-lg shadow-md border border-gray-300 p-4">
              <h3 className="text-lg font-semibold text-[#860809] mb-4 flex items-center gap-2 font-libre">
                <Calculator className="w-5 h-5" />
                Order Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#a31f17] font-alice">Subtotal:</span>
                  <span className="font-medium font-libre">₱{paymentInfo.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a31f17] font-alice">Tax (12%):</span>
                  <span className="font-medium font-libre">₱{paymentInfo.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#a31f17] font-alice">Discount:</span>
                  <span className="font-medium text-green-600 font-libre">-₱{paymentInfo.discount.toFixed(2)}</span>
                </div>
                <hr className="border-gray-300" />
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-[#860809] font-libre">Total:</span>
                  <span className="text-[#860809] font-libre">₱{paymentInfo.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Discount Controls */}
              <div className="mt-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={() => setPaymentInfo(prev => ({ ...prev, discountType: 'fixed' }))}
                    className={`flex-1 py-1 px-2 text-xs rounded font-alice ${
                      paymentInfo.discountType === 'fixed'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105]'
                    }`}
                  >
                    <span className="text-sm font-bold mr-1">₱</span>
                    Fixed
                  </button>
                  <button
                    onClick={() => setPaymentInfo(prev => ({ ...prev, discountType: 'percent' }))}
                    className={`flex-1 py-1 px-2 text-xs rounded font-alice ${
                      paymentInfo.discountType === 'percent'
                        ? 'bg-[#860809] text-white'
                        : 'bg-[#f8f3ed] text-[#030105]'
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
                  className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:border-transparent"
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={handlePayment}
                disabled={cart.length === 0}
                className="w-full mt-4 bg-[#860809] text-white py-3 px-4 rounded-lg font-semibold hover:bg-[#a31f17] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-alice"
              >
                <CreditCard className="w-5 h-5" />
                Process Payment
              </button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-xl font-bold text-[#860809] mb-4">
                {paymentMethod === 'cash' ? 'Cash Payment' : 
                 paymentMethod === 'online' ? 'Online Payment' : 'Bank Transfer'}
              </h3>
              
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#860809]">
                    ₱{paymentInfo.total.toFixed(2)}
                  </p>
                  <p className="text-[#a48674]">Amount to be paid</p>
                </div>

                {paymentMethod === 'cash' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-[#860809] mb-2">
                        Cash Received
                      </label>
                      <input
                        type="number"
                        value={paymentInfo.cashReceived || ''}
                        onChange={(e) => setPaymentInfo(prev => ({ ...prev, cashReceived: parseFloat(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-[#f7e9b8] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:border-transparent text-lg"
                        placeholder="0.00"
                      />
                    </div>

                    {paymentInfo.cashReceived > 0 && (
                      <div className="text-center p-3 bg-[#f8f3ed] rounded-lg">
                        <p className="text-sm text-[#a48674]">Change</p>
                        <p className="text-xl font-bold text-[#860809]">
                          ₱{paymentInfo.change.toFixed(2)}
                        </p>
                      </div>
                    )}

                    {paymentInfo.cashReceived < paymentInfo.total && paymentInfo.cashReceived > 0 && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        <span>Insufficient cash received</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 bg-[#f8f3ed] rounded-lg">
                    <div className="mb-3">
                      <CreditCard className="w-8 h-8 text-[#860809] mx-auto mb-2" />
                      <p className="text-sm text-[#a48674] mb-2">
                        {paymentMethod === 'online' 
                          ? 'Customer will pay via GCash or PayMaya' 
                          : 'Customer will pay via Bank Transfer'}
                      </p>
                    </div>
                    <div className="text-sm text-[#030105]">
                      <p><strong>Customer:</strong> {customerInfo.name}</p>
                      <p><strong>Phone:</strong> {customerInfo.phone}</p>
                      <p><strong>Reference:</strong> {customerInfo.referenceNumber}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 py-2 px-4 border border-[#f7e9b8] text-[#860809] rounded-lg hover:bg-[#f7e9b8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={processPayment}
                  disabled={
                    (paymentMethod === 'cash' && paymentInfo.cashReceived < paymentInfo.total) || 
                    transactionLoading
                  }
                  className="flex-1 py-2 px-4 bg-[#a31f17] text-white rounded-lg hover:bg-[#860809] disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {transactionLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Processing...
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            >
              <div className="text-center mb-6">
                <Receipt className="w-12 h-12 text-[#860809] mx-auto mb-2" />
                <h3 className="text-xl font-bold text-[#860809]">Transaction Complete</h3>
                <p className="text-[#a48674]">Transaction ID: {currentTransaction.id}</p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>Date:</span>
                  <span>{currentTransaction.timestamp.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cashier:</span>
                  <span>{currentTransaction.cashier}</span>
                </div>
                {currentTransaction.customer.name && (
                  <div className="flex justify-between">
                    <span>Customer:</span>
                    <span>{currentTransaction.customer.name}</span>
                  </div>
                )}
                <hr className="border-[#f7e9b8]" />
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="capitalize">{currentTransaction.payment.method || 'cash'}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Total:</span>
                  <span>₱{currentTransaction.payment.total.toFixed(2)}</span>
                </div>
                {currentTransaction.payment.method === 'cash' && (
                  <>
                    <div className="flex justify-between">
                      <span>Cash Received:</span>
                      <span>₱{currentTransaction.payment.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span>₱{currentTransaction.payment.change.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {(currentTransaction.payment.method === 'online' || currentTransaction.payment.method === 'bank') && (
                  <div className="flex justify-between">
                    <span>Reference Number:</span>
                    <span>{currentTransaction.customer.referenceNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowReceipt(false)}
                  className="flex-1 py-2 px-4 border border-[#f7e9b8] text-[#860809] rounded-lg hover:bg-[#f7e9b8] transition-colors"
                >
                  Print Receipt
                </button>
                <button
                  onClick={completeTransaction}
                  className="flex-1 py-2 px-4 bg-[#a31f17] text-white rounded-lg hover:bg-[#860809] transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  New Sale
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
