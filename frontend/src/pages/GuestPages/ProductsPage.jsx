import { useEffect, useState } from "react";
import CategoryItem from "../../components/GuestComponents/CategoryItem.jsx";
import { productStore } from "../../store/productStore.js";
import FeaturedProducts from "../../components/GuestComponents/FeaturedProducts.jsx";
import Footer from "../../components/Footer.jsx";
import axios from "axios";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, Eye } from "lucide-react";
import { cartStore } from "../../store/cartStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = [
	{ href: "/pork", name: "Pork", imageUrl: "/bgpork.jpg" },
	{ href: "/beef", name: "Beef", imageUrl: "/bgbeef.jpg" },
	{ href: "/chicken", name: "Chicken", imageUrl: "/bgchicken.jpg" },
	{ href: "/sliced", name: "Sliced", imageUrl: "/bgsliced.jpg" },
	{ href: "/processed", name: "Processed", imageUrl: "/bgprocessed.jpg" },
	{ href: "/seafood", name: "Seafood", imageUrl: "/bgseafood.jpg" },
];

const ProductsPage = () => {
	const [featuredProducts, setFeaturedProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const { products, fetchAllProducts } = productStore();
	const { addToCart } = cartStore();
	const { user } = useAuthStore();
	const [buttonStateById, setButtonStateById] = useState({});
	
	// Carousel state for category cards
	const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
	const [itemsPerView, setItemsPerView] = useState(6); // Default for large screens

	useEffect(() => {
		const loadFeaturedProducts = async () => {
			setIsLoading(true);
			try {
				// Try to bypass cache with timestamp parameter
				const response = await axios.get(`${API_URL}/products/featured?t=${Date.now()}`);
				// Featured products loaded successfully
				
				// If we get very few products, try the all products endpoint as fallback
				if (response.data?.length <= 1) {
					// Very few featured products, trying all products endpoint
					try {
						const allResponse = await axios.get(`${API_URL}/products/all`);
						// All products response received
						
						// Take the first 8 products as fallback
						if (allResponse.data?.products?.length > 0) {
							const fallbackProducts = allResponse.data.products.slice(0, 8);
							// Using fallback products
							setFeaturedProducts(fallbackProducts);
							return;
						}
					} catch (fallbackError) {
						console.error('Fallback also failed:', fallbackError);
					}
				}
				
				setFeaturedProducts(response.data);
			} catch (error) {
				console.error('Error fetching featured products:', error);
				setFeaturedProducts([]);
			} finally {
				setIsLoading(false);
			}
		};
		loadFeaturedProducts();
	}, []);

    // Load all products for the new section (force refresh to avoid stale category list)
    useEffect(() => {
        fetchAllProducts(true);
    }, [fetchAllProducts]);

	const handleAddToCart = async (product) => {
		if (user?.role === 'admin') return;
		const result = await addToCart(product);
		setButtonStateById((prev) => ({ ...prev, [product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle' }));
		setTimeout(() => {
			setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
		}, 1500);
	};

	// Responsive carousel effect
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

  return (
    		<div className='relative min-h-screen text-white overflow-hidden bg-[#901414] pt-8 w-full'>
			{/* First Section: Our Products Title and Description */}
			<section className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24'>
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.2 }}
				>
					<h1 className='text-center text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-libre'>
						Our Products
					</h1>
					<p className='text-center text-sm sm:text-base md:text-lg text-white max-w-3xl mx-auto font-alice px-4'>
						We take pride in bringing you only safe, high quality meat products.
						Our tradition stands for consistently quality meat for consistent quality food.
					</p>
				</motion.div>
			</section>


			{/* Second Section: Product Category Cards */}
			<section
				className="relative z-10 w-full mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-8"
				style={{
					background: "linear-gradient(to bottom, #901414 0%, #901414 50%, #fff 50%, #fff 100%)"
				}}
			>
					{/* Navigation Buttons - Only show on mobile and medium screens when there are more items than can be displayed */}
					{itemsPerView < 6 && categories.length > itemsPerView && (
						<>
							<button
								onClick={prevCategory}
								className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#901414] p-2 rounded-full shadow-lg transition-colors duration-200"
								aria-label="Previous categories"
							>
								<ChevronLeft size={20} />
							</button>
							<button
								onClick={nextCategory}
								className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#901414] p-2 rounded-full shadow-lg transition-colors duration-200"
								aria-label="Next categories"
							>
								<ChevronRight size={20} />
							</button>
						</>
					)}

					{/* Category Cards Container */}
					<div className="overflow-hidden px-16 sm:px-20">
						<div
							className={`flex ${
								itemsPerView === 6 ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4 md:gap-3' : 'gap-2 sm:gap-3'
							}`}
							style={{
								transform: itemsPerView < 6 ? `translate3d(-${currentCategoryIndex * (100 / itemsPerView)}%, 0, 0)` : 'none',
								willChange: 'transform'
							}}
						>
							{categories.map((category, index) => (
								<motion.div
									key={category.name}
									className={`${itemsPerView < 6 ? 'flex-shrink-0 w-1/2 sm:w-1/3' : ''} flex justify-center`}
									initial={{ opacity: 0, y: 30 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.6, delay: 1.2 + (index * 0.1) }}
								>
									<CategoryItem category={category} />
								</motion.div>
							))}
						</div>
					</div>
			</section>

			{/* All Products Section */}
			<div className="w-full bg-white py-12">
				<div className="max-w-7xl mx-auto px-4">
					<motion.h2
						initial={{ opacity: 0, y: 10 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6 }}
						className="text-2xl font-bold text-[#860809] mb-6 font-libre"
					>
						All Products
					</motion.h2>
					{(products && products.length > 0) || (featuredProducts && featuredProducts.length > 0) ? (
						<motion.div
							initial={{ opacity: 0, y: 10 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.1 }}
							className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8"
						>
							{((products && products.length > 0) ? products : featuredProducts).map((product) => (
								<div key={product._id} className='w-full'>
									<div className='bg-white rounded-lg overflow-visible h-full transition-all duration-300 hover:bg-[#f8f3ed] hover:scale-110 hover:z-50 hover:border-2 hover:border-[#901414] group flex flex-col'>
										<div className='overflow-hidden'>
											<img src={product.image} alt={product.name} className='w-full h-32 object-contain transition-transform duration-300 ease-in-out hover:scale-110' />
										</div>
										<div className='p-3 flex flex-col flex-1'>
											<h3 className='text-base font-semibold mb-1 text-[#82695b]'>{product.name}</h3>
											<p className='text-black font-bold mb-1'>₱{product.price.toFixed(2)}</p>
											<div className='mb-2'>
												<span className={`text-xs font-medium px-2 py-1 rounded-full ${
													product.quantity > 10 ? 'bg-green-100 text-green-800' : product.quantity > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
												}`}>{product.quantity > 0 ? `${product.quantity} in stock` : 'Out of stock'}</span>
											</div>
											<div className="space-y-1.5 mt-auto">
												<button
													onClick={() => handleAddToCart(product)}
													disabled={product.quantity === 0}
													className={`w-full text-white font-semibold py-1.5 px-3 rounded transition-colors duration-300 flex items-center justify-center text-sm ${
														product.quantity > 0 ? (buttonStateById[product._id] === 'added' ? 'bg-emerald-600' : buttonStateById[product._id] === 'maxed' ? 'bg-red-600' : 'bg-[#901414] hover:bg-[#a31f17]') : 'bg-gray-400 cursor-not-allowed'
													}`}
												>
													<ShoppingCart className='w-4 h-4 mr-1.5' />
													{product.quantity > 0 ? (buttonStateById[product._id] === 'added' ? 'Product Added' : buttonStateById[product._id] === 'maxed' ? 'Maxed item' : 'Add to Cart') : 'Out of Stock'}
												</button>
												<Link to={`/product/${product._id}`} className="w-full text-[#901414] font-semibold py-1.5 px-3 rounded transition-all duration-300 flex items-center justify-center border-2 border-[#901414] hover:bg-[#901414] hover:text-white text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">
													<Eye className='w-4 h-4 mr-1.5' />
													View Product
												</Link>
											</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
						</motion.div>
					) : null}
				</div>
			</div>

			{/* Featured Products Section */}
			<div className="w-full bg-white py-12">
				<div className="max-w-7xl mx-auto px-4">
						{!isLoading && featuredProducts.length > 0 && (
							<motion.div
								initial={{ opacity: 0, y: 10 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.6, delay: 0.5 }}
							>
								<FeaturedProducts featuredProducts={featuredProducts} />
							</motion.div>
						)}
				</div>
			</div>

			

			<Footer />
		</div>
		
  )
}

export default ProductsPage;