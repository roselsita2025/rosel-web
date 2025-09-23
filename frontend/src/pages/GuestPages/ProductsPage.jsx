import { useEffect, useState } from "react";
import CategoryItem from "../../components/GuestComponents/CategoryItem.jsx";
import { productStore } from "../../store/productStore.js";
import FeaturedProducts from "../../components/GuestComponents/FeaturedProducts.jsx";
import Footer from "../../components/Footer.jsx";
import axios from "axios";
import { motion } from "framer-motion";

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

	useEffect(() => {
		const loadFeaturedProducts = async () => {
			setIsLoading(true);
			try {
				// Try to bypass cache with timestamp parameter
				const response = await axios.get(`${API_URL}/products/featured?t=${Date.now()}`);
				console.log('Featured products response:', response.data);
				console.log('Number of featured products:', response.data?.length);
				
				// If we get very few products, try the all products endpoint as fallback
				if (response.data?.length <= 1) {
					console.log('Very few featured products, trying all products endpoint...');
					try {
						const allResponse = await axios.get(`${API_URL}/products/all`);
						console.log('All products response:', allResponse.data);
						console.log('Number of all products:', allResponse.data?.products?.length);
						
						// Take the first 8 products as fallback
						if (allResponse.data?.products?.length > 0) {
							const fallbackProducts = allResponse.data.products.slice(0, 8);
							console.log('Using fallback products:', fallbackProducts.length);
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

  return (
   		<motion.div 
			className='relative min-h-screen text-white overflow-hidden bg-[#901414] pt-8 w-full'
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			transition={{ duration: 1 }}
		>
			<motion.div 
				className='relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 pt-24'
				initial={{ opacity: 0, y: 20 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8, delay: 0.2 }}
			>
				<motion.h1 
					className='text-center text-5xl sm:text-5xl font-bold text-white mb-4 font-libre'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.4 }}
				>
					Our Products
				</motion.h1>
				<motion.p 
					className='text-center text-base sm:text-lg text-white mb-12 max-w-3xl mx-auto font-alice'
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, delay: 0.6 }}
				>
					We take pride in bringing you only safe, high quality meat products.
					Our tradition stands for consistently quality meat for consistent quality food.
				</motion.p>

				<motion.div 
					className='grid grid-cols-6 gap-3 justify-items-center max-w-7xl mx-auto'
					initial={{ opacity: 0, y: 50 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.8, delay: 0.8 }}
				>
					{categories.map((category, index) => (
						<motion.div
							key={category.name}
							initial={{ opacity: 0, y: 30 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 1 + (index * 0.1) }}
						>
							<CategoryItem category={category} />
						</motion.div>
					))}
				</motion.div>
			</motion.div>
			<motion.div 
				className="w-screen relative left-1/2 right-1/2 -mx-[50vw] px-0" 
				style={{ background: "white" }}
				initial={{ opacity: 0, y: 50 }}
				whileInView={{ opacity: 1, y: 0 }}
				transition={{ duration: 0.8 }}
				viewport={{ once: true }}
			>
				<div className="max-w-7xl mx-auto px-4 ">
					{!isLoading && featuredProducts.length > 0 && (
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.6, delay: 0.2 }}
							viewport={{ once: true }}
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