import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    unique: true
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    }
  }],
  customer: {
    name: {
      type: String,
      default: ''
    },
    phone: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      default: ''
    },
    referenceNumber: {
      type: String,
      default: ''
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['cash', 'online', 'bank'],
      default: 'cash'
    },
    subtotal: {
      type: Number,
      required: true
    },
    tax: {
      type: Number,
      required: true
    },
    discount: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    // Revenue breakdown for accurate analytics
    productSubtotal: {
      type: Number,
      required: true
    },
    cashReceived: {
      type: Number,
      default: 0
    },
    change: {
      type: Number,
      default: 0
    }
  },
  cashier: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    }
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Generate unique transaction ID
transactionSchema.pre('save', async function(next) {
  if (!this.transactionId) {
    try {
      const count = await mongoose.model('Transaction').countDocuments();
      this.transactionId = `TXN-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
    } catch (error) {
      // Fallback if countDocuments fails
      this.transactionId = `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    }
  }
  next();
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
