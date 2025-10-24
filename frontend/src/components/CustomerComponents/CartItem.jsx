import { cartStore } from "../../store/cartStore.js"
import { Minus, Plus, Trash } from "lucide-react";

const CartItem = ({ item }) => {
    const { removeFromCart, updateQuantity } = cartStore();

  return (
    <div 
		className='rounded-lg border-2 border-[#860809] p-3 sm:p-4 md:p-6 shadow-sm bg-[#fffefc]'
	>
		<div className='flex items-center gap-2 sm:gap-3 md:gap-4'>
			{/* Left Side - Product Image */}
			<div className='shrink-0'>
				<img 
					className='h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 rounded-lg object-cover' 
					src={item.image} 
					alt={item.name}
				/>
			</div>

			{/* Center - Product Info and Quantity Controls */}
			<div className='flex-1 min-w-0'>
				<div className='space-y-1.5 sm:space-y-2'>
					<h3 className='text-sm sm:text-base font-semibold truncate text-[#030105]'>
						{item.name}
					</h3>
					<p className='text-xs sm:text-sm text-[#a31f17]'>
						{item.category || 'General'}
					</p>
					{/* Weight Information */}
					{item.weightOptionId && item.weightKg && (
						<p className='text-xs sm:text-sm text-[#860809] font-medium'>
							Weight: {item.weightKg} kg
						</p>
					)}
					
					{/* Stock Status */}
					<div className='mb-1 sm:mb-2'>
						<span className={`text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
							item.stockQuantity > 10 
								? 'bg-green-100 text-green-800' 
								: item.stockQuantity > 0 
									? 'bg-yellow-100 text-yellow-800' 
									: 'bg-red-100 text-red-800'
						}`}>
							{item.stockQuantity > 0 ? `${item.stockQuantity} in stock` : 'Out of stock'}
						</span>
					</div>
					
					{/* Quantity Controls */}
					<div className='flex items-center gap-1.5 sm:gap-2'>
						<button
							className='inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#860809] bg-[#f8f3ed] transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
							onClick={() => updateQuantity(item._id, (item.cartQuantity || item.quantity) - 1, item.weightOptionId)}
						>
							<Minus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#030105]" />
						</button>
						<span className='w-7 sm:w-8 text-center font-medium text-[#030105] text-sm sm:text-base'>
							{item.cartQuantity || item.quantity}
						</span>
						<button
							className='inline-flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#860809] bg-[#f8f3ed] transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
							onClick={() => updateQuantity(item._id, (item.cartQuantity || item.quantity) + 1, item.weightOptionId)}
						>
							<Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#030105]" />
						</button>
					</div>
				</div>
			</div>

			{/* Right Side - Price and Trash */}
			<div className='flex flex-col items-end gap-1.5 sm:gap-2'>
				<p className='text-base sm:text-lg font-bold text-[#860809]'>
					₱{(item.unitPrice || item.price).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
				</p>
				<button
					className='inline-flex items-center p-1.5 sm:p-2 rounded-md transition-colors hover:opacity-80 text-[#a31f17]'
					onClick={() => removeFromCart(item._id, item.weightOptionId)}
				>
					<Trash className="w-4 h-4 sm:w-4 sm:h-4" />
				</button>
			</div>
		</div>
	</div>
  )
}

export default CartItem