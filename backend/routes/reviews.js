import express from 'express';
import Review from '../models/Review.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews with pagination and filtering
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const rating = req.query.rating;
    const product = req.query.product;
    const search = req.query.search;
    
    const skip = (page - 1) * limit;
    
    // Build filter object
    const filter = {};
    
    if (rating) {
      filter.rating = parseInt(rating);
    }
    
    if (product && product !== 'all') {
      filter.product = product;
    }
    
    if (search) {
      filter.feedback = { $regex: search, $options: 'i' };
    }
    
    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-__v');
    
    const totalReviews = await Review.countDocuments(filter);
    const totalPages = Math.ceil(totalReviews / limit);
    
    res.json({
      success: true,
      data: {
        reviews,
        pagination: {
          currentPage: page,
          totalPages,
          totalReviews,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching reviews'
    });
  }
});

// @route   GET /api/reviews/stats
// @desc    Get review statistics
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const stats = await Review.getStats();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching review stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching review statistics'
    });
  }
});

// @route   GET /api/reviews/random
// @desc    Get random reviews for welcome page
// @access  Public
router.get('/random', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 3;
    const reviews = await Review.getRandomReviews(limit);
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching random reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching random reviews'
    });
  }
});

// @route   POST /api/reviews
// @desc    Submit a new review
// @access  Private (Customer only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { rating, feedback, product } = req.body;
    
    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }
    
    if (!feedback || feedback.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must be at least 10 characters long'
      });
    }
    
    if (feedback.trim().length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Feedback must not exceed 500 characters'
      });
    }
    
    // Check if user is verified customer
    if (req.user.role !== 'customer' || !req.user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Only verified customers can submit reviews'
      });
    }
    
    // Check daily review limit
    const canSubmit = await Review.checkDailyLimit(req.user._id);
    if (!canSubmit) {
      return res.status(429).json({
        success: false,
        message: 'You have reached the daily limit of 3 reviews. Please try again tomorrow.'
      });
    }
    
    // Create review
    const review = new Review({
      userId: req.user._id,
      userName: req.user.name,
      rating: parseInt(rating),
      feedback: feedback.trim(),
      product: product || 'general',
      isVerified: true
    });
    
    await review.save();
    
    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review
    });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting review'
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review (own reviews only)
// @access  Private (Customer only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }
    
    // Check if user owns the review
    if (review.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own reviews'
      });
    }
    
    await Review.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting review'
    });
  }
});

// @route   GET /api/reviews/user/:userId
// @desc    Get reviews by specific user
// @access  Private (Own reviews only)
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    // Check if user is requesting their own reviews
    if (req.params.userId !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only view your own reviews'
      });
    }
    
    const reviews = await Review.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user reviews'
    });
  }
});

export default router;
