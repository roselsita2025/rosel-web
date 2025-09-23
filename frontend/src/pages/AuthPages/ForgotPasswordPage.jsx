import { motion } from "framer-motion";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import Input from "../../components/Input";
import { ArrowLeft, Loader, Mail } from "lucide-react";
import { Link } from "react-router-dom";


const ForgotPasswordPage = () => {
    const [email, setEmail] = useState("");
	const [isSubmitted, setIsSubmitted] = useState(false);

    const { isLoading, forgotPassword } = useAuthStore();

    const handleSubmit = async (e) => {
		e.preventDefault();
		await forgotPassword(email);
		setIsSubmitted(true);
    };

  return (
    <motion.div
		initial={{ opacity: 0, y: 20 }}
		animate={{ opacity: 1, y: 0 }}
		transition={{ duration: 0.5 }}
		className='max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'
	>
        <div className='p-8'>
            <h2 className='text-lg font-semibold text-center text-black flex items-center justify-center'>
				Forgot Password
			</h2>

            {!isSubmitted ? (
                <form onSubmit={handleSubmit}>
                    <p className='text-sm text-gray-500 mb-6 text-center'>
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
							className='w-full mt-2 py-2 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200'
							type='submit'
						>
							{isLoading ? <Loader className='size-6 animate-spin mx-auto' /> : "Send Reset Link"}
						</motion.button>
                </form>
            ) : (
				<div className='text-center'>
					<motion.div
						initial={{ scale: 0 }}
						animate={{ scale: 1 }}
						transition={{ type: "spring", stiffness: 500, damping: 30 }}
						className='w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4'
					>
						<Mail className='h-8 w-8 text-white' />
					</motion.div>
					<p className='text-gray-300 mb-6'>
						If an account exists for {email}, you will receive a password reset link shortly.
					</p>
				</div>
            )}

        </div>
        	<div className='px-8 py-5 bg-[#fffefc] flex flex-col items-center'>
			<hr className="w-full border-t border-gray-200 mb-4" />
				<Link to={"/login"} className='text-[#a31f17] font-semibold hover:underline flex items-center'>
					<ArrowLeft className='h-4 w-4 mr-2' /> Back to Login
				</Link>
			</div>
    </motion.div>    
  )
};

export default ForgotPasswordPage;