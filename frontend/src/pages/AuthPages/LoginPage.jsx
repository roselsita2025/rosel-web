import { motion } from "framer-motion";
import { useState } from "react";
import { Mail, Lock, Loader, LucideShield, LucideTruck, LucideAward, LucideUser } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../../components/Input";
import { useAuthStore } from "../../store/authStore";

const LoginPage = () => {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");

  const { login, verifyLoginOtp, resendLoginOtp, isLoading, error, otpRequired, pendingEmail, message } = useAuthStore();


  const handleLogin = async (e) => {
		e.preventDefault();
		await login(email, password);
	};
  
  const handleVerify = async (e) => {
    e.preventDefault();
    await verifyLoginOtp(code);
  };

  return (
    <div className="flex flex-col items-center justify-center pb-10 min-h-screen w-full px-4">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.5 }}
			className='max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'
      >
        <div className='p-7 pb-2'>
				<h2 className='text-lg font-semibold text-center text-black flex items-center justify-center'>
					<LucideUser className='w-5 h-5 mr-2' />
					Sign In to Your Account
				</h2>
				<p className='text-sm text-gray-500 mb-6 text-center'>Welcome back! Please enter your details.</p>
      
        {!otpRequired ? (
        <form onSubmit={handleLogin}>
					<h3 className='text-sm font-semibold text-black'>Email Address</h3>
					<Input
						icon={Mail}
						type='email'
						placeholder='Enter your email'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>

					<h3 className='text-sm font-semibold text-black'>Password</h3>
					<Input
						icon={Lock}
						type='password'
						placeholder='Enter your password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>

					{error && <p className='text-red-500 font-semibold mb-2'>{error}</p>}
					
          <motion.button
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
						className='w-full mt-2 py-2 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200'
						type='submit'
            disabled={isLoading}
					>
            {isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Login"}
          </motion.button>

			<div className='flex items-center justify-center mt-5'>
				<Link to='/forgot-password' className='text-sm font-semibold text-[#a31f17] hover:underline'>
					Forgot password?
				</Link>
			</div>
			
        </form>
        ) : (
          <form onSubmit={handleVerify}>
            <h3 className='text-sm font-semibold text-black'>Verification Code</h3>
            <Input
              icon={Lock}
              type='text'
              placeholder='Enter the 6-digit code'
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            {pendingEmail && <p className='text-xs text-gray-500 mt-1'>Code sent to {pendingEmail}</p>}
            {message && <p className='text-green-600 font-semibold mt-2'>{message}</p>}
            {error && <p className='text-red-500 font-semibold mt-2'>{error}</p>}
            <div className='flex items-center justify-between mt-2'>
              <button
                type='button'
                onClick={resendLoginOtp}
                className='text-sm font-semibold text-[#a31f17] hover:underline disabled:opacity-50'
                disabled={isLoading}
              >
                Resend Code
              </button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className='py-2 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200'
                type='submit'
                disabled={isLoading}
              >
                {isLoading ? <Loader className='w-6 h-6 animate-spin  mx-auto' /> : "Verify"}
              </motion.button>
            </div>
          </form>
        )}
      </div>

    	<div className="px-8 py-5 bg-[#fffefc] flex flex-col items-center">
			<hr className="w-full border-t border-gray-200 mb-4" />
			<p className='text-sm text-gray-400'>
				Don't have an account?{" "}
				<Link to='/signup' className='text-[#a31f17] font-semibold hover:underline '>
					Sign up
				</Link>
			</p>
		</div>

    </motion.div>

	{/* <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  <section className="mt-12 py-5 bg-[#ffffff]">
    <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-8">
      <div className="flex flex-col items-center bg-[#f7e9b8] p-6 rounded-2xl shadow-md w-64 h-56">
        <div className="w-14 h-14 bg-[#fff0f3] rounded-xl flex items-center justify-center">
          <LucideShield name="shield" className="w-8 h-8 text-[#8F3333]" />
        </div>
        <h2 className="text-base font-semibold text-[#030105] text-center mt-4">Quality Guaranteed</h2>
        <p className="text-sm text-gray-500 text-center mt-4">We source our meats from trusted farms and ensure they are of the highest quality</p>
      </div>
      <div className="flex flex-col items-center bg-[#f7e9b8] p-6 rounded-2xl shadow-md w-64 h-56">
        <div className="w-14 h-14 bg-[#fff0f3] rounded-xl flex items-center justify-center">
          <LucideTruck name="truck" className="w-8 h-8 text-[#8F3333]" />
        </div>
        <h2 className="text-base font-semibold text-[#030105] text-center mt-4">Free Delivery</h2>
        <p className="text-sm text-gray-500 text-center mt-4">We offer free delivery to all our customers</p>
      </div>
      <div className="flex flex-col items-center bg-[#f7e9b8] p-6 rounded-2xl shadow-md w-64 h-56">
        <div className="w-14 h-14 bg-[#fff0f3] rounded-xl flex items-center justify-center">
          <LucideAward name="award-ribbon" className="w-8 h-8 text-[#8F3333]" />
        </div>
        <h2 className="text-base font-semibold text-[#030105] text-center mt-4">Premium Grade</h2>
        <p className="text-sm text-gray-500 text-center mt-4">We offer premium grade meats to our customers</p>
      </div>
    </div>
  </section>
</motion.div> */}

    </div>
  );
};

export default LoginPage;