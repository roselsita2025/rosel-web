import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { ArrowLeft, ShoppingCart, ChevronLeft, ChevronRight, Plus, Minus } from "lucide-react";
import ProductCard from '../../components/GuestComponents/ProductCard.jsx';
import { productStore } from '../../store/productStore.js';
import { cartStore } from '../../store/cartStore.js';
import { useAuthStore } from '../../store/authStore.js';
import Footer from '../../components/Footer.jsx';

const ProductDetailPage = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { fetchProductById, products } = productStore();
    const { addToCart } = cartStore();
    const { user } = useAuthStore();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [addingToCart, setAddingToCart] = useState(false);
    const [buttonState, setButtonState] = useState('idle'); // idle | added | maxed
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [selectedWeightOptionId, setSelectedWeightOptionId] = useState(null);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                setLoading(true);
                // Try to find product in existing products first
                const existingProduct = products.find(p => p._id === productId);
                if (existingProduct) {
                    setProduct(existingProduct);
                    // Auto-select the lowest weight option if available
                    if (existingProduct.hasWeightOptions && existingProduct.weightOptions && existingProduct.weightOptions.length > 0) {
                        const sortedOptions = [...existingProduct.weightOptions].sort((a, b) => a.weightKg - b.weightKg);
                        if (sortedOptions.length > 0) {
                            setSelectedWeightOptionId(sortedOptions[0]._id);
                        }
                    }
                } else {
                    // If not found, fetch from API
                    const fetchedProduct = await fetchProductById(productId);
                    if (fetchedProduct && fetchedProduct.hasWeightOptions && fetchedProduct.weightOptions && fetchedProduct.weightOptions.length > 0) {
                        const sortedOptions = [...fetchedProduct.weightOptions].sort((a, b) => a.weightKg - b.weightKg);
                        if (sortedOptions.length > 0) {
                            setSelectedWeightOptionId(sortedOptions[0]._id);
                        }
                    }
                }
            } catch (error) {
                console.error('Error loading product:', error);
            } finally {
                setLoading(false);
            }
        };

        if (productId) {
            loadProduct();
        }
    }, [productId, fetchProductById, products]);

    // Update product when products change (after API fetch)
    useEffect(() => {
        if (products && products.length > 0) {
            const foundProduct = products.find(p => p._id === productId);
            if (foundProduct) {
                setProduct(foundProduct);
                // Auto-select the lowest weight option if available
                if (foundProduct.hasWeightOptions && foundProduct.weightOptions && foundProduct.weightOptions.length > 0) {
                    const sortedOptions = [...foundProduct.weightOptions].sort((a, b) => a.weightKg - b.weightKg);
                    if (sortedOptions.length > 0) {
                        setSelectedWeightOptionId(sortedOptions[0]._id);
                    }
                }
            }
        }
    }, [products, productId]);

    // Get all images for the product
    const getAllImages = () => {
        if (!product) return [];
        const images = [];
        
        // Add main image if it exists
        if (product.image) {
            images.push(product.image);
        }
        
        // Add additional images from images array, avoiding duplicates
        if (product.images && product.images.length > 0) {
            product.images.forEach(image => {
                if (image && !images.includes(image)) {
                    images.push(image);
                }
            });
        }
        
        return images;
    };

    const images = getAllImages();
    const hasMultipleImages = images.length > 1;

    // Derived total stocks considering weight options
    const getTotalStocks = (p) => {
        if (!p) return 0;
        if (typeof p.totalStockUnits === 'number') return p.totalStockUnits;
        if (Array.isArray(p.weightOptions) && p.weightOptions.length > 0) {
            return p.weightOptions.reduce((sum, o) => sum + (o?.stockUnits || 0), 0);
        }
        return p.quantity || 0;
    };

    const totalStocks = getTotalStocks(product);

    // Available weight options (if any)
    const weightOptions = Array.isArray(product?.weightOptions) ? product.weightOptions : [];
    const selectedWeightOption = weightOptions.find(o => String(o._id) === String(selectedWeightOptionId)) || null;
    const selectedStock = selectedWeightOption ? (selectedWeightOption.stockUnits || 0) : (product?.quantity || 0);
    
    // Calculate display price - use selected option price, or lowest price if no selection
    const displayPrice = (() => {
        if (selectedWeightOption && typeof selectedWeightOption.price === 'number') {
            return selectedWeightOption.price;
        }
        if (product?.hasWeightOptions && weightOptions.length > 0) {
            // If no weight selected but has weight options, show lowest price
            const sortedOptions = [...weightOptions].sort((a, b) => a.weightKg - b.weightKg);
            return sortedOptions[0]?.price || 0;
        }
        return product?.price || 0;
    })();

    // Navigation functions
    const goToPreviousImage = () => {
        setCurrentImageIndex((prev) => 
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    const goToNextImage = () => {
        setCurrentImageIndex((prev) => 
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    const selectImage = (index) => {
        setCurrentImageIndex(index);
    };

    const handleAddToCart = async () => {
        if (user?.role === 'admin') return;

        if (!product) return;

        try {
            setAddingToCart(true);
            // Add the product with the specified quantity
            let failureStatus = null;
            for (let i = 0; i < quantity; i++) {
                const result = await addToCart(product, selectedWeightOptionId);
                if (result?.status !== 'success') {
                    failureStatus = result?.status || 'error';
                    break;
                }
            }
            if (failureStatus === 'maxed' || failureStatus === 'out_of_stock') {
                setButtonState('maxed');
            } else if (!failureStatus) {
                setButtonState('added');
            }
            setTimeout(() => setButtonState('idle'), 1500);
        } catch (error) {
            console.error('Error adding to cart:', error);
        } finally {
            setAddingToCart(false);
        }
    };

    if (loading) {
        return (
            <div className='min-h-screen bg-[#fffefc] flex items-center justify-center'>
                <div className='text-center'>
                    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-[#901414] mx-auto mb-4'></div>
                    <p className='text-[#030105]'>Loading product...</p>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className='min-h-screen bg-[#fffefc] flex items-center justify-center'>
                <div className='text-center max-w-md mx-auto px-4'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-[#030105] mb-4'>Product Not Found</h1>
                    <p className='text-sm sm:text-base text-gray-600 mb-6 sm:mb-8'>The product you're looking for doesn't exist or has been removed.</p>
                    <Link 
                        to='/products'
                        className='inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors duration-300 text-sm sm:text-base'
                    >
                        <ArrowLeft className='w-4 h-4 mr-2' />
                        Back to Products
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className='min-h-screen bg-white w-full'>
            {/* Header Section */}
            <div className='pt-20 sm:pt-24 md:pt-28 pb-4 sm:pb-6 bg-white w-full'>
                <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className='flex items-center justify-between'
                    >
                        <Link 
                            to='/products'
                            className='inline-flex items-center text-[#860809] hover:text-[#a31f17] transition-colors duration-300 text-sm sm:text-base'
                        >
                            <ArrowLeft className='w-4 h-4 sm:w-5 sm:h-5 mr-2' />
                            Back to Products
                        </Link>
                        <div className='w-20'></div> {/* Spacer for centering */}
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className='w-full px-3 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-6 lg:py-8'>
                <div className='max-w-6xl mx-auto'>
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className='grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12'
                    >
                        {/* Left Side - Product Image Gallery */}
                        <div className='flex justify-center lg:justify-start'>
                            <div className='w-full max-w-md md:max-w-lg lg:max-w-xl'>
                                {/* Main Image Display */}
                                <div className='relative aspect-square bg-white rounded-lg shadow-lg overflow-hidden mb-3 sm:mb-4'>
                                    <img
                                        src={images[currentImageIndex] || product.image}
                                        alt={product.name}
                                        className='w-full h-full object-contain'
                                    />
                                    
                                    {/* Navigation Arrows - Only show if multiple images */}
                                    {hasMultipleImages && (
                                        <>
                                            <button
                                                onClick={goToPreviousImage}
                                                className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200'
                                                aria-label="Previous image"
                                            >
                                                <ChevronLeft className='w-4 h-4 sm:w-5 sm:h-5' />
                                            </button>
                                            <button
                                                onClick={goToNextImage}
                                                className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white p-1.5 sm:p-2 rounded-full transition-all duration-200'
                                                aria-label="Next image"
                                            >
                                                <ChevronRight className='w-4 h-4 sm:w-5 sm:h-5' />
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Thumbnail Selection - Only show if multiple images */}
                                {hasMultipleImages && (
                                    <div className='flex gap-2 justify-center overflow-x-auto pb-2'>
                                        {images.map((image, index) => (
                                            <button
                                                key={index}
                                                onClick={() => selectImage(index)}
                                                className={`flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                                                    index === currentImageIndex
                                                        ? 'border-[#030105] shadow-md'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <img
                                                    src={image}
                                                    alt={`${product.name} ${index + 1}`}
                                                    className='w-full h-full object-cover'
                                                />
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Side - Product Information */}
                        <div className='flex flex-col justify-center space-y-4 sm:space-y-6'>
                            {/* Product Name */}
                            <motion.h1
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className='text-2xl sm:text-3xl lg:text-4xl font-bold text-[#030105]'
                            >
                                {product.name}
                            </motion.h1>

                            {/* Category */}
                            <motion.h2
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.4 }}
                                className='text-lg sm:text-xl text-[#860809] capitalize'
                            >
                                {product.category}
                            </motion.h2>

                            {/* HR Line */}
                            <motion.hr
                                initial={{ opacity: 0, scaleX: 0 }}
                                animate={{ opacity: 1, scaleX: 1 }}
                                transition={{ duration: 0.8, delay: 0.5 }}
                                className='border-gray-300 border-t-2'
                            />

                            {/* Price */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.6 }}
                                className='text-2xl sm:text-3xl font-bold text-[#860809]'
                            >
                                ₱{displayPrice}
                            </motion.div>

                            {/* Stock Status */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8, delay: 0.65 }}
                                className='flex items-center space-x-2'
                            >
                                <span className={`text-xs sm:text-sm font-medium px-3 py-1 rounded-full ${
                                    totalStocks > 10 
                                        ? 'bg-green-100 text-green-800' 
                                        : totalStocks > 0 
                                            ? 'bg-yellow-100 text-yellow-800' 
                                            : 'bg-red-100 text-red-800'
                                }`}>
                                    {totalStocks > 0 ? `${totalStocks} in stock` : 'Out of stock'}
                                </span>
                            </motion.div>

                            {/* Weight options list (sorted from lowest to highest weight) */}
                            {weightOptions.length > 0 && (
                                <div className='flex flex-wrap gap-2'>
                                    {[...weightOptions].sort((a, b) => a.weightKg - b.weightKg).map((opt) => {
                                        const isSelected = String(opt._id) === String(selectedWeightOptionId);
                                        const label = `${typeof opt.weightKg === 'number' ? opt.weightKg.toFixed(2) : opt.weightKg} kg • ${opt.stockUnits} in stock`;
                                        return (
                                            <button
                                                key={String(opt._id)}
                                                type='button'
                                                onClick={() => { setSelectedWeightOptionId(String(opt._id)); setQuantity(1); }}
                                                disabled={(opt.stockUnits || 0) <= 0}
                                                className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full border text-xs sm:text-sm transition-colors ${
                                                    isSelected ? 'border-[#860809] text-[#860809] bg-[#f8f3ed]' : 'border-gray-300 text-[#030105]'
                                                } ${ (opt.stockUnits||0) <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-[#860809]'}`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Quantity Controls and Add to Cart Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.7 }}
                                className='flex items-center gap-3 sm:gap-4'
                            >
                                {/* Quantity Controls */}
                                <div className='flex items-center border border-gray-300 rounded-lg'>
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        disabled={quantity <= 1}
                                        className='p-1.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                                    >
                                        <Minus className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                                    </button>
                                    <span className='px-3 sm:px-4 py-2 text-base sm:text-lg font-semibold min-w-[2.5rem] sm:min-w-[3rem] text-center'>{quantity}</span>
                                    <button
                                        onClick={() => setQuantity(Math.min(selectedStock || totalStocks, quantity + 1))}
                                        disabled={quantity >= (selectedStock || totalStocks)}
                                        className='p-1.5 sm:p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200'
                                    >
                                        <Plus className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
                                    </button>
                                </div>

                                {/* Add to Cart Button */}
                                <button
                                    onClick={handleAddToCart}
                                    disabled={addingToCart || (selectedStock || totalStocks) === 0 || user?.role === 'admin'}
                                    className={`flex-1 px-4 sm:px-6 md:px-8 py-3 sm:py-4 text-white text-base sm:text-lg font-semibold rounded-lg transition-colors duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                                        (selectedStock || totalStocks) > 0 
                                            ? buttonState === 'added'
                                                ? 'bg-emerald-600'
                                                : buttonState === 'maxed'
                                                    ? 'bg-red-600'
                                                    : 'bg-[#860809] hover:bg-[#a31f17]'
                                            : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                                >
                                    {addingToCart ? (
                                        <>
                                            <div className='animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-[#ffd901]'></div>
                                            <span className='hidden sm:inline'>Adding...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShoppingCart className='w-4 h-4 sm:w-5 sm:h-5' />
                                            {(selectedStock || totalStocks) > 0 
                                                ? buttonState === 'added'
                                                    ? 'Added'
                                                    : buttonState === 'maxed'
                                                        ? 'Maxed'
                                                        : 'Add to Cart'
                                                : 'Out of Stock'}
                                        </>
                                    )}
                                </button>
                            </motion.div>

                            {/* Product Details */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: 0.8 }}
                                className='bg-[#f8f3ed] rounded-lg shadow-lg p-4 sm:p-6'
                            >
                                <h3 className='text-lg sm:text-xl font-bold text-[#030105] mb-3 sm:mb-4'>Product Details</h3>
                                {product.description && (
                                    <p className='text-sm sm:text-base text-[#030105] leading-relaxed'>{product.description}</p>
                                )}
                            </motion.div>
                        </div>
                    </motion.div>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default ProductDetailPage;
