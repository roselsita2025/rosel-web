import { useState } from "react";
import { ShoppingCart, Flame } from "lucide-react";
import { useAuthStore } from "../../store/authStore.js";
import { cartStore } from "../../store/cartStore.js";

const ProductCard = ({ product, isHotPick = false }) => {

    const { user } = useAuthStore();

    const { addToCart } = cartStore();
    const [buttonState, setButtonState] = useState('idle'); // idle | added | maxed

    const handleAddToCart = async () => {
        if (user?.role === "admin") {
            return;
        }
        
        console.log('ProductCard: Product data:', product);
        console.log('ProductCard: Has weight options:', product.hasWeightOptions);
        console.log('ProductCard: Weight options:', product.weightOptions);
        console.log('ProductCard: Base price per kg:', product.basePricePerKg);
        console.log('ProductCard: Product keys:', Object.keys(product));
        
        // For products with weight options, automatically select the lowest weight
        let weightOptionId = null;
        if (product.hasWeightOptions && product.weightOptions && product.weightOptions.length > 0) {
            console.log('ProductCard: Original weight options:', product.weightOptions);
            const sortedOptions = [...product.weightOptions].sort((a, b) => a.weightKg - b.weightKg);
            console.log('ProductCard: Sorted weight options (lowest first):', sortedOptions);
            weightOptionId = sortedOptions[0]._id;
            console.log('ProductCard: Selected weight option:', sortedOptions[0]);
            console.log('ProductCard: Selected weightOptionId:', weightOptionId);
        } else if (product.basePricePerKg && product.basePricePerKg > 0) {
            // Fallback: Create a synthetic weight option for products with basePricePerKg but no weight options
            console.log('ProductCard: No weight options found, but has basePricePerKg. Using legacy mode.');
        } else {
            console.log('ProductCard: No weight options and no basePricePerKg. Using legacy mode.');
        }
        
        console.log('ProductCard: Final weightOptionId:', weightOptionId);
        const result = await addToCart(product, weightOptionId);
        console.log('ProductCard: Add to cart result:', result);
        
        if (result?.status === 'success') {
            setButtonState('added');
            setTimeout(() => setButtonState('idle'), 1500);
        } else if (result?.status === 'maxed' || result?.status === 'out_of_stock') {
            setButtonState('maxed');
            setTimeout(() => setButtonState('idle'), 1500);
        }
    };

    return (
        <div className='flex w-full relative flex-col overflow-hidden rounded-lg border border-[#f7e9b8] shadow-lg bg-white hover:shadow-xl transition-shadow duration-300'>
            {isHotPick && (
                <div className='absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-[#ffe7e6] px-2 py-1 shadow'>
                    <Flame size={16} className='text-[#c81d25]' />
                    <span className='text-xs font-semibold text-[#c81d25]'>Hot Pick</span>
                </div>
            )}
            <div className='relative mx-3 mt-3 flex h-48 overflow-hidden rounded-xl'>
                <img className='object-cover w-full' src={product.image} alt='product image' />
                <div className='absolute inset-0 bg-black bg-opacity-10' />
            </div>

            <div className='mt-4 px-5 pb-5'>
                <h5 className='text-xl font-semibold tracking-tight text-[#030105]'>{product.name}</h5>
                <div className='mt-2 mb-3 flex items-center justify-between'>
                    <p>
                        <span className='text-3xl font-bold text-[#860809]'>₱{product.priceMin || product.price || 0}</span>
                    </p>
                </div>
                <div className='mb-3'>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                        (product.totalStockUnits || product.quantity) > 10 
                            ? 'bg-green-100 text-green-800' 
                            : (product.totalStockUnits || product.quantity) > 0 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-red-100 text-red-800'
                    }`}>
                        {(product.totalStockUnits || product.quantity) > 0 ? `${product.totalStockUnits || product.quantity} in stock` : 'Out of stock'}
                    </span>
                </div>
                <button
                    className={`flex items-center justify-center rounded-lg px-5 py-2.5 text-center text-sm font-medium
                     text-white focus:outline-none focus:ring-4 focus:ring-[#f7e9b8] transition-colors duration-300 ${
                        (product.totalStockUnits || product.quantity) > 0 
                            ? buttonState === 'added' 
                                ? 'bg-emerald-600'
                                : buttonState === 'maxed'
                                    ? 'bg-red-600'
                                    : 'bg-[#860809] hover:bg-[#a31f17]'
                            : 'bg-gray-400 cursor-not-allowed'
                    }`}
                    onClick={handleAddToCart}
                    disabled={(product.totalStockUnits || product.quantity) === 0}
                >
                    <ShoppingCart size={22} className='mr-2' />
                    {(product.totalStockUnits || product.quantity) > 0 
                        ? buttonState === 'added' 
                            ? 'Product Added' 
                            : buttonState === 'maxed' 
                                ? 'Maxed item' 
                                : 'Add to cart' 
                        : 'Out of stock'}
                </button>
            </div>
        </div>
    );
};
export default ProductCard;