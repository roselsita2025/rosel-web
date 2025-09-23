
const Input = ({ icon: Icon, ...props }) => {
  return (
    <div className='relative mb-3'>
        <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
            <Icon className='size-4 text-gray-600' />
        </div>
        <input
				{...props}
				className='w-full pl-10 pr-3 py-2 bg-white rounded-md border border-gray-100 shadow-sm focus:border-[#a31f17] focus:ring-1 focus:ring-[#a31f17] text-sm text-black placeholder-gray-500 transition duration-200'
			/>
    </div>
  )
}

export default Input