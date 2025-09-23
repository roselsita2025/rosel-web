import { cartStore } from "../../store/cartStore.js"
import { Minus, Plus, Trash } from "lucide-react";

const CartItem = ({ item }) => {
    const { removeFromCart, updateQuantity } = cartStore();

  return (
    <div 
		className='rounded-lg border-2 border-[#860809] p-4 shadow-sm md:p-6 bg-[#fffefc]'
	>
		<div className='flex items-center gap-4'>
			{/* Left Side - Product Image */}
			<div className='shrink-0'>
				<img 
					className='h-20 w-20 md:h-24 md:w-24 rounded-lg object-cover' 
					src={item.image} 
					alt={item.name}
				/>
			</div>

			{/* Center - Product Info and Quantity Controls */}
			<div className='flex-1 min-w-0'>
				<div className='space-y-2'>
					<h3 className='text-base font-semibold truncate text-[#030105]'>
						{item.name}
					</h3>
					<p className='text-sm text-[#a31f17]'>
						{item.category || 'General'}
					</p>
					
					{/* Stock Status */}
					<div className='mb-2'>
						<span className={`text-xs font-medium px-2 py-1 rounded-full ${
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
					<div className='flex items-center gap-2'>
						<button
							className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#860809] bg-[#f8f3ed] transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
							onClick={() => updateQuantity(item._id, (item.cartQuantity || item.quantity) - 1)}
						>
							<Minus size={14} className='text-[#030105]' />
						</button>
						<span className='w-8 text-center font-medium text-[#030105]'>
							{item.cartQuantity || item.quantity}
						</span>
						<button
							className='inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-2 border-[#860809] bg-[#f8f3ed] transition-colors hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-[#a31f17]'
							onClick={() => updateQuantity(item._id, (item.cartQuantity || item.quantity) + 1)}
						>
							<Plus size={14} className='text-[#030105]' />
						</button>
					</div>
				</div>
			</div>

			{/* Right Side - Price and Trash */}
			<div className='flex flex-col items-end gap-2'>
				<p className='text-lg font-bold text-[#860809]'>
					₱{item.price}
				</p>
				<button
					className='inline-flex items-center p-2 rounded-md transition-colors hover:opacity-80 text-[#a31f17]'
					onClick={() => removeFromCart(item._id)}
				>
					<Trash size={16} />
				</button>
			</div>
		</div>
	</div>
  )
}

export default CartItem