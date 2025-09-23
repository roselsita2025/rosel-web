import { motion } from "framer-motion";
import { Loader, Lock, LucideAward, LucideShield, LucideTruck, Mail, User, LucideUserPlus } from "lucide-react";
import { useState } from "react";
import Input from "../../components/Input";
import { Link, useNavigate } from "react-router-dom";
import PasswordStrengthMeter from "../../components/PasswordStrengthMeter";
import { useAuthStore } from "../../store/authStore";

const SignUpPage = () => {

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [localError, setLocalError] = useState("");
	const [agreed, setAgreed] = useState(false);
	const navigate = useNavigate();

	const {signup,error,isLoading} = useAuthStore();

    const handleSignUp = async (e) => {
        e.preventDefault();

		try {
			const policyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
			if (!policyRegex.test(password)) {
				setLocalError("Password must be at least 6 chars and include uppercase, lowercase, number, and special character");
				return;
			}
			if (password !== confirmPassword) {
				setLocalError("Passwords do not match");
				return;
			}
			if (!agreed) {
				setLocalError("Please agree to the Terms of Use and Privacy Policy");
				return;
			}
			setLocalError("");

			await signup(email,password,name);
			navigate("/verify-email");
		} catch (error) {
			console.log(error);
		}
	};
  
    return (
<div className="flex flex-col items-center justify-center min-h-screen w-full px-4">

        <motion.div
            initial={{ opacity: 0, y: 20 }}
		    animate={{ opacity: 1, y: 0 }}
		    transition={{ duration: 0.5 }}
		    className='max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'
        >
            <div className='p-7 pt-4 pb-2'>
		        <h2 className='text-lg font-semibold mb-1 text-center text-black flex items-center justify-center'>
			        <LucideUserPlus className='w-5 h-5 mr-2 text-black' />
			        Create Account
		        </h2>
				<p className='text-sm text-gray-500 mb-5 text-center'>Welcome to our platform! Please enter your details.</p>

                <form onSubmit={handleSignUp}>
					<h3 className='text-sm font-semibold text-black'>Full Name</h3>
                    <Input
						icon={User}
						type='text'
						placeholder='Full Name'
						value={name}
						onChange={(e) => setName(e.target.value)}
					/>
					<h3 className='text-sm font-semibold text-black'>Email Address</h3>
                    <Input
						icon={Mail}
						type='email'
						placeholder='Email Address'
						value={email}
						onChange={(e) => setEmail(e.target.value)}
					/>
					<h3 className='text-sm font-semibold text-black'>Password</h3>
                    <Input
						icon={Lock}
						type='password'
						placeholder='Password'
						value={password}
						onChange={(e) => setPassword(e.target.value)}
					/>
					<h3 className='text-sm font-semibold text-black'>Confirm Password</h3>
					<Input
						icon={Lock}
						type='password'
						placeholder='Confirm Password'
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
					/>
					{(localError || error) && <p className='text-red-500 font-semibold mt-2'>{localError || error}</p>}
					<PasswordStrengthMeter password={password} />

					<div className='mt-3 flex items-start gap-2 text-sm text-gray-600'>
						<input
							id='agree'
							type='checkbox'
							checked={agreed}
							onChange={(e) => setAgreed(e.target.checked)}
							required
							className='mt-1 h-4 w-4 rounded border-gray-300 text-[#8F3333] focus:ring-[#a31f17]'
						/>
						<label htmlFor='agree' className='leading-5'>
							By creating and/or using your account, you agree to our {""}
							<Link to='/terms-of-service' className='text-[#a31f17] font-semibold hover:underline'>Terms of Use</Link>{" "}
							and {""}
							<Link to='/privacy-policy' className='text-[#a31f17] font-semibold hover:underline'>Privacy Policy</Link>.
						</label>
					</div>

                    <motion.button
                    className='w-full mt-2 py-2 px-4 bg-[#8F3333] text-[#fffefc] font-bold rounded-lg shadow-lg border border-[#a31f17] hover:bg-[#a31f17] hover:text-[#fffefc] focus:outline-none focus:ring-2 focus:ring-[#a31f17] focus:ring-offset-2 transition duration-200'
					whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
					type='submit'
					disabled={isLoading}
                    >
                        {isLoading ? <Loader className=' animate-spin mx-auto' size={24} /> : "Sign Up"}
                    </motion.button>
                </form>
            </div>

            <div className="px-8 py-5 bg-[#fffefc] flex flex-col items-center">
			<hr className="w-full border-t border-gray-200 mb-4" />
                <p className='text-sm text-gray-400'>
					Already have an account?{" "}
					<Link to={"/login"} className='text-[#a31f17] font-semibold hover:underline '>
						Login
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
    )
}

export default SignUpPage