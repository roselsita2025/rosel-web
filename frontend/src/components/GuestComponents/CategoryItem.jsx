import { Link } from "react-router-dom";

const CategoryItem = ({ category, isActive = false }) => {
	return (
		<div className={`relative overflow-visible h-32 w-40 rounded-lg group shadow-lg transition-all duration-300 ease-in-out hover:scale-125 hover:z-50 hover:shadow-2xl hover:rounded-2xl ${isActive ? 'ring-4 ring-[#901414] ring-opacity-80' : ''}`}>
			<Link to={"/category" + category.href}>
				<div className='w-full h-full cursor-pointer overflow-hidden rounded-lg group-hover:rounded-2xl transition-all duration-300 ease-in-out'>
					<div className='absolute inset-0 bg-gradient-to-b from-transparent to-gray-900 opacity-50 z-10' />
					<div
						className={`absolute inset-0 bg-gradient-to-b from-[#901414] to-[#f8f3ed] transition-opacity duration-500 ease-in-out z-10 pointer-events-none ${
							isActive ? 'opacity-60' : 'opacity-0 group-hover:opacity-80'
						}`}
					/>
					<img
						src={category.imageUrl}
						alt={category.name}
						className='w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-110'
						loading='lazy'
					/>
					<div className={`absolute inset-0 flex items-center justify-center p-2 z-20 transition-opacity duration-500 ease-in-out ${
						isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
					}`}>
						<h3 className="text-white text-lg font-bold font-alice">{category.name}</h3>
					</div>
				</div>
			</Link>
		</div>
	);
};

export default CategoryItem;