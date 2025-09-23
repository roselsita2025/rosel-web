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
            className='min-h-screen bg-[#f8f3ed] pt-32 pb-8'
        >
            <div className='max-w-4xl w-full mx-auto px-4 sm:px-6 md:px-8'>
                {/* Back to Home Link */}
                <div className="mb-4">
                    <Link
                        to="/"
                        className="inline-flex items-center text-[#901414] hover:text-[#a31f17] transition-colors duration-300"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Home
                    </Link>
                </div>
                
                <h1 className='text-2xl md:text-3xl font-bold text-[#860809] mb-8 font-libre'>My Profile</h1>

            <div className='rounded-lg shadow-lg p-6 space-y-8 bg-[#fffefc]'>
                {/* Profile Picture Section */}
                <div className='flex flex-col md:flex-row items-center gap-6'>
                    <div className='relative'>
                        <div className='w-32 h-32 rounded-full bg-[#f8f3ed] shadow-lg border border-gray-300 overflow-hidden flex items-center justify-center'>
                            {profileImage ? (
                                <img src={profileImage} alt='Profile' className='w-full h-full object-cover' />
                            ) : (
                                <div className='text-[#860809] text-4xl font-semibold font-alice'>
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                        <button className='absolute -bottom-2 -left-2 w-10 h-10 bg-[#901414] hover:bg-[#7a1010] text-white rounded-full flex items-center justify-center shadow-lg transition-colors'>
                            <Camera size={20} />
                        </button>
                    </div>
                    <div className='text-center md:text-left'>
                        <h2 className='text-2xl font-semibold text-[#030105] mb-2 font-alice'>{user?.name || 'User'}</h2>
                        <p className='text-[#a31f17] font-medium mb-1 font-libre'>{user?.role || 'Customer'}</p>
                        <p className='text-[#030105] font-libre'>
                            {user?.address?.city || 'City'}, {user?.address?.country || 'Country'}
                        </p>
                    </div>
                </div>

                {/* Personal Information Section */}
                <div className='rounded-lg shadow-md p-6 bg-[#f8f3ed]'>
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-xl font-semibold text-[#860809] font-libre'>Personal Information</h3>
                        <Link 
                            to='/account-settings' 
                            className='inline-flex items-center gap-2 px-4 py-2 bg-[#ffd901] hover:bg-[#e6c200] text-[#030105] rounded-md font-medium transition-colors font-alice'
                        >
                            <Edit size={16} />
                            Edit
                        </Link>
                    </div>
                    <hr className='border-gray-300 mb-6' />
                    
                    <div className='grid md:grid-cols-3 gap-6'>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>First Name</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.name?.split(' ')[0] || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Last Name</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.name?.split(' ').slice(1).join(' ') || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Email Address</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.email || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Phone Number</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.phone || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>User Role</label>
                            <p className='text-[#030105] text-base capitalize font-libre'>{user?.role || 'Customer'}</p>
                        </div>
                    </div>
                </div>

                {/* Address Section */}
                <div className='rounded-lg shadow-md p-6 bg-[#f8f3ed]'>
                    <div className='flex items-center justify-between mb-4'>
                        <h3 className='text-xl font-semibold text-[#860809] font-libre'>Address</h3>
                        <Link 
                            to='/account-settings' 
                            className='inline-flex items-center gap-2 px-4 py-2 bg-[#ffd901] hover:bg-[#e6c200] text-[#030105] rounded-md font-medium transition-colors font-alice'
                        >
                            <Edit size={16} />
                            Edit
                        </Link>
                    </div>
                    <hr className='border-gray-300 mb-6' />
                    
                    <div className='grid md:grid-cols-3 gap-6'>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Street</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.street || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Barangay</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.barangay || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Country</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.country || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>City</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.city || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Province</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.province || 'Not provided'}</p>
                        </div>
                        <div>
                            <label className='block text-sm font-medium text-[#a31f17] mb-2 font-alice'>Postal Code</label>
                            <p className='text-[#030105] text-base font-libre'>{user?.address?.postalCode || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            </div>
            </div>
        </motion.div>
    );
}

export default ProfilePage