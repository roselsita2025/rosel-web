import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  feedback: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  product: {
    type: String,
    enum: ['pork', 'beef', 'chicken', 'seafood', 'general', ''],
    default: 'general'
  },
  isVerified: {
    type: Boolean,
    default: true // Only verified customers can submit
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for efficient queries
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ rating: 1 });
reviewSchema.index({ product: 1 });
reviewSchema.index({ isVerified: 1 });

// Static method to check daily review limit
reviewSchema.statics.checkDailyLimit = async function(userId) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayReviews = await this.countDocuments({
    userId: userId,
    createdAt: {
      $gte: today,
      $lt: tomorrow
    }
  });
  
  return todayReviews < 3;
};

// Static method to get review statistics
reviewSchema.statics.getStats = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
        ratingDistribution: {
          $push: '$rating'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalReviews: 0,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
  
  const result = stats[0];
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  
  result.ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });
  
  return {
    totalReviews: result.totalReviews,
    averageRating: Math.round(result.averageRating * 10) / 10,
    ratingDistribution: distribution
  };
};

// Static method to get random reviews
reviewSchema.statics.getRandomReviews = async function(limit = 3) {
  const reviews = await this.aggregate([
    { $sample: { size: limit } }
  ]);
  
  return reviews;
};

export default mongoose.model('Review', reviewSchema);
