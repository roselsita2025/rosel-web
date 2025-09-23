import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import { useNavigate } from "react-router-dom";



const GiftCouponCard = () => {

    const [userInputCode, setUserInputCode] = useState("");
    const [couponMessage, setCouponMessage] = useState("");
    const [isApplying, setIsApplying] = useState(false);
    const { coupon, isCouponApplied, getMyCoupon, applyCoupon, removeCoupon } = cartStore();
    const { isAuthenticated } = useAuthStore();
    const navigate = useNavigate();


	useEffect(() => {
		if (isAuthenticated) {
			getMyCoupon();
		}
	}, [getMyCoupon, isAuthenticated]);

	useEffect(() => { 
		if(coupon) {
			setUserInputCode(coupon.code);
		}
	}, [coupon]);

	const handleApplyCoupon = async () => {
		if (!userInputCode) {
			setCouponMessage("Please enter a coupon code");
			return;
		}
		if (!isAuthenticated) {
			navigate('/login');
			return;
		}
		
		setIsApplying(true);
		setCouponMessage("");
		
		try {
			await applyCoupon(userInputCode);
			setCouponMessage("Coupon applied successfully!");
		} catch (error) {
			if (error?.response?.status === 401) {
				setCouponMessage("Please login to use coupons");
			} else {
				setCouponMessage(error.response?.data?.message || "Failed to apply coupon");
			}
		} finally {
			setIsApplying(false);
		}
	};

	const handleRemoveCoupon = async () => {
		if (!isAuthenticated) return;
		await removeCoupon();
		setUserInputCode("");
		setCouponMessage("Coupon removed successfully");
	};

  return (
    <motion.div
			className='space-y-4 rounded-lg border border-gray-300 p-4 shadow-md sm:p-6 bg-[#fffefc]'
			initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5, delay: 0.2 }}
		>
            <div className='space-y-4'>
            <div>
					<label htmlFor='voucher' className='mb-2 block text-sm font-medium text-[#a31f17] font-alice'>
						Do you have a voucher or gift card?
					</label>
					<input
						type='text'
						id='voucher'
						className='block w-full rounded-lg border border-gray-300 p-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#860809] bg-[#fffefc] text-[#030105] font-alice'
						placeholder='Enter code here (optional)'
						value={userInputCode}
						onChange={(e) => setUserInputCode(e.target.value)}
					/>
				</div>
            
                <motion.button
					type='button'
					className={`flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#a31f17] font-alice ${
						isApplying ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#860809]'
					}`}
					whileHover={!isApplying ? { scale: 1.05 } : {}}
					whileTap={!isApplying ? { scale: 0.95 } : {}}
					onClick={handleApplyCoupon}
					disabled={isApplying}
				>
					{isApplying ? (
						<>
							<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
							Applying...
						</>
					) : (
						'Apply Code'
					)}
				</motion.button>
                
                {/* Coupon Message Display */}
                {couponMessage && (
                    <div className={`mt-3 p-3 rounded-lg text-sm font-alice ${
                        couponMessage.includes('successfully') || couponMessage.includes('applied')
                            ? 'bg-green-100 text-green-800 border border-green-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                    }`}>
                        {couponMessage}
                    </div>
                )}
                </div>
                {isCouponApplied && coupon && (
				<div className='mt-4'>
						<h3 className='text-lg font-medium text-[#860809] font-libre'>Applied Coupon</h3>

						<p className='mt-2 text-sm text-[#a31f17] font-libre'>
							{coupon.code} - {coupon.type === 'percent' ? `${coupon.amount}% off` : `₱${coupon.amount} off`}
						</p>

						<motion.button
						type='button'
							className='mt-2 flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-[#860809] bg-[#a31f17] font-alice'
						whileHover={{ scale: 1.05 }}
						whileTap={{ scale: 0.95 }}
						onClick={handleRemoveCoupon}
					>
						Remove Coupon
					</motion.button>
				</div>
			)}

            {coupon && (
				<div className='mt-4'>
							<h3 className='text-lg font-medium text-[#860809] font-libre'>Your Available Coupon:</h3>
							<p className='mt-2 text-sm text-[#a31f17] font-libre'>
								{coupon.code} - {coupon.type === 'percent' ? `${coupon.amount}% off` : `₱${coupon.amount} off`}
							</p>
				</div>
			)}
            
			
		</motion.div>
		
  );


};

export default GiftCouponCard