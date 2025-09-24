import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Filter, ChevronUp, ExternalLink } from 'lucide-react';
import Footer from '../../components/Footer.jsx';
import FeedbackModal from '../../components/FeedbackModal.jsx';
import { useAuthStore } from '../../store/authStore.js';
import { useReviewStore } from '../../store/reviewStore.js';

const RatingsPage = () => {
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [ratingFilter, setRatingFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const { 
    reviews, 
    stats, 
    pagination, 
    isLoading, 
    fetchReviews, 
    fetchStats, 
    getRatingDistribution, 
    getAverageRating, 
    getTotalReviews 
  } = useReviewStore();

  const handleOpenFeedbackModal = () => {
    if (!isAuthenticated) {
      // Redirect guest users to login
      navigate('/login');
      return;
    }
    
    // Show modal for authenticated customers
    setIsFeedbackModalOpen(true);
  };

  const handleCloseFeedbackModal = () => {
    setIsFeedbackModalOpen(false);
  };

  // Fetch data on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await Promise.all([
          fetchStats(),
          fetchReviews({ page: currentPage, rating: ratingFilter, product: productFilter, search: searchTerm })
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  // Fetch reviews when filters or page change
  useEffect(() => {
    const loadReviews = async () => {
      try {
        await fetchReviews({ 
          page: currentPage, 
          rating: ratingFilter, 
          product: productFilter, 
          search: searchTerm 
        });
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    };
    loadReviews();
  }, [currentPage, ratingFilter, productFilter, searchTerm, fetchReviews]);

  const handleFilterChange = (type, value) => {
    if (type === 'rating') {
      setRatingFilter(value);
    } else if (type === 'product') {
      setProductFilter(value);
    } else if (type === 'search') {
      setSearchTerm(value);
    }
    setCurrentPage(1); // Reset to first page when filtering
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-[#f8f3ed]">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-32 pb-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm font-medium transition-colors hover:opacity-80 mb-4"
                style={{ color: '#860809' }}
              >
                <ArrowLeft size={16} />
                Back to Home
              </Link>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#030105] font-libre">
                Customer Reviews & Ratings
              </h1>
              <p className="text-lg text-[#82695b] mt-2 font-alice">
                See what our customers are saying about Rosel Frozen Meats
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Overall Rating & Distribution */}
          <div className="lg:col-span-1">
            {/* Overall Rating */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-lg mb-6"
            >
              <div className="text-center">
                {isLoading ? (
                  <div className="animate-pulse">
                    <div className="h-12 bg-gray-300 rounded mb-2"></div>
                    <div className="h-6 bg-gray-300 rounded mb-2"></div>
                    <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-5xl font-bold text-[#030105] font-libre mb-2">
                      {getAverageRating() || '0.0'}
                    </div>
                    <div className="flex items-center justify-center mb-2">
                      <span className="text-[#82695b] font-alice mr-2">Out of 5 Stars</span>
                      <div className="flex text-[#ffd901]">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            size={20} 
                            className={i < Math.floor(getAverageRating()) ? "fill-current" : "text-gray-300"} 
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-[#82695b] font-libre">
                      Overall rating of {getTotalReviews()} {getTotalReviews() === 1 ? 'review' : 'reviews'}
                    </p>
                  </>
                )}
              </div>
            </motion.div>

            {/* Star Rating Distribution */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-lg"
            >
              <h3 className="text-lg font-semibold text-[#030105] mb-4 font-libre">Rating Distribution</h3>
              
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center mb-3">
                      <div className="w-8 h-4 bg-gray-300 rounded"></div>
                      <div className="w-4 h-4 bg-gray-300 rounded mx-2"></div>
                      <div className="flex-1 h-2 bg-gray-300 rounded mx-2"></div>
                      <div className="w-8 h-4 bg-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  {[5, 4, 3, 2, 1].map((rating) => {
                    const distribution = getRatingDistribution();
                    const count = distribution[rating] || 0;
                    const total = getTotalReviews();
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    
                    return (
                      <div key={rating} className="flex items-center mb-3">
                        <span className="text-sm text-[#030105] w-8 font-alice">{rating}</span>
                        <Star size={16} className="text-[#ffd901] fill-current mx-2" />
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mx-2">
                          <div 
                            className={`h-2 rounded-full ${rating >= 4 ? 'bg-[#ff6b35]' : 'bg-gray-400'}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-[#030105] w-8 text-right font-alice">{count}</span>
                      </div>
                    );
                  })}
                </>
              )}

              {/* View Filters */}
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">Filter by Rating</label>
                  <select
                    value={ratingFilter}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm"
                  >
                    <option value="">All Ratings</option>
                    <option value="5">5 Stars</option>
                    <option value="4">4 Stars</option>
                    <option value="3">3 Stars</option>
                    <option value="2">2 Stars</option>
                    <option value="1">1 Star</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">Filter by Product</label>
                  <select
                    value={productFilter}
                    onChange={(e) => handleFilterChange('product', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm"
                  >
                    <option value="">All Products</option>
                    <option value="pork">Pork Products</option>
                    <option value="beef">Beef Products</option>
                    <option value="chicken">Chicken Products</option>
                    <option value="seafood">Seafood Products</option>
                    <option value="general">General Experience</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-[#030105] mb-2 font-alice">Search Reviews</label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="Search feedback..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#860809] focus:border-transparent font-alice text-sm"
                  />
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Company Philosophy & Reviews */}
          <div className="lg:col-span-2">
            {/* Company Philosophy */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="bg-white rounded-xl p-6 shadow-lg mb-6"
            >
              <h3 className="text-lg font-semibold text-[#030105] mb-4 font-libre">Our Commitment to Quality</h3>
              <div className="space-y-4 text-[#82695b] font-alice">
                <p>
                  We like to get feedback, and we especially like hearing when our client thinks it was a job well done.
                </p>
                <p>
                  We're more than happy to let our customers speak on our behalf, because word of mouth drives our success.
                </p>
                <p>
                  We don't do a huge amount of advertising, it's expensive, and we would rather show you than tell you. 
                  So if you're looking at the online reviews, we hope you'll get a feel for what it is we do here.
                </p>
              </div>
              
              {/* Leave Feedback Button */}
              <div className="mt-6">
                <button 
                  onClick={handleOpenFeedbackModal}
                  className="bg-[#ff6b35] text-white px-6 py-3 rounded-lg hover:bg-[#e55a2b] transition-colors font-alice font-semibold"
                >
                  Leave Us Feedback
                </button>
              </div>
            </motion.div>

            {/* Individual Reviews */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-4"
            >
              {isLoading ? (
                // Loading state
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={`loading-${index}`} className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="animate-pulse">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center">
                          <div className="flex space-x-1 mr-3">
                            {[...Array(5)].map((_, i) => (
                              <div key={i} className="w-4 h-4 bg-gray-300 rounded"></div>
                            ))}
                          </div>
                          <div className="space-y-1">
                            <div className="h-4 bg-gray-300 rounded w-24"></div>
                            <div className="h-3 bg-gray-300 rounded w-20"></div>
                          </div>
                        </div>
                        <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-300 rounded"></div>
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : reviews.length > 0 ? (
                // Dynamic reviews
                reviews.map((review, index) => (
                  <div key={review._id} className="bg-white rounded-xl p-6 shadow-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center">
                        <div className="flex text-[#ffd901] mr-3">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              className={i < review.rating ? "fill-current" : "text-gray-300"} 
                            />
                          ))}
                        </div>
                        <div>
                          <p className="font-semibold text-[#030105] font-alice">{review.userName}</p>
                          <p className="text-sm text-[#82695b] font-libre">
                            {new Date(review.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-[#82695b] hover:text-[#860809] cursor-pointer" />
                    </div>
                    <p className="text-[#030105] font-alice">
                      {review.feedback}
                    </p>
                    {review.product && review.product !== 'general' && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full font-alice">
                          {review.product.charAt(0).toUpperCase() + review.product.slice(1)} Product
                        </span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // No reviews state
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-600 mb-2 font-libre">No Reviews Found</h3>
                  <p className="text-gray-500 text-sm mb-4 font-alice">
                    {searchTerm || ratingFilter || productFilter 
                      ? 'No reviews match your current filters. Try adjusting your search criteria.'
                      : 'No reviews have been submitted yet.'
                    }
                  </p>
                  {!searchTerm && !ratingFilter && !productFilter && (
                    <Link
                      to="/ratings"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#860809] text-white rounded-lg hover:bg-[#a31f17] transition-colors font-alice text-sm"
                    >
                      Leave Us Feedback
                    </Link>
                  )}
                </div>
              )}

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!pagination.hasPrevPage || isLoading}
                    className="px-4 py-2 text-sm font-medium text-[#a31f17] border border-gray-300 rounded-md hover:bg-[#fffefc] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2 text-sm text-[#030105] font-libre">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!pagination.hasNextPage || isLoading}
                    className="px-4 py-2 text-sm font-medium text-[#a31f17] border border-gray-300 rounded-md hover:bg-[#fffefc] disabled:opacity-50 disabled:cursor-not-allowed bg-[#fffefc] font-alice"
                  >
                    Next
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Feedback Modal */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen}
        onClose={handleCloseFeedbackModal}
      />
    </div>
  );
};

export default RatingsPage;
