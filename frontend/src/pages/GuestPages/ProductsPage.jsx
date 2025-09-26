import { useEffect, useState } from "react";
import CategoryItem from "../../components/GuestComponents/CategoryItem.jsx";
import { productStore } from "../../store/productStore.js";
import FeaturedProducts from "../../components/GuestComponents/FeaturedProducts.jsx";
import Footer from "../../components/Footer.jsx";
import axios from "axios";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const categories = [
	{ href: "/pork", name: "Pork", imageUrl: "/bgpork.jpg" },
	{ href: "/beef", name: "Beef", imageUrl: "/bgbeef.jpg" },
	{ href: "/chicken", name: "Chicken", imageUrl: "/bgchicken.jpg" },
	{ href: "/sliced", name: "Sliced", imageUrl: "/bgsliced.jpg" },
	{ href: "/processed", name: "Processed", imageUrl: "/bgprocessed.jpg" },
	{ href: "/ground", name: "Ground", imageUrl: "/bgground.jpg" },
];

const ProductsPage = () => {
	const [featuredProducts, setFeaturedProducts] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	
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
   		<motion.div 
			className='relative min-h-screen text-white overflow-hidden bg-[#901414] pt-8 w-full'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 0.6, ease: "easeOut" }}
			style={{ willChange: "opacity" }}
		>
			{/* First Section: Our Products Title and Description */}
			<section className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24'>
				<motion.div 
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
					style={{ willChange: "opacity, transform" }}
				>
					<motion.h1 
						className='text-center text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 font-libre'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
						style={{ willChange: "opacity, transform" }}
					>
						Our Products
					</motion.h1>
					<motion.p 
						className='text-center text-sm sm:text-base md:text-lg text-white max-w-3xl mx-auto font-alice px-4'
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.4, delay: 0.6, ease: "easeOut" }}
						style={{ willChange: "opacity, transform" }}
					>
						We take pride in bringing you only safe, high quality meat products.
						Our tradition stands for consistently quality meat for consistent quality food.
					</motion.p>
				</motion.div>
			</section>

			{/* Second Section: Product Category Cards */}
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
					transition={{ duration: 0.5, delay: 1.0, ease: "easeOut" }}
					style={{ willChange: "opacity, transform" }}
				>
					{/* Navigation Buttons - Only show on mobile and medium screens when there are more items than can be displayed */}
					{itemsPerView < 6 && categories.length > itemsPerView && (
						<>
							<button
								onClick={prevCategory}
								className="absolute left-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#901414] p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
								aria-label="Previous categories"
							>
								<ChevronLeft size={20} />
							</button>
							<button
								onClick={nextCategory}
								className="absolute right-2 top-1/2 -translate-y-1/2 z-20 bg-white/95 hover:bg-white text-[#901414] p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110"
								aria-label="Next categories"
							>
								<ChevronRight size={20} />
							</button>
						</>
					)}

					{/* Category Cards Container */}
					<div className="overflow-hidden px-16 sm:px-20">
						<div
							className={`flex transition-transform duration-300 ease-out ${
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
									transition={{ duration: 0.4, delay: 1.2 + (index * 0.05), ease: "easeOut" }}
									style={{ willChange: "opacity, transform" }}
								>
									<CategoryItem category={category} />
								</motion.div>
							))}
						</div>
					</div>

				</motion.div>
			</section>
			{/* Featured Products Section */}
			<motion.div 
				className="w-full bg-white py-12"
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.5, ease: "easeOut" }}
				viewport={{ once: true }}
				style={{ willChange: "opacity, transform" }}
			>
				<div className="max-w-7xl mx-auto px-4">
					{!isLoading && featuredProducts.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
							viewport={{ once: true }}
							style={{ willChange: "opacity, transform" }}
						>
							<FeaturedProducts featuredProducts={featuredProducts} />
						</motion.div>
					)}
				</div>
			</motion.div>

			

			<Footer />
		</motion.div>
		
  )
}

export default ProductsPage;