import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { productStore } from '../../store/productStore.js'
import { cartStore } from '../../store/cartStore.js'
import { useAuthStore } from '../../store/authStore.js'
import { ShoppingCart, Eye, Search, Filter, Package, ArrowUpDown, Check } from 'lucide-react'
import Footer from '../../components/Footer.jsx'

const useQuery = () => new URLSearchParams(useLocation().search);

const SearchResultsPage = () => {
    const query = useQuery();
    const navigate = useNavigate();
    const { searchProducts, searchResults, loading } = productStore();
    const { addToCart } = cartStore();
    const { user } = useAuthStore();
    const [buttonStateById, setButtonStateById] = useState({}); // { [productId]: 'idle' | 'added' | 'maxed' }

    const [localFilters, setLocalFilters] = useState({
        q: query.get('q') || '',
        category: query.get('category') || '',
        minPrice: query.get('minPrice') || '',
        maxPrice: query.get('maxPrice') || '',
        inStock: query.get('inStock') || '',
        sort: query.get('sort') || 'createdAt',
        order: query.get('order') || 'desc',
    });

    useEffect(() => {
        const params = Object.fromEntries([...query.entries()]);
        searchProducts(params);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [useLocation().search]);

    const categories = useMemo(() => ([
        'pork','beef','chicken','sliced','processed','ground'
    ]), []);

    const handleApply = () => {
        const params = new URLSearchParams();
        Object.entries(localFilters).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                params.set(key, String(value));
            }
        });
        navigate(`/search?${params.toString()}`);
    };

    const handleSortChange = (e) => {
        setLocalFilters((prev) => ({ ...prev, sort: e.target.value.split(':')[0], order: e.target.value.split(':')[1] }));
    };

    const handleAddToCart = async (product) => {
        if (user?.role === 'admin') return;
        const result = await addToCart(product);
        setButtonStateById((prev) => ({ ...prev, [product._id]: result?.status === 'success' ? 'added' : (result?.status === 'maxed' || result?.status === 'out_of_stock') ? 'maxed' : 'idle' }));
        setTimeout(() => {
            setButtonStateById((prev) => ({ ...prev, [product._id]: 'idle' }));
        }, 1500);
    };

    return (
        <div className='min-h-screen bg-white w-full'>
            <div className='pt-20 sm:pt-24 md:pt-32 pb-8 bg-white w-full'>
                <div className='max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
                    <h1 className='text-2xl sm:text-3xl font-bold text-[#860809] mb-4 sm:mb-6'>Search Results</h1>

                    {/* Filters */}
                    <div className='bg-[#f8f3ed] rounded-lg shadow p-4 sm:p-6 mb-8 sm:mb-10'>
                        <div className='flex flex-col md:flex-row gap-4 items-center'>
                            <div className='flex flex-col md:flex-row gap-4 flex-1 w-full md:w-auto'>
                                <div className='relative flex-1'>
                                    <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 md:hidden' />
                                    <input
                                        type='text'
                                        placeholder='Search products'
                                        value={localFilters.q}
                                        onChange={(e) => setLocalFilters((p)=>({ ...p, q: e.target.value }))}
                                        className='border border-[#901414] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414] w-full pl-10 md:pl-3'
                                    />
                                </div>
                                <div className='relative flex-1'>
                                    <Filter className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 md:hidden' />
                                    <select
                                        value={localFilters.category}
                                        onChange={(e)=> setLocalFilters((p)=>({ ...p, category: e.target.value }))}
                                        className='border border-[#901414] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414] w-full pl-10 md:pl-3'
                                    >
                                        <option value=''>All categories</option>
                                        {categories.map((c)=> (
                                            <option key={c} value={c}>{c[0].toUpperCase()+c.slice(1)}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className='relative flex-1'>
                                    <Package className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 md:hidden' />
                                    <select
                                        value={localFilters.inStock}
                                        onChange={(e)=> setLocalFilters((p)=>({ ...p, inStock: e.target.value }))}
                                        className='border border-[#901414] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414] w-full pl-10 md:pl-3'
                                    >
                                        <option value=''>Any stock</option>
                                        <option value='true'>In stock</option>
                                        <option value='false'>Out of stock</option>
                                    </select>
                                </div>
                                <div className='relative flex-1'>
                                    <ArrowUpDown className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 md:hidden' />
                                    <select
                                        value={`${localFilters.sort}:${localFilters.order}`}
                                        onChange={handleSortChange}
                                        className='border border-[#901414] rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#901414] focus:border-[#901414] w-full pl-10 md:pl-3'
                                    >
                                        <option value='createdAt:desc'>Newest</option>
                                        <option value='createdAt:asc'>Oldest</option>
                                        <option value='price:asc'>Price: Low to High</option>
                                        <option value='price:desc'>Price: High to Low</option>
                                        <option value='name:asc'>Name: A-Z</option>
                                        <option value='name:desc'>Name: Z-A</option>
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleApply} className='bg-[#901414] hover:bg-[#a31f17] text-white px-6 py-2 rounded-lg font-semibold transition-colors duration-300 whitespace-nowrap flex items-center gap-2 w-full md:w-auto'>
                                <Check className='w-4 h-4 md:hidden' />
                                <span className='hidden md:inline'>Apply</span>
                                <span className='md:hidden'>Apply Filters</span>
                            </button>
                        </div>
                    </div>

                    {/* Results */}
                    {loading ? (
                        <div className='text-center text-[#030105] py-10'>Loading...</div>
                    ) : searchResults.length === 0 ? (
                        <div className='text-center text-[#030105] py-10'>No products found.</div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
                            {searchResults.map((product) => (
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
                </div>
            </div>
            <Footer />
        </div>
    )
}

export default SearchResultsPage


