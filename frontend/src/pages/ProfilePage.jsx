import { motion } from "framer-motion";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { Camera, Edit, ArrowLeft } from "lucide-react";

const ProfilePage = () => {
    const { user } = useAuthStore();

    const profileImage = user?.profileImageUrl || user?.avatarUrl || user?.profileImage || user?.photoURL || user?.photo || "";

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className='min-h-screen bg-[#f8f3ed] pt-20 sm:pt-24 md:pt-32 pb-6 sm:pb-8'
        >
            <div className='max-w-4xl w-full mx-auto px-3 sm:px-4 md:px-6 lg:px-8'>
                {/* Back to Home Link */}
                <div className="mb-3 sm:mb-4">
                    <Link
                        to="/"
                        className="inline-flex items-center text-[#901414] hover:text-[#a31f17] transition-colors duration-300 text-sm sm:text-base"
                    >
                        <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                        Back to Home
                    </Link>
                </div>
                
                <h1 className='text-xl sm:text-2xl md:text-3xl font-bold text-[#860809] mb-6 sm:mb-8 font-libre'>My Profile</h1>

            <div className='rounded-lg shadow-lg p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 bg-[#fffefc]'>
                {/* Profile Picture Section */}
                <div className='flex flex-col sm:flex-col md:flex-row items-center gap-4 sm:gap-6'>
                    <div className='relative'>
                        <div className='w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#f8f3ed] shadow-lg border border-gray-300 overflow-hidden flex items-center justify-center'>
                            {profileImage ? (
                                <img src={profileImage} alt='Profile' className='w-full h-full object-cover' />
                            ) : (
                                <div className='text-[#860809] text-3xl sm:text-4xl font-semibold font-alice'>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <button className='absolute -bottom-2 -left-2 w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 bg-[#901414] hover:bg-[#7a1010] text-white rounded-full flex items-center justify-center shadow-lg transition-colors'>
                            <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>
                    <div className='text-center md:text-left'>
                        <h2 className='text-xl sm:text-2xl font-semibold text-[#030105] mb-1.5 sm:mb-2 font-alice'>{user?.name || 'User'}</h2>
                        <p className='text-[#a31f17] font-medium mb-1 font-libre text-sm sm:text-base'>{user?.role || 'Customer'}</p>
                        <p className='text-[#030105] font-libre text-sm sm:text-base'>
                            {user?.address?.city || 'City'}, {user?.address?.country || 'Country'}
                        </p>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className='rounded-lg shadow-md p-4 sm:p-6 bg-[#f8f3ed]'>
                    <div className='flex items-center justify-between mb-3 sm:mb-4'>
                        <h3 className='text-lg sm:text-xl font-semibold text-[#860809] font-libre'>Personal Information</h3>
                        <Link 
                            to='/account-settings' 
                            className='inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#ffd901] hover:bg-[#e6c200] text-[#030105] rounded-md font-medium transition-colors font-alice text-xs sm:text-sm'
                        >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Edit
                        </Link>
                    </div>
                    <hr className='border-gray-300 mb-4 sm:mb-6' />
                    
                    <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>First Name</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.name?.split(' ')[0] || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Last Name</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.name?.split(' ').slice(1).join(' ') || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Email Address</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre break-all'>{user?.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Phone Number</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>User Role</label>
                            <p className='text-[#030105] text-sm sm:text-base capitalize font-libre'>{user?.role || 'Customer'}</p>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className='rounded-lg shadow-md p-4 sm:p-6 bg-[#f8f3ed]'>
                    <div className='flex items-center justify-between mb-3 sm:mb-4'>
                        <h3 className='text-lg sm:text-xl font-semibold text-[#860809] font-libre'>Address</h3>
                        <Link 
                            to='/account-settings' 
                            className='inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-[#ffd901] hover:bg-[#e6c200] text-[#030105] rounded-md font-medium transition-colors font-alice text-xs sm:text-sm'
                        >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            Edit
                        </Link>
                    </div>
                    <hr className='border-gray-300 mb-4 sm:mb-6' />
                    
                    <div className='grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6'>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Street</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.street || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Barangay</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.barangay || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Country</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.country || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>City</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.city || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Province</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.province || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-xs sm:text-sm font-medium text-[#a31f17] mb-1.5 sm:mb-2 font-alice'>Postal Code</label>
                            <p className='text-[#030105] text-sm sm:text-base font-libre'>{user?.address?.postalCode || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </motion.div>
    );
}

export default ProfilePage