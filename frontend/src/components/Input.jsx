import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const Input = ({ icon: Icon, type = 'text', ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const isPassword = type === 'password';

  const inputType = isPassword ? (isVisible ? 'text' : 'password') : type;

  return (
    <div className='relative mb-3'>
      <div className='absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none'>
        <Icon className='size-4 text-gray-600' />
      </div>
      <input
        {...props}
        type={inputType}
        className={`w-full pl-10 ${isPassword ? 'pr-10' : 'pr-3'} py-2 bg-white rounded-md border border-gray-100 shadow-sm focus:border-[#a31f17] focus:ring-1 focus:ring-[#a31f17] text-sm text-black placeholder-gray-500 transition duration-200`}
      />
      {isPassword && (
        <button
          type='button'
          aria-label='Toggle password visibility'
          className='absolute inset-y-0 right-0 flex items-center pr-3 text-gray-600'
          onMouseDown={() => setIsVisible(true)}
          onMouseUp={() => setIsVisible(false)}
          onMouseLeave={() => setIsVisible(false)}
          onTouchStart={() => setIsVisible(true)}
          onTouchEnd={() => setIsVisible(false)}
        >
          {isVisible ? <EyeOff className='size-4' /> : <Eye className='size-4' />}
        </button>
      )}
    </div>
  );
};

export default Input