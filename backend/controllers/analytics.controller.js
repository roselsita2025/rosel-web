import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import Product from "../models/product.model.js";
import { User } from "../models/user.model.js";

export const getAnalyticsData = async () => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    const salesData = await Order.aggregate([
        {
            $match: {
                paymentStatus: 'paid',
                status: { $nin: ['cancelled', 'refunded'] }
            }
        },
        {
            $group: {
                _id: null,
                totalSales: { $sum:1 },
                totalRevenue: { $sum: "$productSubtotal" }
            }
        }
    ]);

    const {totalSales, totalRevenue} = salesData[0] || {totalSales: 0, totalRevenue: 0};

    return {
        users:totalUsers,
        products:totalProducts,
        totalSales,
        totalRevenue
    }
};

export const getDailySalesData = async (startDate, endDate) => {
	try {
		const dailySalesData = await Order.aggregate([
			{
				$match: {
					createdAt: {
						$gte: startDate,
						$lte: endDate,
					},
					paymentStatus: 'paid',
					status: { $nin: ['cancelled', 'refunded'] }
				},
			},
			{
				$group: {
					_id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
					sales: { $sum: 1 },
					revenue: { $sum: "$productSubtotal" },
				},
			},
			{ $sort: { _id: 1 } },
		]);

		const dateArray = getDatesInRange(startDate, endDate);

		return dateArray.map((date) => {
			const foundData = dailySalesData.find((item) => item._id === date);

			return {
				date,
				sales: foundData?.sales || 0,
				revenue: foundData?.revenue || 0,
			};
		});
	} catch (error) {
		throw error;
	}
};

function getDatesInRange(startDate, endDate) {
	const dates = [];
	let currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		dates.push(currentDate.toISOString().split("T")[0]);
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}

// Helper to compute date range from a timeframe key
function getDateRangeFromTimeframe(timeframe) {
	const endDate = new Date();
	let startDate = new Date();

	switch (timeframe) {
		case "today": {
			// Start of today
			startDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
			break;
		}
		case "week": {
			startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		}
		case "month": {
			startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
			break;
		}
		case "year": {
			startDate = new Date(endDate.getTime() - 365 * 24 * 60 * 60 * 1000);
			break;
		}
		default: {
			startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
			break;
		}
	}

	return { startDate, endDate };
}

export const getNewOrdersCount = async (startDate, endDate) => {
	const count = await Order.countDocuments({
		createdAt: { $gte: startDate, $lte: endDate },
		paymentStatus: 'paid',
		status: { $nin: ['cancelled', 'refunded'] }
	});
	return count;
};

export const getNewOrdersByTimeframe = async (timeframe) => {
	const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
	const newOrders = await getNewOrdersCount(startDate, endDate);
	return { newOrders, startDate, endDate };
};

export const getTotalSalesQuantity = async (startDate, endDate) => {
	const result = await Order.aggregate([
		{
			$match: {
				createdAt: { $gte: startDate, $lte: endDate },
				paymentStatus: 'paid',
				status: { $nin: ['cancelled', 'refunded'] }
			},
		},
		{ $unwind: "$products" },
		{
			$group: {
				_id: null,
				totalQuantity: { $sum: "$products.quantity" },
			},
		},
	]);
	return result?.[0]?.totalQuantity || 0;
};

export const getTotalSalesByTimeframe = async (timeframe) => {
	const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
	const totalSalesQuantity = await getTotalSalesQuantity(startDate, endDate);
	return { totalSalesQuantity, startDate, endDate };
};

export const getRevenueByTimeframe = async (timeframe) => {
	const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
	const result = await Order.aggregate([
		{ 
			$match: { 
				createdAt: { $gte: startDate, $lte: endDate },
				paymentStatus: 'paid',
				status: { $nin: ['cancelled', 'refunded'] }
			} 
		},
		{ $group: { _id: null, revenue: { $sum: "$productSubtotal" } } },
	]);
	const revenue = result?.[0]?.revenue || 0;
	return { revenue, startDate, endDate };
};

export const getRevenueForRange = async (startDate, endDate) => {
    const result = await Order.aggregate([
        { 
            $match: { 
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                status: { $nin: ['cancelled', 'refunded'] }
            } 
        },
        { $group: { _id: null, revenue: { $sum: "$productSubtotal" } } },
    ]);
    const revenue = result?.[0]?.revenue || 0;
    return { revenue, startDate, endDate };
};

export const getTopCategoriesByTimeframe = async (timeframe, limit = 10) => {
	const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
	const results = await Order.aggregate([
		{ 
			$match: { 
				createdAt: { $gte: startDate, $lte: endDate },
				paymentStatus: 'paid',
				status: { $nin: ['cancelled', 'refunded'] }
			} 
		},
		{ $unwind: "$products" },
		{
			$lookup: {
				from: "products",
				localField: "products.product",
				foreignField: "_id",
				as: "productDoc",
			},
		},
		{ $unwind: "$productDoc" },
		{
			$group: {
				_id: "$productDoc.category",
				distinctOrders: { $addToSet: "$_id" },
				quantitySold: { $sum: "$products.quantity" },
				revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
				latestOrderDate: { $max: "$createdAt" },
				distinctProducts: { $addToSet: "$products.product" },
			},
		},
		{
			$project: {
				_id: 0,
				category: "$_id",
				orderCount: { $size: "$distinctOrders" },
				quantitySold: 1,
				revenue: 1,
				productsSold: { $size: "$distinctProducts" },
				latestOrderDate: 1,
			},
		},
		{ $sort: { orderCount: -1, latestOrderDate: -1 } },
		{ $limit: limit },
	]);
	return { results, startDate, endDate };
};

export const getTopCategoriesByRange = async (startDate, endDate, limit = 10) => {
    const results = await Order.aggregate([
        { 
            $match: { 
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                status: { $nin: ['cancelled', 'refunded'] }
            } 
        },
        { $unwind: "$products" },
        {
            $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "productDoc",
            },
        },
        { $unwind: "$productDoc" },
        {
            $group: {
                _id: "$productDoc.category",
                distinctOrders: { $addToSet: "$_id" },
                quantitySold: { $sum: "$products.quantity" },
                revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
                latestOrderDate: { $max: "$createdAt" },
                distinctProducts: { $addToSet: "$products.product" },
            },
        },
        {
            $project: {
                _id: 0,
                category: "$_id",
                orderCount: { $size: "$distinctOrders" },
                quantitySold: 1,
                revenue: 1,
                productsSold: { $size: "$distinctProducts" },
                latestOrderDate: 1,
            },
        },
        { $sort: { orderCount: -1, latestOrderDate: -1 } },
        { $limit: limit },
    ]);
    return { results, startDate, endDate };
};

export const getTopProductsByTimeframe = async (timeframe, limit = 10) => {
	const { startDate, endDate } = getDateRangeFromTimeframe(timeframe);
	const results = await Order.aggregate([
		{ 
			$match: { 
				createdAt: { $gte: startDate, $lte: endDate },
				paymentStatus: 'paid',
				status: { $nin: ['cancelled', 'refunded'] }
			} 
		},
		{ $unwind: "$products" },
		{
			$lookup: {
				from: "products",
				localField: "products.product",
				foreignField: "_id",
				as: "productDoc",
			},
		},
		{ $unwind: "$productDoc" },
		{
			$group: {
				_id: "$products.product",
				productName: { $first: "$productDoc.name" },
				productCategory: { $first: "$productDoc.category" },
				distinctOrders: { $addToSet: "$_id" },
				quantitySold: { $sum: "$products.quantity" },
				revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
				latestOrderDate: { $max: "$createdAt" },
			},
		},
		{
			$project: {
				_id: 0,
				productId: "$_id",
				productName: 1,
				productCategory: 1,
				orderCount: { $size: "$distinctOrders" },
				quantitySold: 1,
				revenue: 1,
				latestOrderDate: 1,
			},
		},
		{ $sort: { orderCount: -1, latestOrderDate: -1 } },
		{ $limit: limit },
	]);
	return { results, startDate, endDate };
};

export const getTopProductsByRange = async (startDate, endDate, limit = 10) => {
    const results = await Order.aggregate([
        { 
            $match: { 
                createdAt: { $gte: startDate, $lte: endDate },
                paymentStatus: 'paid',
                status: { $nin: ['cancelled', 'refunded'] }
            } 
        },
        { $unwind: "$products" },
        {
            $lookup: {
                from: "products",
                localField: "products.product",
                foreignField: "_id",
                as: "productDoc",
            },
        },
        { $unwind: "$productDoc" },
        {
            $group: {
                _id: "$products.product",
                productName: { $first: "$productDoc.name" },
                productCategory: { $first: "$productDoc.category" },
                distinctOrders: { $addToSet: "$_id" },
                quantitySold: { $sum: "$products.quantity" },
                revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
                latestOrderDate: { $max: "$createdAt" },
            },
        },
        {
            $project: {
                _id: 0,
                productId: "$_id",
                productName: 1,
                productCategory: 1,
                orderCount: { $size: "$distinctOrders" },
                quantitySold: 1,
                revenue: 1,
                latestOrderDate: 1,
            },
        },
        { $sort: { orderCount: -1, latestOrderDate: -1 } },
        { $limit: limit },
    ]);
    return { results, startDate, endDate };
};

// ===== NEW FUNCTIONS FOR COMBINED ANALYTICS =====

// Get analytics data based on data source (orders, pos, or combined)
export const getAnalyticsDataBySource = async (dataSource = 'combined') => {
    const totalUsers = await User.countDocuments();
    const totalProducts = await Product.countDocuments();

    let totalSales = 0;
    let totalRevenue = 0;

    if (dataSource === 'orders' || dataSource === 'combined') {
        const orderData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    status: { $nin: ['cancelled', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$productSubtotal" }
                }
            }
        ]);
        const orderStats = orderData[0] || { totalSales: 0, totalRevenue: 0 };
        totalSales += orderStats.totalSales;
        totalRevenue += orderStats.totalRevenue;
    }

    if (dataSource === 'pos' || dataSource === 'combined') {
        const posData = await Transaction.aggregate([
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: "$payment.productSubtotal" }
                }
            }
        ]);
        const posStats = posData[0] || { totalSales: 0, totalRevenue: 0 };
        totalSales += posStats.totalSales;
        totalRevenue += posStats.totalRevenue;
    }

    return {
        users: totalUsers,
        products: totalProducts,
        totalSales,
        totalRevenue
    };
};

// Get daily sales data based on data source
export const getDailySalesDataBySource = async (startDate, endDate, dataSource = 'combined') => {
    try {
        let dailySalesData = [];

        if (dataSource === 'orders' || dataSource === 'combined') {
            const orderData = await Order.aggregate([
                {
                    $match: {
                        createdAt: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                        paymentStatus: 'paid',
                        status: { $nin: ['cancelled', 'refunded'] }
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        sales: { $sum: 1 },
                        revenue: { $sum: "$productSubtotal" },
                    },
                },
            ]);
            dailySalesData = [...dailySalesData, ...orderData];
        }

        if (dataSource === 'pos' || dataSource === 'combined') {
            const posData = await Transaction.aggregate([
                {
                    $match: {
                        timestamp: {
                            $gte: startDate,
                            $lte: endDate,
                        },
                    },
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
                        sales: { $sum: 1 },
                        revenue: { $sum: "$payment.productSubtotal" },
                    },
                },
            ]);
            dailySalesData = [...dailySalesData, ...posData];
        }

        // Combine data by date
        const combinedData = {};
        dailySalesData.forEach(item => {
            if (combinedData[item._id]) {
                combinedData[item._id].sales += item.sales;
                combinedData[item._id].revenue += item.revenue;
            } else {
                combinedData[item._id] = { sales: item.sales, revenue: item.revenue };
            }
        });

        const dateArray = getDatesInRange(startDate, endDate);

        return dateArray.map((date) => {
            const foundData = combinedData[date];

            return {
                date,
                sales: foundData?.sales || 0,
                revenue: foundData?.revenue || 0,
            };
        });
    } catch (error) {
        throw error;
    }
};

// Get new orders/transactions count by data source
export const getNewOrdersCountBySource = async (startDate, endDate, dataSource = 'combined') => {
    let count = 0;

    if (dataSource === 'orders' || dataSource === 'combined') {
        const orderCount = await Order.countDocuments({
            createdAt: { $gte: startDate, $lte: endDate },
            paymentStatus: 'paid',
            status: { $nin: ['cancelled', 'refunded'] }
        });
        count += orderCount;
    }

    if (dataSource === 'pos' || dataSource === 'combined') {
        const posCount = await Transaction.countDocuments({
            timestamp: { $gte: startDate, $lte: endDate },
        });
        count += posCount;
    }

    return count;
};

// Get total sales quantity by data source
export const getTotalSalesQuantityBySource = async (startDate, endDate, dataSource = 'combined') => {
    let totalQuantity = 0;

    if (dataSource === 'orders' || dataSource === 'combined') {
        const orderResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    paymentStatus: 'paid',
                    status: { $nin: ['cancelled', 'refunded'] }
                },
            },
            { $unwind: "$products" },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$products.quantity" },
                },
            },
        ]);
        totalQuantity += orderResult?.[0]?.totalQuantity || 0;
    }

    if (dataSource === 'pos' || dataSource === 'combined') {
        const posResult = await Transaction.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate },
                },
            },
            { $unwind: "$items" },
            {
                $group: {
                    _id: null,
                    totalQuantity: { $sum: "$items.quantity" },
                },
            },
        ]);
        totalQuantity += posResult?.[0]?.totalQuantity || 0;
    }

    return totalQuantity;
};

// Get revenue by data source
export const getRevenueBySource = async (startDate, endDate, dataSource = 'combined') => {
    let revenue = 0;

    if (dataSource === 'orders' || dataSource === 'combined') {
        const orderResult = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate, $lte: endDate },
                    paymentStatus: 'paid',
                    status: { $nin: ['cancelled', 'refunded'] }
                } 
            },
            { $group: { _id: null, revenue: { $sum: "$productSubtotal" } } },
        ]);
        revenue += orderResult?.[0]?.revenue || 0;
    }

    if (dataSource === 'pos' || dataSource === 'combined') {
        const posResult = await Transaction.aggregate([
            { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
            { $group: { _id: null, revenue: { $sum: "$payment.productSubtotal" } } },
        ]);
        revenue += posResult?.[0]?.revenue || 0;
    }

    return revenue;
};

// Get top products by data source
export const getTopProductsBySource = async (startDate, endDate, dataSource = 'combined', limit = 10) => {
    let allProducts = [];

    if (dataSource === 'orders' || dataSource === 'combined') {
        const orderResults = await Order.aggregate([
            { 
                $match: { 
                    createdAt: { $gte: startDate, $lte: endDate },
                    paymentStatus: 'paid',
                    status: { $nin: ['cancelled', 'refunded'] }
                } 
            },
            { $unwind: "$products" },
            {
                $lookup: {
                    from: "products",
                    localField: "products.product",
                    foreignField: "_id",
                    as: "productDoc",
                },
            },
            { $unwind: "$productDoc" },
            {
                $group: {
                    _id: "$products.product",
                    productName: { $first: "$productDoc.name" },
                    productCategory: { $first: "$productDoc.category" },
                    distinctOrders: { $addToSet: "$_id" },
                    quantitySold: { $sum: "$products.quantity" },
                    revenue: { $sum: { $multiply: ["$products.quantity", "$products.price"] } },
                    latestOrderDate: { $max: "$createdAt" },
                    source: { $first: "orders" }
                },
            },
        ]);
        allProducts = [...allProducts, ...orderResults];
    }

    if (dataSource === 'pos' || dataSource === 'combined') {
        const posResults = await Transaction.aggregate([
            { $match: { timestamp: { $gte: startDate, $lte: endDate } } },
            { $unwind: "$items" },
            {
                $lookup: {
                    from: "products",
                    localField: "items.productId",
                    foreignField: "_id",
                    as: "productDoc",
                },
            },
            { $unwind: "$productDoc" },
            {
                $group: {
                    _id: "$items.productId",
                    productName: { $first: "$productDoc.name" },
                    productCategory: { $first: "$productDoc.category" },
                    distinctOrders: { $addToSet: "$_id" },
                    quantitySold: { $sum: "$items.quantity" },
                    revenue: { $sum: "$items.total" },
                    latestOrderDate: { $max: "$timestamp" },
                    source: { $first: "pos" }
                },
            },
        ]);
        allProducts = [...allProducts, ...posResults];
    }

    // Combine products from both sources
    const combinedProducts = {};
    allProducts.forEach(product => {
        const key = product._id.toString();
        if (combinedProducts[key]) {
            combinedProducts[key].quantitySold += product.quantitySold;
            combinedProducts[key].revenue += product.revenue;
            combinedProducts[key].distinctOrders = [...new Set([...combinedProducts[key].distinctOrders, ...product.distinctOrders])];
            if (new Date(product.latestOrderDate) > new Date(combinedProducts[key].latestOrderDate)) {
                combinedProducts[key].latestOrderDate = product.latestOrderDate;
            }
        } else {
            combinedProducts[key] = product;
        }
    });

    // Convert back to array and sort
    const results = Object.values(combinedProducts).map(product => ({
        _id: 0,
        productId: product._id,
        productName: product.productName,
        productCategory: product.productCategory,
        orderCount: product.distinctOrders.length,
        quantitySold: product.quantitySold,
        revenue: product.revenue,
        latestOrderDate: product.latestOrderDate,
    }));

    return results
        .sort((a, b) => b.orderCount - a.orderCount || new Date(b.latestOrderDate) - new Date(a.latestOrderDate))
        .slice(0, limit);
};

// Get customer analytics data
export const getCustomerAnalytics = async (req, res) => {
    try {
        const { timeframe = 'all', source = 'combined' } = req.query;
        
        // Calculate date range based on timeframe
        let startDate, endDate;
        const now = new Date();
        
        switch (timeframe) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                break;
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                endDate = now;
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                endDate = now;
                break;
            case 'year':
                startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
                endDate = now;
                break;
            default:
                startDate = null;
                endDate = null;
        }

        // Build match criteria for orders
        let orderMatch = {
            paymentStatus: 'paid',
            status: { $nin: ['cancelled', 'refunded'] }
        };

        if (startDate && endDate) {
            orderMatch.createdAt = { $gte: startDate, $lte: endDate };
        }

        // Add source filter
        if (source !== 'combined') {
            orderMatch.source = source;
        }

        // Get customer data with order counts and ratings - always show all customers
        // This is not affected by timeframe or data source filters
        const customerData = await Order.aggregate([
            {
                $match: {
                    paymentStatus: 'paid',
                    status: { $nin: ['cancelled', 'refunded'] }
                }
            },
            {
                $group: {
                    _id: '$user',
                    customerName: { $first: { $concat: ['$shippingInfo.firstName', ' ', '$shippingInfo.lastName'] } },
                    customerEmail: { $first: '$shippingInfo.email' },
                    totalOrders: { $sum: 1 },
                    totalSpent: { $sum: '$productSubtotal' }
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'userId',
                    as: 'reviews'
                }
            },
            {
                $addFields: {
                    totalRatings: { $size: '$reviews' },
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: '$reviews' }, 0] },
                            then: { $avg: '$reviews.rating' },
                            else: 0
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    customerName: 1,
                    customerEmail: 1,
                    totalOrders: 1,
                    totalSpent: 1,
                    totalRatings: 1,
                    averageRating: { $round: ['$averageRating', 1] }
                }
            },
            { $sort: { totalOrders: -1 } },
            { $limit: 10 }
        ]);

        // Get rating distribution directly from reviews collection - always show all reviews
        // This is not affected by timeframe or data source filters
        const Review = (await import('../models/Review.js')).default;
        
        const ratingDistribution = await Review.aggregate([
            {
                $group: {
                    _id: '$rating',
                    count: { $sum: 1 }
                }
            },
            {
                $project: {
                    rating: '$_id',
                    count: 1,
                    _id: 0
                }
            },
            { $sort: { rating: 1 } }
        ]);

        // Format rating distribution
        const ratingData = {};
        for (let i = 1; i <= 5; i++) {
            ratingData[i] = 0;
        }
        
        ratingDistribution.forEach(item => {
            ratingData[item.rating] = item.count;
        });

        console.log('Customer Data (all customers - not filtered):', customerData);
        console.log('Rating Distribution Raw (all reviews - not filtered):', ratingDistribution);
        console.log('Rating Distribution Formatted:', ratingData);
        console.log('Note: Customer Analytics section is not affected by timeframe/source filters');

        res.json({
            success: true,
            customerData,
            ratingDistribution: ratingData
        });

    } catch (error) {
        console.error('Error fetching customer analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching customer analytics',
            error: error.message
        });
    }
};