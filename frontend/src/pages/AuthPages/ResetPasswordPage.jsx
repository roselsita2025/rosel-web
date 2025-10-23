import { useState } from "react";
import { motion } from "framer-motion";
import { useAuthStore } from "../../store/authStore";
import { useNavigate, useParams, Link } from "react-router-dom";
import Input from "../../components/Input";
import { Lock, Home } from "lucide-react";
import toast from "react-hot-toast";

const ResetPasswordPage = () => {
    const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
    const { resetPassword, error, isLoading, message } = useAuthStore();

    const { token } = useParams();
	const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();

		if (password !== confirmPassword) {
			alert("Passwords do not match");
			return;
		}
		try {
			await resetPassword(token, password);

			toast.success("Password reset successfully, redirecting to login page...");
			setTimeout(() => {
				navigate("/login");
			}, 2000);
		} catch (error) {
			console.error(error);
			toast.error(error.message || "Error resetting password");
		}
	};

  return (
    <div className="flex flex-col items-center justify-center pb-10 min-h-screen w-full px-3 sm:px-4 md:px-6">
      <motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
		className='max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden relative'
	>
        {/* Home Icon */}
        <Link 
          to="/welcome" 
          className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          title="Go to Home"
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 hover:text-[#8F3333]" />
        </Link>

        <div className='p-5 sm:p-6 md:p-7 pb-2'>
            <h2 className='text-base sm:text-lg font-semibold text-center text-black flex items-center justify-center mb-1'>
              <Lock className='w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2' />
              Reset Password
			</h2>
            <p className='text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center'>
              Enter your new password below.
            </p>

            {error && <p className='text-red-500 text-xs sm:text-sm mb-3 sm:mb-4 text-center font-semibold'>{error}</p>}
		    {message && <p className='text-green-600 text-xs sm:text-sm mb-3 sm:mb-4 text-center font-semibold'>{message}</p>}

            <form onSubmit={handleSubmit}>
              <h3 className='text-xs sm:text-sm font-semibold text-black'>New Password</h3>
              <Input
                icon={Lock}
                type='password'
                placeholder='New Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />

              <h3 className='text-xs sm:text-sm font-semibold text-black'>Confirm New Password</h3>
              <Input
                icon={Lock}
                type='password'
                placeholder='Confirm New Password'
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='w-full mt-2 py-2 sm:py-2.5 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200 text-sm sm:text-base'
                type='submit'
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Set New Password"}
              </motion.button>
            </form>
        </div>

        <div className="px-5 sm:px-6 md:px-8 py-4 sm:py-5 bg-[#fffefc] flex flex-col items-center">
          <hr className="w-full border-t border-gray-200 mb-3 sm:mb-4" />
          <p className='text-xs sm:text-sm text-gray-400'>
            Remember your password?{" "}
            <Link to='/login' className='text-[#a31f17] font-semibold hover:underline'>
              Back to Login
            </Link>
          </p>
        </div>
    </motion.div>
    </div>
  );
};

export default ResetPasswordPage;