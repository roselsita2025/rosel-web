import { useEffect, useState } from "react";
import { ShoppingCart, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { cartStore } from "../../store/cartStore.js";
import { useAuthStore } from "../../store/authStore.js";
import { useState as useLocalState } from "react";


const FeaturedProducts = ({ featuredProducts }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(4);

    const { user } = useAuthStore();
    const [buttonStateById, setButtonStateById] = useState({}); // { [productId]: 'idle' | 'added' | 'maxed' }

    const { addToCart } = cartStore();

    useEffect(() => {
		const handleResize = () => {
			if (window.innerWidth < 640) setItemsPerPage(1);
			else if (window.innerWidth < 1024) setItemsPerPage(3);
			else if (window.innerWidth < 1280) setItemsPerPage(4);
			else setItemsPerPage(5);
		};

		handleResize();
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, []);

    const handleAddToCart = async (product) => {
        if (user?.role === 'admin') return;
        const result = await addToCart(product);
        setButtonStateById((prev) => ({ ...prev, [product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle' }));
        setTimeout(() => {
            setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
        }, 1500);
    };

    const nextSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex + itemsPerPage);
	};

	const prevSlide = () => {
		setCurrentIndex((prevIndex) => prevIndex - itemsPerPage);
	};

    const isStartDisabled = currentIndex === 0;
    const isEndDisabled = currentIndex >= featuredProducts.length - itemsPerPage;




return (
		<div className='py-6'>
			<div className='container mx-auto px-4'>
				<h2 className='text-center text-4xl sm:text-5xl font-bold text-[#901414] mb-4 font-libre'>Featured Products</h2>
				<div className='relative'>
					<div className='overflow-hidden'>
						<div
							className='flex transition-transform duration-300 ease-in-out'
							style={{ transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)` }}
						>
							{featuredProducts?.map((product) => (
								<div key={product._id} className='w-full sm:w-1/3 lg:w-1/4 xl:w-1/5 flex-shrink-0 px-2 py-8'>
									<div className='bg-white rounded-lg overflow-visible h-full transition-all duration-300 hover:bg-[#f8f3ed] hover:scale-110 hover:z-50 hover:border-2 hover:border-[#901414] group'>
										<div className='overflow-hidden'>
											<img
												src={product.image}
												alt={product.name}
												className='w-full h-32 object-contain transition-transform duration-300 ease-in-out hover:scale-110'
											/>
										</div>
										<div className='p-3'>
											<h3 className='text-base font-semibold mb-1 text-[#82695b] font-alice'>{product.name}</h3>
										<p className='text-black font-bold mb-1 font-libre'>
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
					</div>
					<button
						onClick={prevSlide}
						disabled={isStartDisabled}
						className={`absolute top-1/2 -left-8 transform -translate-y-1/2 p-2 rounded-full text-[black] hover:text-white transition-colors duration-300 ${
							isStartDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#f8f3ed] hover:bg-emerald-500"
						}`}
					>
						<ChevronLeft className='w-6 h-6' />
					</button>

					<button
						onClick={nextSlide}
						disabled={isEndDisabled}
						className={`absolute top-1/2 -right-8 transform -translate-y-1/2 p-2 rounded-full text-[black] hover:text-white transition-colors duration-300 ${
							isEndDisabled ? "bg-gray-400 cursor-not-allowed" : "bg-[#f8f3ed] hover:bg-emerald-500"
						}`}
					>
						<ChevronRight className='w-6 h-6' />
					</button>
				</div>
			</div>
		</div>
	);
}

export default FeaturedProducts