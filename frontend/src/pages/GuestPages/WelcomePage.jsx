import { LucideArrowRight, LucideChevronLeft, LucideChevronRight, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Footer from "../../components/Footer.jsx";
import { productStore } from "../../store/productStore.js";
import { cartStore } from "../../store/cartStore.js";
import { useReviewStore } from "../../store/reviewStore.js";
import { useAuthStore } from "../../store/authStore.js";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const WelcomePage = () => {
  const { fetchAllProducts, products, setProducts } = productStore();
  const [premiumProducts, setPremiumProducts] = useState([]);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const { addToCart } = cartStore();
  const { user } = useAuthStore();
  const { randomReviews, fetchRandomReviews, isLoading: reviewsLoading, stats, fetchStats } = useReviewStore();
  const [buttonStateById, setButtonStateById] = useState({}); // { [productId]: 'idle' | 'added' | 'maxed' }
  const [displayedReviews, setDisplayedReviews] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleAddToCart = async (product) => {
    if (!product) return;
    if (user?.role === 'admin') return;
    const result = await addToCart(product);
    setButtonStateById((prev) => ({ ...prev, [product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle' }));
    setTimeout(() => {
      setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
    }, 1500);
  };

  useEffect(() => {
    const loadProducts = async () => {
      // Always fetch fresh products for the welcome page
      try {
        const response = await axios.get(`${API_URL}/products/all`);
        if (response.data?.products) {
          setProducts(response.data.products);
        }
      } catch (error) {
        // Fallback to featured products if unauthorized
        if (error.response?.status === 401 || error.response?.status === 403) {
          try {
            const featuredResponse = await axios.get(`${API_URL}/products/featured`);
            setProducts(featuredResponse.data);
          } catch (featuredError) {
            console.error('Error fetching featured products:', featuredError);
          }
        }
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    if (products && products.length > 0) {
      // Sort products by price in descending order and take the top 5
      const sortedProducts = [...products]
        .filter(product => product.status === 'available' && product.quantity > 0)
        .sort((a, b) => b.price - a.price)
        .slice(0, 5);
      setPremiumProducts(sortedProducts);
    }
  }, [products]);

  // Fetch random reviews and stats on component mount
  useEffect(() => {
    const loadReviewsAndStats = async () => {
      try {
        await Promise.all([
          fetchRandomReviews(3),
          fetchStats()
        ]);
      } catch (error) {
        console.error('Error loading reviews and stats:', error);
      }
    };
    loadReviewsAndStats();
  }, [fetchRandomReviews, fetchStats]);

  // Set initial displayed reviews - all random content
  useEffect(() => {
    if (randomReviews.length > 0) {
      // All cards show random content
      setDisplayedReviews(randomReviews);
    }
  }, [randomReviews]);

  // Auto-refresh all cards with fade effect every 60 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Start fade out
        setIsRefreshing(true);
        
        // Wait for fade out to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Fetch 3 new random reviews for all cards
        await fetchRandomReviews(3);
        
        // Wait a bit for data to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Start fade in
        setIsRefreshing(false);
      } catch (error) {
        console.error('Error refreshing random reviews:', error);
        setIsRefreshing(false);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchRandomReviews]);

  const nextProduct = () => {
    setCurrentProductIndex((prev) => (prev + 1) % premiumProducts.length);
  };

  const prevProduct = () => {
    setCurrentProductIndex((prev) => (prev - 1 + premiumProducts.length) % premiumProducts.length);
  };

  return (
    <div className="w-full relative z-10">
      {/* Hero Section */}
      <motion.section
        className="flex min-h-[80vh] md:h-screen relative px-4 pt-24 pb-4 lg:pt-24 lg:py-12"
        style={{
          backgroundImage: `
            linear-gradient(135deg,rgba(144, 20, 20, 0.5),rgba(255, 217, 1, 0.5)),
            url('/herobg.jpg')
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="w-full max-w-8xl px-4 mx-auto flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-12 ">
          {/* Left Side - Content */}
          <motion.div 
            className="flex-1 flex flex-col justify-end items-center lg:items-start text-center lg:text-left h-full pb-0 lg:pb-2"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <div className="mt-auto">
              <motion.h2 
                className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-semibold text-[#ffd901] mb-4 font-magnolia"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                Delivered Fresh
              </motion.h2>
              <motion.h1 
                className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#fffefc] leading-tight mb-6 font-cinzel"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Premium Quality Frozen Meats
              </motion.h1>
              <motion.div 
                className="flex flex-col md:flex-row gap-4 w-full md:w-auto justify-center md:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Link to="/login" className="w-full md:w-auto bg-[#ffd901] font-semibold text-[#030105] py-3 px-6 rounded-xl transition-transform hover:scale-105 hover:bg-[#ffe23d] flex items-center justify-center gap-2 shadow-md font-alice">
                  Get Started Today <LucideArrowRight className="w-5 h-5" />
                </Link>
                <Link to="/products" className="w-full md:w-auto bg-[#860809] border border-[#860809] font-semibold text-[#fffefc] py-3 px-6 rounded-xl transition-transform hover:scale-105 hover:bg-[#a31f17] flex items-center justify-center shadow-md font-alice">
                  Explore Products
                </Link>
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Hero Image */}
          <motion.div 
            className="flex-1 flex items-center justify-center pt-0 lg:pt-24"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl relative">
              <motion.div 
                className="aspect-square rounded-2xl overflow-hidden relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.7 }}
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <img 
                    src="/wpheropic.png" 
                    alt="Rosel Frozen Meats - Premium Quality" 
                    className="relative w-full h-full object-cover z-10"
                  />
                </div>
              </motion.div>
              {/* Overflowing glow effect */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.5 }}
                transition={{ duration: 1, delay: 1 }}
              >
                <div className="w-full h-full rounded-full bg-[#ffd901] blur-3xl scale-105 sm:scale-110" />
              </motion.div>
            </div>
          </motion.div>
        </div>
      </motion.section>


      {/* Premium Selection Section */}
      <motion.section 
        className="pt-8 pb-16 sm:py-16 lg:pt-12 lg:pb-16 bg-white text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.p 
          className="text-xl text-[#901414] font-semibold mt-4 max-w-2xl mx-auto font-libre"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Choose your premium meat products.
        </motion.p>
        <motion.h2 
          className="text-5xl font-bold text-[#030105] mb-4 lg:mb-8 font-libre"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Our Best Selling Products
        </motion.h2>
        <div className="mt-8 max-w-7xl mx-auto px-4">
          {/* Desktop Grid View */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-6">
            {premiumProducts.length > 0 ? (
              premiumProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  className="bg-white p-4 rounded-lg group hover:shadow-xl hover:border-2 hover:border-[#901414] hover:bg-[#f8f3ed] hover:scale-110 hover:z-10 hover:rounded-2xl relative transition-all duration-300"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-[#030105] mb-2 line-clamp-2 font-alice">{product.name}</h3>
                  <div className="flex justify-center items-center mb-2">
                    <span className="text-xl text-[#901414] font-libre">₱{product.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-center items-center mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.quantity > 10 
                        ? 'bg-green-100 text-green-800' 
                        : product.quantity > 0 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(product)}
                    disabled={product.quantity === 0}
                    className={`w-full text-white py-2 px-4 rounded-lg transition-colors duration-300 font-semibold ${
                      product.quantity > 0
                        ? buttonStateById[product._id] === 'added'
                          ? 'bg-emerald-600'
                          : buttonStateById[product._id] === 'maxed'
                            ? 'bg-red-600'
                            : 'bg-[#901414] hover:bg-[#a31f17]'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {product.quantity > 0 
                      ? buttonStateById[product._id] === 'added' 
                        ? 'Product Added'
                        : buttonStateById[product._id] === 'maxed'
                          ? 'Maxed item'
                          : 'Add to Cart' 
                      : 'Out of Stock'}
                  </button>
                  <Link
                    to={`/product/${product._id}`}
                    className="block w-full text-center text-[#901414] py-2 px-4 rounded-lg hover:bg-[#f8f3ed] transition-colors duration-300 font-medium mt-2 opacity-0 group-hover:opacity-100 font-alice"
                  >
                    View Product
                  </Link>
                </motion.div>
              ))
            ) : (
              // Loading or placeholder cards
              Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="bg-white p-4 rounded-lg group hover:shadow-lg hover:bg-[#f8f3ed] transition-shadow duration-300 animate-pulse">
                  <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="flex justify-between mb-3">
                    <div className="h-5 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded opacity-0 group-hover:opacity-100"></div>
                </div>
              ))
            )}
          </div>

          {/* Mobile Carousel View */}
          <div className="md:hidden relative">
            {premiumProducts.length > 0 ? (
              <>
                <motion.div 
                  className="bg-white p-4 rounded-lg group hover:shadow-xl hover:border-2 hover:border-[#901414] hover:bg-[#f8f3ed] hover:scale-105 hover:z-10 hover:rounded-2xl relative transition-all duration-300"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <div className="aspect-square mb-4 overflow-hidden rounded-lg">
                    <img
                      src={premiumProducts[currentProductIndex]?.image}
                      alt={premiumProducts[currentProductIndex]?.name}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="text-lg font-bold text-[#030105] mb-2 line-clamp-2 font-alice">{premiumProducts[currentProductIndex]?.name}</h3>
                  <div className="flex justify-center items-center mb-2">
                    <span className="text-xl text-[#901414] font-libre">₱{premiumProducts[currentProductIndex]?.price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-center items-center mb-3">
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      premiumProducts[currentProductIndex]?.quantity > 10 
                        ? 'bg-green-100 text-green-800' 
                        : premiumProducts[currentProductIndex]?.quantity > 0 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {premiumProducts[currentProductIndex]?.quantity > 0 ? `${premiumProducts[currentProductIndex]?.quantity} in stock` : 'Out of stock'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleAddToCart(premiumProducts[currentProductIndex])}
                    disabled={premiumProducts[currentProductIndex]?.quantity === 0}
                    className={`w-full text-white py-2 px-4 rounded-lg transition-colors duration-300 font-semibold ${
                      (premiumProducts[currentProductIndex]?.quantity || 0) > 0
                        ? buttonStateById[premiumProducts[currentProductIndex]?._id] === 'added'
                          ? 'bg-emerald-600'
                          : buttonStateById[premiumProducts[currentProductIndex]?._id] === 'maxed'
                            ? 'bg-red-600'
                            : 'bg-[#901414] hover:bg-[#a31f17]'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {(premiumProducts[currentProductIndex]?.quantity || 0) > 0 
                      ? buttonStateById[premiumProducts[currentProductIndex]?._id] === 'added' 
                        ? 'Product Added'
                        : buttonStateById[premiumProducts[currentProductIndex]?._id] === 'maxed'
                          ? 'Maxed item'
                          : 'Add to Cart' 
                      : 'Out of Stock'}
                  </button>
                  <Link
                    to={`/product/${premiumProducts[currentProductIndex]?._id}`}
                    className="block w-full text-center text-[#901414] py-2 px-4 rounded-lg hover:bg-[#f8f3ed] transition-colors duration-300 font-medium mt-2 opacity-0 group-hover:opacity-100 font-alice"
                  >
                    View Product
                  </Link>
                </motion.div>
                
                {/* Navigation Arrows */}
                <motion.button
                  onClick={prevProduct}
                  className="absolute left-2 top-1/3 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-40"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <LucideChevronLeft className="w-6 h-6 text-[#901414]" />
                </motion.button>
                <motion.button
                  onClick={nextProduct}
                  className="absolute right-2 top-1/3 transform -translate-y-1/2 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg transition-all duration-300 z-40"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  viewport={{ once: true }}
                >
                  <LucideChevronRight className="w-6 h-6 text-[#901414]" />
                </motion.button>

                {/* Dots Indicator */}
                <motion.div 
                  className="flex justify-center mt-4 space-x-2"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  viewport={{ once: true }}
                >
                  {premiumProducts.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentProductIndex(index)}
                      className={`w-2 h-2 rounded-full transition-all duration-300 ${
                        index === currentProductIndex ? 'bg-[#901414]' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </motion.div>
              </>
            ) : (
              // Loading placeholder for mobile
              <div className="bg-white p-4 rounded-lg animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="flex justify-center mb-3">
                  <div className="h-5 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            )}
          </div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Link to="/products" className="mt-8 inline-block bg-[#901414] text-white py-3 px-6 rounded-lg hover:bg-[#a31f17] transition-colors duration-300 font-alice">
            View All Products
          </Link>
        </motion.div>
      </motion.section>

      {/* Customer Reviews Section */}
      <motion.section 
        className="py-16 bg-[#f8f3ed] text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="max-w-7xl mx-auto px-4">
          <motion.h2 
            className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#030105] mb-4 font-libre"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            What Our Customers Say
          </motion.h2>
          <motion.p 
            className="text-lg text-[#82695b] mb-12 max-w-2xl mx-auto font-alice"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            Don't just take our word for it. Here's what our satisfied customers have to say about their experience with Rosel Frozen Meats.
          </motion.p>

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {reviewsLoading ? (
              // Loading state
              Array.from({ length: 3 }).map((_, index) => (
                <motion.div
                  key={`loading-${index}`}
                  className="bg-white p-6 rounded-xl shadow-lg"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                >
                  <div className="animate-pulse">
                    <div className="flex items-center mb-4">
                      <div className="flex space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="h-4 bg-gray-300 rounded"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full mr-3"></div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-300 rounded w-24"></div>
                        <div className="h-3 bg-gray-300 rounded w-20"></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : displayedReviews.length > 0 ? (
              // All cards show random content with fade in/out effect
              <AnimatePresence>
                {displayedReviews.map((review, index) => (
                  <motion.div
                    key={`random-${review._id}`}
                    className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300"
                    initial={{ opacity: 0 }}
                    animate={{ 
                      opacity: isRefreshing ? 0 : 1
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ 
                      duration: 0.5,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="flex items-center mb-4">
                      <div className="flex text-[#ffd901]">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={20} 
                            className={i < review.rating ? "fill-current" : "text-gray-300"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-[#030105] mb-4 font-alice italic">
                      "{review.feedback}"
                    </p>
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-[#901414] rounded-full flex items-center justify-center text-white font-bold mr-3">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-[#030105] font-alice">{review.userName}</p>
                        <p className="text-sm text-[#82695b] font-libre">Verified Customer</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            ) : (
              // No reviews state - show "Leave Us Feedback" cards
              Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={`empty-${index}`}
                  className="bg-white p-6 rounded-xl shadow-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center"
                >
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Star className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2 font-libre">No Reviews Yet</h3>
                  <p className="text-gray-500 text-sm mb-4 font-alice">
                    Be the first to share your experience!
                  </p>
                  <Link
                    to="/ratings"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice text-sm"
                  >
                    Leave Us Feedback
                    <LucideArrowRight size={16} />
                  </Link>
                </div>
              ))
            )}
          </div>

          {/* Overall Rating */}
          <motion.div
            className="mt-12 bg-white rounded-xl p-8 shadow-lg max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center justify-center mb-4">
              <div className="flex text-[#ffd901] mr-4">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    size={24} 
                    className={i < Math.floor(stats?.averageRating || 0) ? "fill-current" : "text-gray-300"} 
                  />
                ))}
              </div>
              <span className="text-2xl font-bold text-[#030105] font-libre">
                {stats?.averageRating ? stats.averageRating.toFixed(1) : '0.0'}/5
              </span>
            </div>
            <p className="text-lg text-[#82695b] font-alice mb-2">
              Based on {stats?.totalReviews || 0} customer review{(stats?.totalReviews || 0) !== 1 ? 's' : ''}
            </p>
            <p className="text-sm text-[#82695b] font-libre mb-6">Trusted by thousands of satisfied customers across Metro Manila</p>
            
            {/* View Ratings Button */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
            >
              <Link
                to="/ratings"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#ffd901] text-[#030105] font-semibold rounded-lg hover:bg-[#ffe23d] transition-colors duration-300 font-alice shadow-md hover:shadow-lg"
              >
                View All Ratings
                <LucideArrowRight size={16} />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Call to Action Section */}
      <motion.section 
        className="py-16 bg-[#901414] text-center"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <motion.h2 
          className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#ffd901] max-w-xs sm:max-w-2xl lg:max-w-none mx-auto font-libre"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          viewport={{ once: true }}
        >
          Ready to Experience Premium Quality?
        </motion.h2>
        <motion.p 
          className="text-lg sm:text-xl text-[#fffefc] mt-4 max-w-xs sm:max-w-lg lg:max-w-2xl mx-auto font-libre"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
        >
          Join thousands of satisfied customers who trust us for their premium meat needs. Start your journey to exceptional quality today.
        </motion.p>
        <motion.div 
          className="mt-8 flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
        >
          <Link to="/products" className="bg-[#ffd901] font-semibold text-black py-3 px-6 rounded-xl transform transition-transform hover:scale-105 hover:bg-[#ffe23d] flex items-center gap-2 font-alice">Start Shopping Now <LucideArrowRight className="w-5 h-5" /></Link>
        </motion.div>
      </motion.section>

      <Footer />
    </div>
  );
}

export default WelcomePage;