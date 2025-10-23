import { useEffect, useState } from 'react'
import { productStore } from '../../store/productStore.js';
import { useParams, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import Footer from "../../components/Footer.jsx";
import CategoryItem from "../../components/GuestComponents/CategoryItem.jsx";
import { ShoppingCart, Eye, Filter, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cartStore } from "../../store/cartStore.js";
import { useAuthStore } from "../../store/authStore.js";

const categories = [
	{ href: "/pork", name: "Pork", imageUrl: "/bgpork.jpg" },
	{ href: "/beef", name: "Beef", imageUrl: "/bgbeef.jpg" },
	{ href: "/chicken", name: "Chicken", imageUrl: "/bgchicken.jpg" },
	{ href: "/sliced", name: "Sliced", imageUrl: "/bgsliced.jpg" },
	{ href: "/processed", name: "Processed", imageUrl: "/bgprocessed.jpg" },
	{ href: "/seafood", name: "Seafood", imageUrl: "/bgseafood.jpg" },
];

const CategoryPage = () => {
    const { fetchProductsByCategory, products } = productStore();
    const { category } = useParams();
    const { user } = useAuthStore();
    const { addToCart } = cartStore();
    const [buttonStateById, setButtonStateById] = useState({}); // { [productId]: 'idle' | 'added' | 'maxed' }
    
    // Filter and sort state
    const [showFilter, setShowFilter] = useState(false);
    const [showSort, setShowSort] = useState(false);
    const [minPrice, setMinPrice] = useState(0);
    const [maxPrice, setMaxPrice] = useState(10000);
    const [sortBy, setSortBy] = useState('latest');
    const [filteredProducts, setFilteredProducts] = useState([]);
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 20;

    // Carousel state for category cards
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(6); // Default for large screens

    useEffect(() => {
		fetchProductsByCategory(category);
	}, [fetchProductsByCategory, category]);

    // Carousel responsive logic
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) {
                setItemsPerView(2); // Mobile: 2 cards
            } else if (window.innerWidth < 1024) {
                setItemsPerView(3); // Medium: 3 cards
            } else {
                setItemsPerView(6); // Large: all cards
            }
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Navigation functions
    const nextCategory = () => {
        setCurrentCategoryIndex((prevIndex) =>
            prevIndex + itemsPerView >= categories.length ? 0 : prevIndex + itemsPerView
        );
    };

    const prevCategory = () => {
        setCurrentCategoryIndex((prevIndex) =>
            prevIndex - itemsPerView < 0 ? Math.max(0, categories.length - itemsPerView) : prevIndex - itemsPerView
        );
    };

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showFilter && !event.target.closest('.filter-dropdown')) {
                setShowFilter(false);
            }
            if (showSort && !event.target.closest('.sort-dropdown')) {
                setShowSort(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilter, showSort]);

    // Filter and sort products
    useEffect(() => {
        if (products && products.length > 0) {
            let filtered = products.filter(product => 
                (product.priceMin || product.price || 0) >= minPrice && (product.priceMin || product.price || 0) <= maxPrice
            );

            // Sort products
            switch (sortBy) {
                case 'price-low':
                    filtered.sort((a, b) => a.price - b.price);
                    break;
                case 'price-high':
                    filtered.sort((a, b) => b.price - a.price);
                    break;
                case 'latest':
                default:
                    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                    break;
            }

            setFilteredProducts(filtered);
            setCurrentPage(1); // Reset to first page when filters change
        }
    }, [products, minPrice, maxPrice, sortBy]);

    const handleAddToCart = async (product) => {
        if (user?.role === 'admin') return;
        
        // For products with weight options, automatically select the lowest weight
        let weightOptionId = null;
        if (product.hasWeightOptions && product.weightOptions && product.weightOptions.length > 0) {
            console.log('CategoryPage: Original weight options:', product.weightOptions);
            const sortedOptions = [...product.weightOptions].sort((a, b) => a.weightKg - b.weightKg);
            console.log('CategoryPage: Sorted weight options (lowest first):', sortedOptions);
            weightOptionId = sortedOptions[0]._id;
            console.log('CategoryPage: Selected weight option:', sortedOptions[0]);
            console.log('CategoryPage: Selected weightOptionId:', weightOptionId);
        } else if (product.basePricePerKg && product.basePricePerKg > 0) {
            console.log('CategoryPage: No weight options found, but has basePricePerKg. Using legacy mode.');
        } else {
            console.log('CategoryPage: No weight options and no basePricePerKg. Using legacy mode.');
        }
        
        console.log('CategoryPage: Final weightOptionId:', weightOptionId);
        const result = await addToCart(product, weightOptionId);
        console.log('CategoryPage: Add to cart result:', result);
        
        setButtonStateById((prev) => ({ ...prev, [product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle' }));
        setTimeout(() => {
            setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
        }, 1500);
    };

    const resetFilters = () => {
        setMinPrice(0);
        setMaxPrice(10000);
    };

    const handleSortChange = (sortOption) => {
        setSortBy(sortOption);
        setShowSort(false);
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'price-low': return 'Price: Low to High';
            case 'price-high': return 'Price: High to Low';
            case 'latest': return 'Latest';
            default: return 'Latest';
        }
    };

    // Pagination functions
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const startIndex = (currentPage - 1) * productsPerPage;
    const endIndex = startIndex + productsPerPage;
    const currentProducts = filteredProducts.slice(startIndex, endIndex);

    const goToPage = (page) => {
        setCurrentPage(page);
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };


     return (
		<>
			<style jsx>{`
				.slider-min::-webkit-slider-thumb {
					appearance: none;
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #ffd901;
					cursor: pointer;
					border: 2px solid #fff;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
				
				.slider-min::-moz-range-thumb {
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #ffd901;
					cursor: pointer;
					border: 2px solid #fff;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
				
				.slider-max::-webkit-slider-thumb {
					appearance: none;
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #901414;
					cursor: pointer;
					border: 2px solid #fff;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
				
				.slider-max::-moz-range-thumb {
					height: 20px;
					width: 20px;
					border-radius: 50%;
					background: #901414;
					cursor: pointer;
					border: 2px solid #fff;
					box-shadow: 0 2px 4px rgba(0,0,0,0.2);
				}
			`}</style>
			<div className='min-h-screen bg-white w-full flex flex-col'>
			{/* Category Header Section - Apply ProductsPage Section 1 styling */}
			<section className='bg-[#901414] relative z-10 px-4 sm:px-6 lg:px-8 pt-24 '>
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					<motion.h1 
						className='text-center text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-libre'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.4 }}
					>
						{category.charAt(0).toUpperCase() + category.slice(1)}
					</motion.h1>
					<motion.p 
						className='text-center text-sm sm:text-base md:text-lg text-white max-w-3xl mx-auto font-alice px-4'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.6 }}
					>
						{(() => {
							const details = {
								pork: "Discover our selection of premium pork products, perfect for every meal.",
								beef: "Beef products here are delicious, tender, and full of flavor.",
								chicken: "Enjoy our fresh chicken products, perfect for healthy and tasty dishes.",
								sliced: "Sliced products for your convenience—ready to cook or serve.",
								processed: "Processed products crafted for quality and taste.",
								seafood: "Fresh seafood products perfect for any meal.",
							};
							const key = category.toLowerCase();
							return details[key] || "Browse our selection of quality products.";
						})()}
					</motion.p>
				</motion.div>
			</section>

			{/* Categories Grid Section - Apply ProductsPage Section 2 styling with carousel */}
			<section
				className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-8"
				style={{
					background: "linear-gradient(to bottom, #901414 0%, #901414 50%, #fff 50%, #fff 100%)"
				}}
			>
				<motion.div
					className='relative max-w-7xl mx-auto'
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 1.0 }}
				>
					{/* Navigation Buttons - Only show on mobile and medium screens when there are more items than can be displayed */}
					{itemsPerView < 6 && categories.length > itemsPerView && (
						<>
							<button
								onClick={prevCategory}
								className="absolute left-1 sm:left-2 md:left-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-[#901414] p-1.5 sm:p-2 rounded-full shadow-lg transition-colors duration-200"
								aria-label="Previous categories"
							>
								<ChevronLeft size={18} className="sm:w-5 sm:h-5" />
							</button>
							<button
								onClick={nextCategory}
								className="absolute right-1 sm:right-2 md:right-4 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white text-[#901414] p-1.5 sm:p-2 rounded-full shadow-lg transition-colors duration-200"
								aria-label="Next categories"
							>
								<ChevronRight size={18} className="sm:w-5 sm:h-5" />
							</button>
						</>
					)}

					{/* Category Cards Container */}
					<div className="overflow-hidden px-16 sm:px-20 md:px-24 lg:px-28">
						<div
							className={`flex transition-transform duration-500 ease-in-out ${
								itemsPerView === 6 ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6' : 'gap-4 sm:gap-6'
							}`}
							style={{
								transform: itemsPerView < 6 ? `translateX(-${currentCategoryIndex * (100 / itemsPerView)}%)` : 'none'
							}}
						>
							{categories.map((cat, index) => (
								<motion.div
									key={cat.name}
									className={`${itemsPerView < 6 ? 'flex-shrink-0 w-1/2 sm:w-1/3' : ''} flex justify-center`}
									initial={{ opacity: 0, y: 30 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 1.2 + (index * 0.1) }}
								>
									<CategoryItem 
										category={cat} 
										isActive={cat.href === `/${category}`}
									/>
								</motion.div>
							))}
						</div>
					</div>
				</motion.div>
			</section>

			{/* Main Content - Centered Layout */}
			<div className='flex-1 w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 max-w-6xl mx-auto'>
				<div className='max-w-7xl mx-auto'>
					{/* Filter and Sort Controls */}
					<div className='mb-6'>
						{/* Results Counter */}
						<div className='mb-3'>
							<span className='text-xs sm:text-sm text-gray-600'>
								Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} results
							</span>
						</div>
						
						{/* Filter (Left) and Sort (Right) */}
						<div className='flex justify-between items-center gap-3'>
							{/* Left side - Filter */}
							<div className='relative filter-dropdown'>
								<button
									onClick={() => setShowFilter(!showFilter)}
									className='flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 bg-[#f8f3ed] text-[#901414] rounded-lg hover:bg-[#e8d5c5] transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap'
								>
									<Filter className='w-3.5 h-3.5 sm:w-4 sm:h-4' />
									Filter
								</button>
								
								{/* Filter Dropdown */}
								{showFilter && (
									<div className='absolute top-full left-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4'>
										<h3 className='font-semibold text-gray-800 mb-3'>Filter by Price</h3>
										<div className='space-y-4'>
											<div>
												<label className='block text-sm text-gray-600 mb-2'>
													Price Range: ₱{minPrice} - ₱{maxPrice}
												</label>
												<div className='space-y-4'>
													{/* Minimum Price Slider */}
													<div>
														<label className='block text-sm text-gray-600 mb-2'>
															Minimum Price: ₱{minPrice}
														</label>
														<input
															type='range'
															min='0'
															max='10000'
															value={minPrice}
															onChange={(e) => {
																const value = Number(e.target.value);
																if (value <= maxPrice) {
																	setMinPrice(value);
																}
															}}
															className='w-full h-2 bg-gradient-to-r from-[#ffd901] to-[#901414] rounded-lg appearance-none cursor-pointer slider-min'
														/>
													</div>
													
													{/* Maximum Price Slider */}
													<div>
														<label className='block text-sm text-gray-600 mb-2'>
															Maximum Price: ₱{maxPrice}
														</label>
														<input
															type='range'
															min='0'
															max='10000'
															value={maxPrice}
															onChange={(e) => {
																const value = Number(e.target.value);
																if (value >= minPrice) {
																	setMaxPrice(value);
																}
															}}
															className='w-full h-2 bg-gradient-to-r from-[#ffd901] to-[#901414] rounded-lg appearance-none cursor-pointer slider-max'
														/>
													</div>
												</div>
											</div>
											<button
												onClick={resetFilters}
												className='w-full px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors duration-200'
											>
												Reset to Default
											</button>
										</div>
									</div>
								)}
							</div>

							{/* Right side - Sort */}
							<div className='relative sort-dropdown'>
								<button
									onClick={() => setShowSort(!showSort)}
									className='flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 md:px-4 py-2 bg-[#f8f3ed] text-[#901414] rounded-lg hover:bg-[#e8d5c5] transition-colors duration-200 text-xs sm:text-sm whitespace-nowrap'
								>
									<span className="truncate max-w-[100px] sm:max-w-none">{getSortLabel()}</span>
									<ChevronDown className='w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0' />
								</button>
						
								{/* Sort Dropdown */}
								{showSort && (
									<div className='absolute top-full right-0 mt-2 w-48 max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
									<button
										onClick={() => handleSortChange('latest')}
										className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 ${
											sortBy === 'latest' ? 'bg-[#f8f3ed] text-[#901414]' : 'text-gray-700'
										}`}
									>
										Latest
									</button>
									<button
										onClick={() => handleSortChange('price-low')}
										className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 ${
											sortBy === 'price-low' ? 'bg-[#f8f3ed] text-[#901414]' : 'text-gray-700'
										}`}
									>
										Price: Low to High
									</button>
									<button
										onClick={() => handleSortChange('price-high')}
										className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 transition-colors duration-200 ${
											sortBy === 'price-high' ? 'bg-[#f8f3ed] text-[#901414]' : 'text-gray-700'
										}`}
									>
										Price: High to Low
									</button>
									</div>
								)}
							</div>
						</div>
					</div>

					{/* Products Grid - Full Width */}
						<motion.div
						className='w-full'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
							{currentProducts?.length === 0 ? (
								<div className='text-center py-12 sm:py-16'>
									<h2 className='text-xl sm:text-2xl md:text-3xl font-semibold text-[#030105] mb-4'>
										No products found
									</h2>
									<p className='text-gray-600 text-sm sm:text-base'>
										We couldn't find any products matching your criteria.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
									{currentProducts?.map((product) => (
									<div key={product._id} className='w-full max-w-[300px] mx-auto'>
										<div className='bg-white rounded-lg overflow-visible h-full transition-all duration-300 hover:bg-[#f8f3ed] hover:scale-105 lg:hover:scale-108 2xl:hover:scale-105 hover:z-50 hover:border-2 hover:border-[#901414] group flex flex-col'>
											<div className='overflow-hidden'>
													<img
											src={product.image}
											alt={product.name}
														className='w-full h-28 sm:h-32 lg:h-36 xl:h-40 object-contain transition-transform duration-300 ease-in-out hover:scale-110'
											/>
										</div>
										<div className='p-3 flex flex-col flex-1'>
													<h3 className='text-sm sm:text-base font-semibold mb-1 text-[#82695b]'>{product.name}</h3>
													<p className='text-black font-bold mb-1'>
														₱{(product.priceMin || product.price || 0).toFixed(2)}
													</p>
													<div className='mb-2'>
														<span className={`text-xs sm:text-sm font-medium px-2 py-1 rounded-full ${
															(product.totalStockUnits || product.quantity) > 10 
																? 'bg-green-100 text-green-800' 
																: (product.totalStockUnits || product.quantity) > 0 
																	? 'bg-yellow-100 text-yellow-800' 
																	: 'bg-red-100 text-red-800'
														}`}>
															{(product.totalStockUnits || product.quantity) > 0 ? `${product.totalStockUnits || product.quantity} in stock` : 'Out of stock'}
														</span>
												</div>
												<div className="space-y-1.5 mt-auto">
                                                    <button
															onClick={() => handleAddToCart(product)}
															disabled={(product.totalStockUnits || product.quantity) === 0}
                                                        className={`w-full text-white font-semibold py-1.5 px-3 rounded transition-colors duration-300 
                                                        flex items-center justify-center text-xs sm:text-sm ${
                                                            (product.totalStockUnits || product.quantity) > 0 
                                                                ? buttonStateById[product._id] === 'added'
                                                                    ? 'bg-emerald-600'
                                                                    : buttonStateById[product._id] === 'maxed'
                                                                        ? 'bg-red-600'
                                                                        : 'bg-[#901414] hover:bg-[#a31f17]'
                                                                : 'bg-gray-400 cursor-not-allowed'
                                                        }`}
														>
															<ShoppingCart className='w-4 h-4 mr-1.5' />
                                                        {(product.totalStockUnits || product.quantity) > 0 
                                                            ? buttonStateById[product._id] === 'added' 
                                                                ? 'Product Added'
                                                                : buttonStateById[product._id] === 'maxed'
                                                                    ? 'Maxed item'
                                                                    : 'Add to Cart' 
                                                            : 'Out of Stock'}
														</button>
														<Link
															to={`/product/${product._id}`}
															className="w-full text-[#901414] font-semibold py-1.5 px-2 sm:px-3 rounded transition-all duration-300 
															flex items-center justify-center border-2 border-[#901414] hover:bg-[#901414] hover:text-white text-xs sm:text-sm
															md:opacity-0 md:group-hover:opacity-100 transform md:translate-y-2 md:group-hover:translate-y-0 whitespace-nowrap"
														>
															<Eye className='w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-1.5' />
															View Product
														</Link>
													</div>
												</div>
										</div>
									</div>
									))}
								</div>

							)}
						
						{/* Pagination */}
						{totalPages > 1 && (
							<div className='flex flex-wrap justify-center items-center mt-6 sm:mt-8 gap-1 sm:gap-2'>
								<button
									onClick={goToPreviousPage}
									disabled={currentPage === 1}
									className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
										currentPage === 1
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
									}`}
								>
									<span className="hidden sm:inline">Previous</span>
									<ChevronLeft className="w-4 h-4 sm:hidden" />
								</button>
								
								{/* Page numbers - Smart pagination for mobile */}
								{(() => {
									const maxVisiblePages = window.innerWidth < 640 ? 3 : 5;
									const pages = [];
									
									if (totalPages <= maxVisiblePages + 2) {
										// Show all pages if total is small
										for (let i = 1; i <= totalPages; i++) {
											pages.push(i);
										}
									} else {
										// Always show first page
										pages.push(1);
										
										// Calculate range around current page
										let start = Math.max(2, currentPage - Math.floor(maxVisiblePages / 2));
										let end = Math.min(totalPages - 1, start + maxVisiblePages - 1);
										
										// Adjust if we're near the end
										if (end === totalPages - 1) {
											start = Math.max(2, end - maxVisiblePages + 1);
										}
										
										// Add ellipsis if needed
										if (start > 2) {
											pages.push('...');
										}
										
										// Add middle pages
										for (let i = start; i <= end; i++) {
											pages.push(i);
										}
										
										// Add ellipsis if needed
										if (end < totalPages - 1) {
											pages.push('...');
										}
										
										// Always show last page
										pages.push(totalPages);
									}
									
									return pages.map((page, index) => {
										if (page === '...') {
											return (
												<span key={`ellipsis-${index}`} className='px-2 py-1.5 sm:py-2 text-gray-400 text-xs sm:text-sm'>
													...
												</span>
											);
										}
										
										return (
											<button
												key={page}
												onClick={() => goToPage(page)}
												className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
													currentPage === page
														? 'bg-[#901414] text-white'
														: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
												}`}
											>
												{page}
											</button>
										);
									});
								})()}
								
								<button
									onClick={goToNextPage}
									disabled={currentPage === totalPages}
									className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors duration-200 ${
										currentPage === totalPages
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
									}`}
								>
									<span className="hidden sm:inline">Next</span>
									<ChevronRight className="w-4 h-4 sm:hidden" />
								</button>
							</div>
							)}
						</motion.div>
				</div>
			</div>

			<Footer />

		</div>
		</>
	);
};

export default CategoryPage