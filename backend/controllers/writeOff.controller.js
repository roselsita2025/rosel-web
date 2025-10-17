import WriteOff from '../models/writeOff.model.js';
import Product from '../models/product.model.js';
import { User } from '../models/user.model.js';
import { createActivityLog } from './activityLog.controller.js';
import { notificationService } from '../services/notificationService.js';

/**
 * Create a new write-off
 * POST /api/write-offs
 */
export const createWriteOff = async (req, res) => {
    try {
        const {
            productId,
            weightOptionId,
            quantity,
            reason,
            description
        } = req.body;

        const adminId = req.user._id;
        const adminName = req.user.name;

        if (!productId || !quantity || !reason || !description) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: productId, quantity, reason, description'
            });
        }

        if (quantity <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Quantity must be greater than 0'
            });
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        let unitPrice = 0;
        let weightKg = null;
        let availableStock = 0;

        if (weightOptionId) {
            const weightOption = product.weightOptions.id(weightOptionId);
            if (!weightOption) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid weight option'
                });
            }

            if (weightOption.stockUnits < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Available: ${weightOption.stockUnits}, Requested: ${quantity}`
                });
            }

            unitPrice = Number((product.basePricePerKg * weightOption.weightKg).toFixed(2));
            weightKg = weightOption.weightKg;
            availableStock = weightOption.stockUnits;
        } else {
            if (product.quantity < quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock. Available: ${product.quantity}, Requested: ${quantity}`
                });
            }

            unitPrice = product.price;
            availableStock = product.quantity;
        }

        const cost = unitPrice * quantity;

        const writeOff = new WriteOff({
            product: productId,
            weightOptionId: weightOptionId || null,
            weightKg: weightKg,
            quantity,
            reason,
            description,
            cost,
            adminId,
            adminName,
            productName: product.name,
            productCategory: product.category,
            unitPrice
        });

        await writeOff.save();

        if (weightOptionId) {
            await Product.findByIdAndUpdate(
                productId,
                { $inc: { 'weightOptions.$[elem].stockUnits': -quantity } },
                { 
                    arrayFilters: [{ 'elem._id': weightOptionId }],
                    new: true 
                }
            );
        } else {
            await Product.findByIdAndUpdate(
                productId,
                { $inc: { quantity: -quantity } },
                { new: true }
            );
        }

        try {
            await createActivityLog({
                productId: product._id,
                productName: product.name,
                action: 'write_off',
                details: `Write-off: ${quantity} units (${reason}) - ${description}`,
                adminId: adminId,
                adminName: adminName,
                changes: {
                    quantity: { from: availableStock, to: availableStock - quantity }
                },
                quantityChange: -quantity,
                oldQuantity: availableStock,
                newQuantity: availableStock - quantity,
                reason: reason,
                writeOffId: writeOff._id
            });
        } catch (logError) {
            console.error('Error logging write-off activity:', logError);
        }
        try {
            await notificationService.notifyAdmins({
                type: 'inventory_alert',
                category: 'inventory',
                subcategory: 'write_off',
                title: 'Product Write-Off',
                message: `${adminName} wrote off ${quantity} units of ${product.name} (${reason})`,
                relatedEntity: {
                    type: 'write_off',
                    id: writeOff._id
                },
                data: {
                    productName: product.name,
                    quantity,
                    reason,
                    cost,
                    adminName
                },
                priority: 'medium',
                actionUrl: `/discrepancy-reports?writeOff=${writeOff._id}`
            });
        } catch (notificationError) {
            console.error('Error sending write-off notification:', notificationError);
        }

        res.status(201).json({
            success: true,
            message: 'Write-off created successfully',
            data: writeOff
        });

    } catch (error) {
        console.error('Error creating write-off:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create write-off',
            error: error.message
        });
    }
};

/**
 * Get all write-offs with filtering and pagination
 * GET /api/write-offs
 */
export const getWriteOffs = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            reason,
            category,
            adminId,
            startDate,
            endDate,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        
        if (reason) filter.reason = reason;
        if (category) filter.productCategory = category;
        if (adminId) filter.adminId = adminId;
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        const writeOffs = await WriteOff.find(filter)
            .populate('product', 'name image category basePricePerKg weightOptions')
            .populate('adminId', 'name email')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));


        const totalWriteOffs = await WriteOff.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: {
                writeOffs,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalWriteOffs / parseInt(limit)),
                    totalWriteOffs,
                    hasNextPage: skip + writeOffs.length < totalWriteOffs,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Write-offs retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching write-offs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve write-offs',
            error: error.message
        });
    }
};

/**
 * Get write-off analytics data
 * GET /api/write-offs/analytics
 */
export const getWriteOffAnalytics = async (req, res) => {
    try {
        const {
            timeframe = 'today',
            startDate,
            endDate
        } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        switch (timeframe) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                dateFilter = { createdAt: { $gte: today } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            case 'custom':
                if (startDate || endDate) {
                    dateFilter = {};
                    if (startDate) dateFilter.createdAt = { ...dateFilter.createdAt, $gte: new Date(startDate) };
                    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
                }
                break;
        }

        const [
            totalWriteOffs,
            totalQuantity,
            totalCost,
            categoryBreakdown,
            reasonBreakdown
        ] = await Promise.all([
            WriteOff.countDocuments(dateFilter),
            WriteOff.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: '$quantity' } } }
            ]),
            WriteOff.aggregate([
                { $match: dateFilter },
                { $group: { _id: null, total: { $sum: '$cost' } } }
            ]),
            WriteOff.aggregate([
                { $match: dateFilter },
                { $group: { 
                    _id: '$productCategory', 
                    quantity: { $sum: '$quantity' },
                    cost: { $sum: '$cost' }
                }},
                { $sort: { quantity: -1 } }
            ]),
            WriteOff.aggregate([
                { $match: dateFilter },
                { $group: { 
                    _id: '$reason', 
                    quantity: { $sum: '$quantity' },
                    cost: { $sum: '$cost' }
                }},
                { $sort: { quantity: -1 } }
            ])
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalWriteOffs,
                totalQuantity: totalQuantity[0]?.total || 0,
                totalCost: totalCost[0]?.total || 0,
                categoryBreakdown,
                reasonBreakdown
            },
            message: 'Write-off analytics retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching write-off analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve write-off analytics',
            error: error.message
        });
    }
};

/**
 * Get write-off trends over time
 * GET /api/write-offs/trends
 */
export const getWriteOffTrends = async (req, res) => {
    try {
        const {
            timeframe = 'week',
            startDate,
            endDate
        } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        switch (timeframe) {
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            case 'custom':
                if (startDate || endDate) {
                    dateFilter = {};
                    if (startDate) dateFilter.createdAt = { ...dateFilter.createdAt, $gte: new Date(startDate) };
                    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
                }
                break;
        }

        const trends = await WriteOff.aggregate([
            { $match: dateFilter },
            {
                $group: {
                    _id: {
                        year: { $year: '$createdAt' },
                        month: { $month: '$createdAt' },
                        day: { $dayOfMonth: '$createdAt' }
                    },
                    quantity: { $sum: '$quantity' },
                    cost: { $sum: '$cost' },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
            }
        ]);

        const formattedTrends = trends.map(trend => ({
            date: `${trend._id.year}-${String(trend._id.month).padStart(2, '0')}-${String(trend._id.day).padStart(2, '0')}`,
            quantity: trend.quantity,
            cost: trend.cost,
            count: trend.count
        }));

        res.status(200).json({
            success: true,
            data: formattedTrends,
            message: 'Write-off trends retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching write-off trends:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve write-off trends',
            error: error.message
        });
    }
};

/**
 * Get write-offs by category
 * GET /api/write-offs/by-category
 */
export const getWriteOffByCategory = async (req, res) => {
    try {
        const {
            timeframe = 'today',
            startDate,
            endDate
        } = req.query;

        let dateFilter = {};
        const now = new Date();
        
        switch (timeframe) {
            case 'today':
                const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                dateFilter = { createdAt: { $gte: today } };
                break;
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: weekAgo } };
                break;
            case 'month':
                const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: monthAgo } };
                break;
            case 'year':
                const yearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                dateFilter = { createdAt: { $gte: yearAgo } };
                break;
            case 'custom':
                if (startDate || endDate) {
                    dateFilter = {};
                    if (startDate) dateFilter.createdAt = { ...dateFilter.createdAt, $gte: new Date(startDate) };
                    if (endDate) dateFilter.createdAt = { ...dateFilter.createdAt, $lte: new Date(endDate) };
                }
                break;
        }

        const categoryData = await WriteOff.aggregate([
            { $match: dateFilter },
            { $group: { 
                _id: '$productCategory', 
                quantity: { $sum: '$quantity' },
                cost: { $sum: '$cost' },
                count: { $sum: 1 }
            }},
            { $sort: { quantity: -1 } }
        ]);

        res.status(200).json({
            success: true,
            data: categoryData,
            message: 'Write-off category data retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching write-off category data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve write-off category data',
            error: error.message
        });
    }
};
