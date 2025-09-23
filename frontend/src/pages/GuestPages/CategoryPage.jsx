import { useEffect, useState } from 'react'
import { productStore } from '../../store/productStore.js';
import { useParams, Link } from 'react-router-dom';
import { motion } from "framer-motion";
import Footer from "../../components/Footer.jsx";
import CategoryItem from "../../components/GuestComponents/CategoryItem.jsx";
import { ShoppingCart, Eye, Filter, ChevronDown } from "lucide-react";
import { cartStore } from "../../store/cartStore.js";
import { useAuthStore } from "../../store/authStore.js";

const categories = [
	{ href: "/pork", name: "Pork", imageUrl: "/bgpork.jpg" },
	{ href: "/beef", name: "Beef", imageUrl: "/bgbeef.jpg" },
	{ href: "/chicken", name: "Chicken", imageUrl: "/bgchicken.jpg" },
	{ href: "/sliced", name: "Sliced", imageUrl: "/bgsliced.jpg" },
	{ href: "/processed", name: "Processed", imageUrl: "/bgprocessed.jpg" },
	{ href: "/ground", name: "Ground", imageUrl: "/bgground.jpg" },
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

    useEffect(() => {
		fetchProductsByCategory(category);
	}, [fetchProductsByCategory, category]);

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
                product.price >= minPrice && product.price <= maxPrice
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
        const result = await addToCart(product);
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

    console.log("products: ", products);

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
			<div className='min-h-screen bg-white w-full'>
			{/* Category Header Section - positioned below navbar */}
			<div className='pt-20 sm:pt-24 sm:pb-2 bg-[#901414] w-full flex justify-center'>
				<div className='w-full max-w-6xl px-3 sm:px-4 md:px-6 lg:px-8 py-8 flex flex-col items-center mx-auto'>
					<motion.h1
						className='w-full text-center text-2xl sm:text-3xl md:text-4xl font-bold text-white'
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8 }}
					>
						{category.charAt(0).toUpperCase() + category.slice(1)}

						<p className="w-full max-w-7xl text-center text-base sm:text-md mt-4 text-white font-medium ">
						{(() => {
							const details = {
								pork: "Discover our selection of premium pork products, perfect for every meal. Discover our selection of premium pork products, perfect for every meal.",
								beef: "Beef products here are delicious, tender, and full of flavor.",
								chicken: "Enjoy our fresh chicken products, perfect for healthy and tasty dishes.",
								sliced: "Sliced products for your convenience—ready to cook or serve.",
								processed: "Processed products crafted for quality and taste.",
								ground: "Ground products ideal for burgers, meatballs, and more.",
							};
							const key = category.toLowerCase();
							return details[key] || "Browse our selection of quality products.";
						})()}
					</p>
					</motion.h1>

				</div>
			</div>

			{/* Categories Grid Section */}
			<div className='w-full bg-[#f8f3ed] py-4 sm:py-6'>
				<div className='max-w-6xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
					<motion.div
						className='grid grid-cols-6 gap-3 justify-items-center max-w-6xl mx-auto'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.3 }}
					>
						{categories.map((cat) => (
							<CategoryItem 
								category={cat} 
								key={cat.name} 
								isActive={cat.href === `/${category}`}
							/>
						))}
					</motion.div>
				</div>
			</div>

			{/* Main Content - Centered Layout */}
			<div className='w-full px-3 sm:px-4 md:px-6 lg:px-8 pt-4 sm:pt-6 md:pt-8 pb-4 sm:pb-6 md:pb-8 max-w-6xl mx-auto'>
				<div className='max-w-7xl mx-auto'>
					{/* Filter and Sort Controls */}
					<div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4'>
						{/* Left side - Results counter and Filter */}
						<div className='flex flex-col sm:flex-row items-start sm:items-center gap-4'>
							<span className='text-sm text-gray-600'>
								Showing {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} of {filteredProducts.length} results
							</span>
							<div className='relative filter-dropdown'>
								<button
									onClick={() => setShowFilter(!showFilter)}
									className='flex items-center gap-2 px-4 py-2 bg-[#f8f3ed] text-[#901414] rounded-lg hover:bg-[#e8d5c5] transition-colors duration-200'
								>
									<Filter className='w-4 h-4' />
									Filter
								</button>
								
								{/* Filter Dropdown */}
								{showFilter && (
									<div className='absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4'>
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
						</div>

						{/* Right side - Sort */}
						<div className='relative sort-dropdown'>
							<button
								onClick={() => setShowSort(!showSort)}
								className='flex items-center gap-2 px-4 py-2 bg-[#f8f3ed] text-[#901414] rounded-lg hover:bg-[#e8d5c5] transition-colors duration-200'
							>
								{getSortLabel()}
								<ChevronDown className='w-4 h-4' />
							</button>
							
							{/* Sort Dropdown */}
							{showSort && (
								<div className='absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50'>
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

					{/* Products Grid - Full Width */}
						<motion.div
						className='w-full'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2 }}
					>
							{currentProducts?.length === 0 ? (
								<div className='text-center py-12 sm:py-16'>
									<h2 className='text-2xl sm:text-3xl font-semibold text-[#030105] mb-4'>
										No products found
									</h2>
									<p className='text-gray-600 text-sm sm:text-base'>
										We couldn't find any products matching your criteria.
									</p>
								</div>
							) : (
								<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
									{currentProducts?.map((product) => (
										<div key={product._id} className='w-full'>
											<div className='bg-white rounded-lg overflow-visible h-full transition-all duration-300 hover:bg-[#f8f3ed] hover:scale-110 hover:z-50 hover:border-2 hover:border-[#901414] group'>
												<div className='overflow-hidden'>
													<img
											src={product.image}
											alt={product.name}
														className='w-full h-32 object-contain transition-transform duration-300 ease-in-out hover:scale-110'
											/>
										</div>
												<div className='p-3'>
													<h3 className='text-base font-semibold mb-1 text-[#82695b]'>{product.name}</h3>
													<p className='text-black font-bold mb-1'>
														₱{product.price.toFixed(2)}
													</p>
													<div className='mb-2'>
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
													<div className="space-y-1.5">
                                                    <button
															onClick={() => handleAddToCart(product)}
															disabled={product.quantity === 0}
                                                        className={`w-full text-white font-semibold py-1.5 px-3 rounded transition-colors duration-300 
                                                        flex items-center justify-center text-sm ${
                                                            product.quantity > 0 
                                                                ? buttonStateById[product._id] === 'added'
                                                                    ? 'bg-emerald-600'
                                                                    : buttonStateById[product._id] === 'maxed'
                                                                        ? 'bg-red-600'
                                                                        : 'bg-[#901414] hover:bg-[#a31f17]'
                                                                : 'bg-gray-400 cursor-not-allowed'
                                                        }`}
														>
															<ShoppingCart className='w-4 h-4 mr-1.5' />
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
															className="w-full text-[#901414] font-semibold py-1.5 px-3 rounded transition-all duration-300 
															flex items-center justify-center border-2 border-[#901414] hover:bg-[#901414] hover:text-white text-sm
															opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0"
														>
															<Eye className='w-4 h-4 mr-1.5' />
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
							<div className='flex justify-center items-center mt-8 gap-2'>
								<button
									onClick={goToPreviousPage}
									disabled={currentPage === 1}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
										currentPage === 1
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
									}`}
								>
									Previous
								</button>
								
								{/* Page numbers */}
								{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
									<button
										key={page}
										onClick={() => goToPage(page)}
										className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
											currentPage === page
												? 'bg-[#901414] text-white'
												: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
										}`}
									>
										{page}
									</button>
								))}
								
								<button
									onClick={goToNextPage}
									disabled={currentPage === totalPages}
									className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
										currentPage === totalPages
											? 'bg-gray-100 text-gray-400 cursor-not-allowed'
											: 'bg-[#f8f3ed] text-[#901414] hover:bg-[#e8d5c5]'
									}`}
								>
									Next
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