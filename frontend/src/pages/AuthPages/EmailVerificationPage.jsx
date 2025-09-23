import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import toast from "react-hot-toast";
import { Mail, Loader, CheckCircle } from "lucide-react";

const EmailVerificationPage = () => {
    const [code, setCode] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);
	const navigate = useNavigate();
	const [isVerified, setIsVerified] = useState(false);

	const {error,isLoading,verifyEmail} = useAuthStore()

    const handleChange = (index, value) => {
        const newCode = [...code];

        // Handle pasted content
        if (value.length > 1) {
			const pastedCode = value.slice(0, 6).split("");
			for (let i = 0; i < 6; i++) {
				newCode[i] = pastedCode[i] || "";
			}
			setCode(newCode);

			// Focus on the last non-empty input or the first empty one
			const lastFilledIndex = newCode.findLastIndex((digit) => digit !== "");
			const focusIndex = lastFilledIndex < 5 ? lastFilledIndex + 1 : 5;
			inputRefs.current[focusIndex].focus();
		} else {
			newCode[index] = value;
			setCode(newCode);

			// Move focus to the next input field if value is entered
			if (value && index < 5) {
				inputRefs.current[index + 1].focus();
			}
		}
	};

	const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !code[index] && index > 0) {
			inputRefs.current[index - 1].focus();
		}
	};

    const handleSubmit = async (e) => {
		e.preventDefault();
		const verificationCode = code.join("");
		try {
			await verifyEmail(verificationCode);
			setIsVerified(true);
			// Navigate after a brief delay to show the success state
			setTimeout(() => {
				navigate("/");
			}, 1500);
		} catch (error) {
			console.log(error);
		}
	};

    // Auto submit when all fields are filled
	useEffect(() => {
		if (code.every((digit) => digit !== "")) {
			handleSubmit(new Event("submit"));
		}
	}, [code]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className='max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden'
      >
        <div className='p-7 pb-2'>
          <h2 className='text-lg font-semibold text-center text-black flex items-center justify-center'>
            <Mail className='w-5 h-5 mr-2' />
            Verify Your Email
          </h2>
          <p className='text-sm text-gray-500 mb-6 text-center'>
            Enter the 6-digit verification code sent to your email address.
          </p>

          <form onSubmit={handleSubmit} className='space-y-6'>
            <div className='flex justify-center space-x-3'>
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type='text'
                  maxLength='6'
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className='w-12 h-12 text-center text-xl font-bold bg-[#f8f3ed] text-[#82695b] border-2 border-[#82695b] rounded-lg focus:border-[#901414] focus:outline-none focus:ring-2 focus:ring-[#901414] focus:ring-opacity-20 transition-all duration-200'
                />
              ))}
            </div>
            
            {error && <p className='text-[#901414] font-semibold text-center mt-2'>{error}</p>}
            
            <motion.button
              whileHover={!isVerified ? { scale: 1.02 } : {}}
              whileTap={!isVerified ? { scale: 0.98 } : {}}
              type='submit'
              disabled={isLoading || code.some((digit) => !digit) || isVerified}
              className={`w-full mt-4 py-2 px-4 font-bold rounded-lg shadow-lg border transition duration-200 ${
                isVerified 
                  ? 'bg-green-600 text-white border-green-600 cursor-default' 
                  : 'bg-[#901414] text-[#feffff] border-[#901414] hover:bg-[#8F3333] hover:text-[#feffff] focus:outline-none focus:ring-2 focus:ring-[#901414] focus:ring-offset-2 disabled:opacity-50'
              }`}
            >
              {isVerified ? (
                <div className="flex items-center justify-center">
                  <CheckCircle className='w-5 h-5 mr-2' />
                  Email Verified!
                </div>
              ) : isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className='w-5 h-5 animate-spin mr-2' />
                  Verifying...
                </div>
              ) : (
                "Verify Email"
              )}
            </motion.button>
          </form>
        </div>

        <div className="px-8 py-5 bg-[#f8f3ed] flex flex-col items-center">
          <hr className="w-full border-t border-[#82695b] mb-4" />
          <p className='text-sm text-[#82695b] text-center'>
            Didn't receive the code?{" "}
            <button 
              className='text-[#901414] font-semibold hover:underline cursor-pointer'
              onClick={() => {
                // Add resend functionality here if needed
                toast.success("Verification code resent!");
              }}
            >
              Resend Code
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  )
};

export default EmailVerificationPage