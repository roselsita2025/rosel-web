import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Input from "../../components/Input";
import { ArrowLeft, Loader, Mail, Home } from "lucide-react";
import { Link } from "react-router-dom";
import { validateEmailFormat } from "../../utils/emailValidation";


const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
		e.preventDefault();
		
		// Email format validation
		const emailError = validateEmailFormat(email);
		if (emailError) {
			// Email validation error will be handled by the auth store
			return;
		}
		
		await forgotPassword(email);
		setIsSubmitted(true);
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
          <h2 className='text-base sm:text-lg font-semibold text-center text-black flex items-center justify-center'>
            <Mail className='w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2' />
            Forgot Password
          </h2>

          {!isSubmitted ? (
            <form onSubmit={handleSubmit}>
              <p className='text-xs sm:text-sm text-gray-500 mb-5 sm:mb-6 text-center'>
                Enter your email address and we'll send you a link to reset your password.
              </p>
              <Input
                icon={Mail}
                type='email'
                placeholder='Email Address'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='w-full mt-2 py-2 sm:py-2.5 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200 text-sm sm:text-base'
                type='submit'
              >
                {isLoading ? <Loader className='w-5 h-5 sm:w-6 sm:h-6 animate-spin mx-auto' /> : "Send Reset Link"}
              </motion.button>
            </form>
          ) : (
            <div className='text-center'>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className='w-14 h-14 sm:w-16 sm:h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4'
              >
                <Mail className='h-7 w-7 sm:h-8 sm:w-8 text-white' />
              </motion.div>
              <p className='text-gray-600 mb-5 sm:mb-6 text-xs sm:text-sm'>
                If an account exists for {email}, you will receive a password reset link shortly.
              </p>
            </div>
          )}
        </div>

        <div className='px-5 sm:px-6 md:px-7 py-4 sm:py-5 bg-[#fffefc] flex flex-col items-center'>
          <hr className="w-full border-t border-gray-200 mb-3 sm:mb-4" />
          <Link to={"/login"} className='text-[#a31f17] font-semibold hover:underline flex items-center text-xs sm:text-sm'>
            <ArrowLeft className='h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2' /> Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  )
};

export default ForgotPasswordPage;