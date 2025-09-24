import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, Send, User, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore.js';
import { useReviewStore } from '../store/reviewStore.js';

const FeedbackModal = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const { submitReview, isSubmitting, error, message, clearError, clearMessage } = useReviewStore();
  const [formData, setFormData] = useState({
    name: '',
    rating: 0,
    feedback: '',
    product: ''
  });
  const [hoveredStar, setHoveredStar] = useState(0);

  // Auto-fill user name when modal opens
  useEffect(() => {
    if (isOpen && user?.name) {
      setFormData(prev => ({
        ...prev,
        name: user.name
      }));
      // Clear any previous errors
      clearError();
      clearMessage();
    }
  }, [isOpen, user?.name, clearError, clearMessage]);

  // Clear messages when modal closes
  useEffect(() => {
    if (!isOpen) {
      clearError();
      clearMessage();
    }
  }, [isOpen, clearError, clearMessage]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStarClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleStarHover = (rating) => {
    setHoveredStar(rating);
  };

  const handleStarLeave = () => {
    setHoveredStar(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    clearError();
    clearMessage();
    
    try {
      await submitReview({
        rating: formData.rating,
        feedback: formData.feedback,
        product: formData.product
      });
      
      // Reset form
      setFormData({
        name: '',
        rating: 0,
        feedback: '',
        product: ''
      });
      
      // Close modal after successful submission
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      // Error is handled by the store
      console.error('Error submitting review:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      rating: 0,
      feedback: '',
      product: ''
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
            onClick={handleClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#860809] rounded-full flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-[#030105] font-libre">Leave Your Feedback</h2>
                    <p className="text-sm text-[#82695b] font-alice">Help us improve by sharing your experience</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* Rating Section */}
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-3 font-alice">
                    How would you rate your experience? *
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleStarClick(star)}
                        onMouseEnter={() => handleStarHover(star)}
                        onMouseLeave={handleStarLeave}
                        className="focus:outline-none"
                      >
                        <Star
                          size={32}
                          className={`transition-colors ${
                            star <= (hoveredStar || formData.rating)
                              ? 'text-[#ffd901] fill-current'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    {formData.rating > 0 && (
                      <span className="ml-3 text-sm text-[#82695b] font-alice">
                        {formData.rating} out of 5 stars
                      </span>
                    )}
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                    <User className="w-4 h-4 inline mr-1" />
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    readOnly
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-alice cursor-not-allowed"
                    placeholder="Your name will be auto-filled"
                  />
                  <p className="text-xs text-[#82695b] mt-1 font-libre">
                    Name is automatically filled from your account
                  </p>
                </div>

                {/* Product Selection */}
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                    Product (Optional)
                  </label>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice"
                  >
                    <option value="">Select a product (optional)</option>
                    <option value="pork">Pork Products</option>
                    <option value="beef">Beef Products</option>
                    <option value="chicken">Chicken Products</option>
                    <option value="seafood">Seafood Products</option>
                    <option value="general">General Experience</option>
                  </select>
                </div>

                {/* Feedback Text */}
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">
                    Your Feedback *
                  </label>
                  <textarea
                    name="feedback"
                    value={formData.feedback}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice resize-none"
                    placeholder="Tell us about your experience with Rosel Frozen Meats. What did you like? What could we improve?"
                  />
                  <p className="text-xs text-[#82695b] mt-1 font-libre">
                    Minimum 10 characters required
                  </p>
                </div>

                {/* Message Display */}
                {(error || message) && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-lg mb-4 ${
                      error 
                        ? 'bg-red-50 border border-red-200 text-red-800' 
                        : 'bg-green-50 border border-green-200 text-green-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {error ? (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      <span className="font-alice text-sm">
                        {error || message}
                      </span>
                    </div>
                  </motion.div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-6 py-3 text-[#82695b] border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-alice"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!formData.name || !formData.rating || !formData.feedback || isSubmitting}
                    className="px-6 py-3 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-alice flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Submit Feedback
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default FeedbackModal;
