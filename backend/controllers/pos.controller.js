import Transaction from '../models/transaction.model.js';
import Product from '../models/product.model.js';

// Create new POS transaction
export const createTransaction = async (req, res) => {
  try {
    const { items, customer, payment, cashier } = req.body;

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items are required'
      });
    }

    if (!payment || !payment.total) {
      return res.status(400).json({
        success: false,
        message: 'Payment information is required'
      });
    }

    // Validate payment method specific requirements
    if (payment.method === 'cash' && (!payment.cashReceived || payment.cashReceived < payment.total)) {
      return res.status(400).json({
        success: false,
        message: 'Cash received must be greater than or equal to total amount'
      });
    }

    if ((payment.method === 'online' || payment.method === 'bank') && !customer.referenceNumber) {
      return res.status(400).json({
        success: false,
        message: 'Reference number is required for online payment and bank transfer'
      });
    }

    if (!cashier || !cashier.id || !cashier.name) {
      return res.status(400).json({
        success: false,
        message: 'Cashier information is required'
      });
    }

    // Validate stock availability and update quantities
    const stockUpdates = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.name} not found`
        });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.name}. Available: ${product.quantity}, Requested: ${item.quantity}`
        });
      }

      stockUpdates.push({
        productId: product._id,
        currentStock: product.quantity,
        requestedQuantity: item.quantity
      });
    }

    // Calculate product subtotal (actual revenue)
    const productSubtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create transaction
    const transaction = new Transaction({
      items,
      customer: customer || {},
      payment: {
        ...payment,
        productSubtotal: productSubtotal
      },
      cashier
    });

    await transaction.save();

    // Update product quantities
    for (const update of stockUpdates) {
      await Product.findByIdAndUpdate(
        update.productId,
        { $inc: { quantity: -update.requestedQuantity } },
        { new: true }
      );
    }

    res.status(201).json({
      success: true,
      message: 'Transaction completed successfully',
      data: transaction
    });

  } catch (error) {
    console.error('POS Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process transaction',
      error: error.message
    });
  }
};

// Get transaction by ID
export const getTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id)
      .populate('items.productId', 'name image')
      .populate('cashier.id', 'name email');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.status(200).json({
      success: true,
      data: transaction
    });

  } catch (error) {
    console.error('Get Transaction Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message
    });
  }
};

// Get recent transactions (for basic history)
export const getRecentTransactions = async (req, res) => {
  try {
    const { 
      limit = 10, 
      timeframe,
      date,
      start,
      end
    } = req.query;

    // Build query filter
    const filter = {};

    // Add time filter
    if (timeframe && timeframe !== 'all') {
      const now = new Date();
      let startDate;

      switch (timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'custom':
          if (date) {
            const customDate = new Date(date);
            startDate = new Date(customDate.getFullYear(), customDate.getMonth(), customDate.getDate());
            const endDate = new Date(customDate.getTime() + 24 * 60 * 60 * 1000);
            filter.createdAt = { $gte: startDate, $lt: endDate };
          } else if (start && end) {
            const startDate = new Date(start);
            const endDate = new Date(end);
            endDate.setHours(23, 59, 59, 999); // End of day
            filter.createdAt = { $gte: startDate, $lte: endDate };
          }
          break;
      }

      if (timeframe !== 'custom' || !date) {
        filter.createdAt = { $gte: startDate };
      }
    }

    const transactions = await Transaction.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('items.productId', 'name image')
      .populate('cashier.id', 'name');

    res.status(200).json({
      success: true,
      data: transactions
    });

  } catch (error) {
    console.error('Get Recent Transactions Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
};
