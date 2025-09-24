import { useEffect, useState } from "react";
import ProductCard from "./ProductCard";
import axios from "axios";
import LoadingSpinner from "../LoadingSpinner";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import { Flame } from "lucide-react";
import { cartStore } from "../../store/cartStore.js";
import { useAuthStore } from "../../store/authStore.js";

const API_URL= import.meta.env.VITE_API_URL || "http://localhost:5000/api";

axios.defaults.withCredentials = true;

const PeopleAlsoBought = () => {

  const [recommendations, setRecommendations] = useState([]);
  	const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = cartStore();
  const { user } = useAuthStore();
  const [buttonStateById, setButtonStateById] = useState({}); // { [productId]: 'idle' | 'added' | 'maxed' }

  useEffect(() => {
		const fetchRecommendations = async () => {
			try {
				const res = await axios.get(`${API_URL}/products/recommendations`);
				const products = Array.isArray(res.data.products) ? res.data.products : [];
				setRecommendations(products.slice(0, 6));
				// API Response received
			} catch (error) {
				toast.error(error.response.data.message || "An error occurred while fetching recommendations");
			} finally {
				setIsLoading(false);
			}
		};

    fetchRecommendations();
  }, []);

  if (isLoading) return <LoadingSpinner />

  return (
    <div className='mt-8'>
			<h3 className='text-2xl font-bold' style={{ color: '#901414' }}>People Also Bought</h3>
			<div className='mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
				{Array.isArray(recommendations) && recommendations.map((product, index) => (
					<div
						key={product._id}
						className="bg-white p-2 rounded-lg group hover:shadow-xl hover:border-2 hover:border-[#901414] hover:bg-[#f8f3ed] hover:scale-110 hover:z-10 hover:rounded-2xl relative transition-all duration-300 max-w-48 mx-auto"
					>
						{/* Hot Pick Icon for top 3 products */}
						{index < 3 && (
							<div className='absolute top-1 right-1 z-10 flex items-center gap-1 rounded-full bg-[#ffe7e6] px-1.5 py-0.5 shadow'>
								<Flame size={12} className='text-[#c81d25]' />
								<span className='text-xs font-semibold text-[#c81d25]'>Hot Pick</span>
							</div>
						)}
						<div className="aspect-square mb-2 overflow-hidden rounded-lg">
							<img
								src={product.image}
								alt={product.name}
								className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
							/>
						</div>
						<h3 className="text-sm font-bold text-[#030105] mb-1 line-clamp-2">{product.name}</h3>
						<div className="flex justify-center items-center mb-1">
							<span className="text-base text-[#901414]">₱{product.price.toFixed(2)}</span>
						</div>
						<div className="flex justify-center items-center mb-2">
							<span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
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
							onClick={async () => {
								if (user?.role === 'admin') return;
								const result = await addToCart(product);
								setButtonStateById((prev) => ({
									...prev,
									[product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle'
								}));
								setTimeout(() => {
									setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
								}, 1500);
							}}
							disabled={product.quantity === 0}
							className={`w-full text-white py-1 px-2 rounded-lg transition-colors duration-300 font-semibold text-xs ${
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
							className="block w-full text-center text-[#901414] py-1 px-2 rounded-lg hover:bg-[#f8f3ed] transition-colors duration-300 font-medium mt-1 opacity-0 group-hover:opacity-100 text-xs"
						>
							View Product
						</Link>
					</div>
				))}
			</div>
		</div>
  )
};

export default PeopleAlsoBought;