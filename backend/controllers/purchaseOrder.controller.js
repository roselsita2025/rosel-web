import PurchaseOrder from '../models/purchaseOrder.model.js';
import Product from '../models/product.model.js';
import { createActivityLog } from './activityLog.controller.js';

/**
 * Create a new purchase order
 * POST /api/purchase-orders
 */
export const createPurchaseOrder = async (req, res) => {
    try {
        const { supplier, items } = req.body;
        
        if (!supplier || !supplier.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Supplier is required'
            });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Purchase order must contain at least one item'
            });
        }
        
        // Validate all items have the same supplier and fetch product details
        const products = await Product.find({
            _id: { $in: items.map(item => item.productId) }
        });
        
        const itemsWithDetails = [];
        let subtotal = 0;
        
        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.productId);
            
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: `Product ${item.productId} not found`
                });
            }
            
            // Verify supplier matches
            if (product.supplier && product.supplier !== supplier) {
                return res.status(400).json({
                    success: false,
                    message: `Product "${product.name}" belongs to supplier "${product.supplier}", not "${supplier}". All products must be from the same supplier.`
                });
            }
            
            // Calculate unit price (base price - markup)
            const basePrice = product.basePricePerKg || 0;
            const markup = parseFloat(process.env.PRODUCT_MARKUP || '0') || 0;
            const unitPrice = Math.max(0, (basePrice * item.weightKg) - markup);
            const totalPrice = unitPrice * item.quantity;
            
            // Get weight option if specified
            let weightOptionId = null;
            if (item.weightOptionId && product.weightOptions) {
                // If weightOptionId is provided, use it
                const weightOption = product.weightOptions.id(item.weightOptionId);
                if (weightOption) {
                    weightOptionId = weightOption._id;
                }
            } else if (item.weightKg && product.weightOptions) {
                // If no weightOptionId but weightKg is provided, find by weightKg
                const weightOption = product.weightOptions.find(opt => 
                    Math.abs(opt.weightKg - item.weightKg) < 0.01
                );
                if (weightOption) {
                    weightOptionId = weightOption._id;
                }
            }
            
            itemsWithDetails.push({
                productId: product._id,
                productName: product.name,
                category: product.category,
                weightOptionId: weightOptionId,
                weightKg: item.weightKg,
                quantity: item.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice
            });
            
            subtotal += totalPrice;
        }
        
        // Create purchase order as completed by default
        const purchaseOrder = await PurchaseOrder.create({
            admin: req.user.id,
            adminName: req.user.name,
            supplier: supplier.trim(),
            items: itemsWithDetails,
            subtotal,
            totalAmount: subtotal,
            status: 'completed',
            completedAt: new Date()
        });
        
        // Update product stocks immediately
        for (const item of itemsWithDetails) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                console.warn(`Product ${item.productId} not found, skipping...`);
                continue;
            }
            
            try {
                let weightOption = null;
                if (item.weightOptionId && product.weightOptions) {
                    // Update weight-based stock using weightOptionId
                    weightOption = product.weightOptions.id(item.weightOptionId);
                } else if (item.weightKg && product.weightOptions) {
                    // Find weight option by weightKg if weightOptionId is not provided
                    weightOption = product.weightOptions.find(opt => 
                        Math.abs(opt.weightKg - item.weightKg) < 0.01
                    );
                }
                
                if (weightOption) {
                    const oldStock = weightOption.stockUnits || 0;
                    weightOption.stockUnits = oldStock + item.quantity;
                    await product.save();
                    
                    // Log activity
                    await createActivityLog({
                        productId: product._id,
                        productName: product.name,
                        action: 'stock_in',
                        details: `Stock increased by ${item.quantity} units (${item.weightKg}kg) via purchase order ${purchaseOrder.purchaseOrderId}`,
                        adminId: req.user.id,
                        adminName: req.user.name,
                        changes: {
                            stockUnits: { from: oldStock, to: weightOption.stockUnits },
                            weightKg: item.weightKg
                        },
                        quantityChange: item.quantity,
                        newQuantity: weightOption.stockUnits
                    });
                } else if (!item.weightKg) {
                    // Only update legacy product stock if no weight option was found and no weightKg specified
                    // Update legacy product stock
                    const oldStock = product.quantity || 0;
                    product.quantity = oldStock + item.quantity;
                    await product.save();
                    
                    await createActivityLog({
                        productId: product._id,
                        productName: product.name,
                        action: 'stock_in',
                        details: `Stock increased by ${item.quantity} units via purchase order ${purchaseOrder.purchaseOrderId}`,
                        adminId: req.user.id,
                        adminName: req.user.name,
                        changes: {
                            quantity: { from: oldStock, to: product.quantity }
                        },
                        quantityChange: item.quantity,
                        newQuantity: product.quantity
                    });
                }
            } catch (error) {
                console.error(`Error updating stock for product ${item.productId}:`, error);
            }
        }
        
        await purchaseOrder.populate('admin', 'name email');
        
        res.status(201).json({
            success: true,
            data: purchaseOrder,
            message: 'Purchase order created successfully'
        });
        
    } catch (error) {
        console.error('Create purchase order error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create purchase order',
            error: error.message
        });
    }
};

/**
 * Get all purchase orders with filters
 * GET /api/purchase-orders
 */
export const getPurchaseOrderHistory = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 50,
            status,
            supplier,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;
        
        const filter = {};
        
        if (status) filter.status = status;
        if (supplier) filter.supplier = { $regex: supplier, $options: 'i' };
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }
        
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [purchaseOrders, total] = await Promise.all([
            PurchaseOrder.find(filter)
                .populate('admin', 'name email')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            PurchaseOrder.countDocuments(filter)
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                purchaseOrders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalPurchases: total,
                    pageSize: purchaseOrders.length
                }
            },
            message: 'Purchase order history retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get purchase order history error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase order history',
            error: error.message
        });
    }
};

/**
 * Get purchase order by ID
 * GET /api/purchase-orders/:id
 */
export const getPurchaseOrderById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchaseOrder = await PurchaseOrder.findById(id)
            .populate('admin', 'name email')
            .lean();
        
        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }
        
        res.status(200).json({
            success: true,
            data: purchaseOrder,
            message: 'Purchase order retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get purchase order by ID error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve purchase order',
            error: error.message
        });
    }
};

/**
 * Complete a purchase order (update stocks)
 * POST /api/purchase-orders/:id/complete
 */
export const completePurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchaseOrder = await PurchaseOrder.findById(id);
        
        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }
        
        if (purchaseOrder.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Purchase order is already ${purchaseOrder.status}`
            });
        }
        
        // Update product stocks and create activity logs
        for (const item of purchaseOrder.items) {
            const product = await Product.findById(item.productId);
            
            if (!product) {
                console.warn(`Product ${item.productId} not found, skipping...`);
                continue;
            }
            
            try {
                if (item.weightOptionId && product.weightOptions) {
                    // Update weight-based stock
                    const weightOption = product.weightOptions.id(item.weightOptionId);
                    if (weightOption) {
                        const oldStock = weightOption.stockUnits;
                        weightOption.stockUnits = (oldStock || 0) + item.quantity;
                        await product.save();
                        
                        // Log activity
                        await createActivityLog({
                            productId: product._id,
                            productName: product.name,
                            action: 'stock_in',
                            details: `Stock increased by ${item.quantity} units (${item.weightKg}kg) via purchase order`,
                            adminId: req.user.id,
                            adminName: req.user.name,
                            changes: {
                                stockUnits: { from: oldStock, to: weightOption.stockUnits },
                                weightKg: item.weightKg
                            },
                            quantityChange: item.quantity,
                            oldQuantity: oldStock,
                            newQuantity: weightOption.stockUnits
                        });
                    }
                } else {
                    // Update legacy stock
                    const oldQuantity = product.quantity || 0;
                    product.quantity = oldQuantity + item.quantity;
                    await product.save();
                    
                    // Log activity
                    await createActivityLog({
                        productId: product._id,
                        productName: product.name,
                        action: 'stock_in',
                        details: `Stock increased by ${item.quantity} units via purchase order`,
                        adminId: req.user.id,
                        adminName: req.user.name,
                        changes: {
                            quantity: { from: oldQuantity, to: product.quantity }
                        },
                        quantityChange: item.quantity,
                        oldQuantity: oldQuantity,
                        newQuantity: product.quantity
                    });
                }
            } catch (error) {
                console.error(`Error updating stock for product ${item.productId}:`, error);
            }
        }
        
        // Update purchase order status
        purchaseOrder.status = 'completed';
        purchaseOrder.completedAt = new Date();
        purchaseOrder.updatedAt = new Date();
        await purchaseOrder.save();
        
        await purchaseOrder.populate('admin', 'name email');
        
        res.status(200).json({
            success: true,
            data: purchaseOrder,
            message: 'Purchase order completed successfully'
        });
        
    } catch (error) {
        console.error('Complete purchase order error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to complete purchase order',
            error: error.message
        });
    }
};

/**
 * Cancel a purchase order
 * POST /api/purchase-orders/:id/cancel
 */
export const cancelPurchaseOrder = async (req, res) => {
    try {
        const { id } = req.params;
        
        const purchaseOrder = await PurchaseOrder.findById(id);
        
        if (!purchaseOrder) {
            return res.status(404).json({
                success: false,
                message: 'Purchase order not found'
            });
        }
        
        if (purchaseOrder.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel ${purchaseOrder.status} purchase order`
            });
        }
        
        purchaseOrder.status = 'cancelled';
        purchaseOrder.updatedAt = new Date();
        await purchaseOrder.save();
        
        await purchaseOrder.populate('admin', 'name email');
        
        res.status(200).json({
            success: true,
            data: purchaseOrder,
            message: 'Purchase order cancelled successfully'
        });
        
    } catch (error) {
        console.error('Cancel purchase order error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel purchase order',
            error: error.message
        });
    }
};

/**
 * Get purchase order analytics
 * GET /api/purchase-orders/analytics
 */
export const getPurchaseOrderAnalytics = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const dateFilter = {};
        if (startDate || endDate) {
            dateFilter.createdAt = {};
            if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
            if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
        }
        
        const completedFilter = { ...dateFilter, status: 'completed' };
        
        const [
            totalPurchases,
            totalSpent,
            averageOrderValue,
            topSuppliers,
            monthlySpending
        ] = await Promise.all([
            PurchaseOrder.countDocuments(completedFilter),
            PurchaseOrder.aggregate([
                { $match: completedFilter },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } }
            ]),
            PurchaseOrder.aggregate([
                { $match: completedFilter },
                { $group: { _id: null, avg: { $avg: '$totalAmount' } } }
            ]),
            PurchaseOrder.aggregate([
                { $match: completedFilter },
                { $group: { _id: '$supplier', totalSpent: { $sum: '$totalAmount' }, orderCount: { $sum: 1 } } },
                { $sort: { totalSpent: -1 } },
                { $limit: 5 }
            ]),
            PurchaseOrder.aggregate([
                { $match: completedFilter },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        totalSpent: { $sum: '$totalAmount' },
                        orderCount: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 12 }
            ])
        ]);
        
        res.status(200).json({
            success: true,
            data: {
                totalPurchases,
                totalSpent: totalSpent[0]?.total || 0,
                averageOrderValue: averageOrderValue[0]?.avg || 0,
                topSuppliers,
                monthlySpending
            },
            message: 'Analytics retrieved successfully'
        });
        
    } catch (error) {
        console.error('Get purchase order analytics error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve analytics',
            error: error.message
        });
    }
};
