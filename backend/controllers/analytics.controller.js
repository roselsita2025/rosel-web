import Order from "../models/order.model.js";
import Transaction from "../models/transaction.model.js";
import Product from "../models/product.model.js";
import { User } from "../models/user.model.js";
import WriteOff from "../models/writeOff.model.js";
import ReplacementRequest from "../models/replacementRequest.model.js";

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

function getDateRangeFromTimeframe(timeframe) {
	const endDate = new Date();
	let startDate = new Date();

	switch (timeframe) {
		case "today": {
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

export const getCustomerAnalytics = async (req, res) => {
    try {
        const { timeframe = 'all', source = 'combined' } = req.query;
        
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

        let orderMatch = {
            paymentStatus: 'paid',
            status: { $nin: ['cancelled', 'refunded'] }
        };

        if (startDate && endDate) {
            orderMatch.createdAt = { $gte: startDate, $lte: endDate };
        }

        if (source !== 'combined') {
            orderMatch.source = source;
        }

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

        const ratingData = {};
        for (let i = 1; i <= 5; i++) {
            ratingData[i] = 0;
        }
        
        ratingDistribution.forEach(item => {
            ratingData[item.rating] = item.count;
        });


        res.json({
            success: true,
            customerData,
            ratingDistribution: ratingData
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching customer analytics',
            error: error.message
        });
    }
};


/**
 * Get discrepancy analytics data (write-offs, replacement requests, or combined)
 * GET /api/analytics/discrepancy
 */
export const getDiscrepancyAnalytics = async (req, res) => {
    try {
        const {
            dataSource = 'combined',
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
        

        let totalStocks = 0;
        let totalCost = 0;
        let categoryBreakdown = [];
        let trendsData = [];

        if (dataSource === 'writeoffs' || dataSource === 'combined') {
            const writeOffData = await WriteOff.aggregate([
                { $match: {} }, // Remove date filter to get all write-offs
                {
                    $group: {
                        _id: null,
                        totalStocks: { $sum: '$quantity' },
                        totalCost: { $sum: '$cost' }
                    }
                }
            ]);

            if (writeOffData.length > 0) {
                totalStocks += writeOffData[0].totalStocks || 0;
                totalCost += writeOffData[0].totalCost || 0;
            }

            const writeOffCategories = await WriteOff.aggregate([
                { $match: {} }, // Remove date filter to get all write-offs
                {
                    $group: {
                        _id: '$productCategory',
                        quantity: { $sum: '$quantity' },
                        cost: { $sum: '$cost' }
                    }
                },
                { $sort: { quantity: -1 } }
            ]);

            categoryBreakdown = [...categoryBreakdown, ...writeOffCategories];

            const writeOffTrends = await WriteOff.aggregate([
                { $match: {} }, // Remove date filter to get all write-offs
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        quantity: { $sum: '$quantity' },
                        cost: { $sum: '$cost' }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);
            
            trendsData = [...trendsData, ...writeOffTrends];
        }

        if (dataSource === 'replacements' || dataSource === 'combined') {
            const replacementData = await ReplacementRequest.aggregate([
                { $match: { ...dateFilter, status: 'approved' } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDoc'
                    }
                },
                { $unwind: '$productDoc' },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: 'orderDoc'
                    }
                },
                { $unwind: '$orderDoc' },
                {
                    $group: {
                        _id: null,
                        totalStocks: { $sum: '$quantity' },
                        totalCost: { $sum: { $ifNull: ['$orderDoc.totalAmount', { $multiply: ['$quantity', { $ifNull: ['$productDoc.price', { $ifNull: ['$productDoc.basePricePerKg', 0] }] }] }] } }
                    }
                }
            ]);


            if (replacementData.length > 0) {
                totalStocks += replacementData[0].totalStocks || 0;
                totalCost += replacementData[0].totalCost || 0;
            }

            const replacementCategories = await ReplacementRequest.aggregate([
                { $match: { ...dateFilter, status: 'approved' } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDoc'
                    }
                },
                { $unwind: '$productDoc' },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: 'orderDoc'
                    }
                },
                { $unwind: '$orderDoc' },
                {
                    $group: {
                        _id: '$productDoc.category',
                        quantity: { $sum: '$quantity' },
                        cost: { $sum: { $ifNull: ['$orderDoc.totalAmount', { $multiply: ['$quantity', { $ifNull: ['$productDoc.price', { $ifNull: ['$productDoc.basePricePerKg', 0] }] }] }] } }
                    }
                },
                { $sort: { quantity: -1 } }
            ]);

            categoryBreakdown = [...categoryBreakdown, ...replacementCategories];

            const replacementTrends = await ReplacementRequest.aggregate([
                { $match: { ...dateFilter, status: 'approved' } },
                {
                    $lookup: {
                        from: 'products',
                        localField: 'product',
                        foreignField: '_id',
                        as: 'productDoc'
                    }
                },
                { $unwind: '$productDoc' },
                {
                    $lookup: {
                        from: 'orders',
                        localField: 'order',
                        foreignField: '_id',
                        as: 'orderDoc'
                    }
                },
                { $unwind: '$orderDoc' },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                            day: { $dayOfMonth: '$createdAt' }
                        },
                        quantity: { $sum: '$quantity' },
                        cost: { $sum: { $ifNull: ['$orderDoc.totalAmount', { $multiply: ['$quantity', { $ifNull: ['$productDoc.price', { $ifNull: ['$productDoc.basePricePerKg', 0] }] }] }] } }
                    }
                },
                { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
            ]);

            trendsData = [...trendsData, ...replacementTrends];
        }

        trendsData.sort((a, b) => {
            const dateA = new Date(a._id.year, a._id.month - 1, a._id.day);
            const dateB = new Date(b._id.year, b._id.month - 1, b._id.day);
            return dateA - dateB;
        });

        const combinedTrends = {};
        trendsData.forEach(trend => {
            const dateKey = `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`;
            if (combinedTrends[dateKey]) {
                combinedTrends[dateKey].quantity += trend.quantity;
                combinedTrends[dateKey].cost += trend.cost;
            } else {
                combinedTrends[dateKey] = {
                    _id: trend._id,
                    quantity: trend.quantity,
                    cost: trend.cost
                };
            }
        });

        const rawTrendsData = Object.values(combinedTrends).map(trend => ({
            date: `${trend._id.year}-${trend._id.month.toString().padStart(2, '0')}-${trend._id.day.toString().padStart(2, '0')}`,
            quantity: trend.quantity,
            cost: trend.cost
        }));

        let latestDataDate = null;
        if (rawTrendsData.length > 0) {
            const dataDates = rawTrendsData.map(item => new Date(item.date));
            latestDataDate = new Date(Math.max(...dataDates));
        } else {
            latestDataDate = new Date(); // Use today if no data
        }
        
        const sevenDaysAgo = new Date(latestDataDate.getTime() - 6 * 24 * 60 * 60 * 1000);
        
        trendsData = [];
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(sevenDaysAgo.getTime() + i * 24 * 60 * 60 * 1000);
            const dateString = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format
            
            const existingData = rawTrendsData.find(item => item.date === dateString);
            
            trendsData.push({
                date: dateString,
                quantity: existingData ? existingData.quantity : 0,
                cost: existingData ? existingData.cost : 0
            });
        }


        const combinedCategories = {};
        categoryBreakdown.forEach(item => {
            if (combinedCategories[item._id]) {
                combinedCategories[item._id].quantity += item.quantity;
                combinedCategories[item._id].cost += item.cost;
            } else {
                combinedCategories[item._id] = {
                    category: item._id,
                    quantity: item.quantity,
                    cost: item.cost
                };
            }
        });

        const finalCategoryBreakdown = Object.values(combinedCategories)
            .sort((a, b) => b.quantity - a.quantity);

        // Final trends data is already processed above
        const finalTrendsData = trendsData;

        res.status(200).json({
            success: true,
            data: {
                totalStocks,
                totalCost,
                categoryBreakdown: finalCategoryBreakdown,
                trendsData: finalTrendsData
            },
            message: 'Discrepancy analytics retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching discrepancy analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve discrepancy analytics',
            error: error.message
        });
    }
};

/**
 * Get discrepancy details table data
 * GET /api/analytics/discrepancy/details
 */
export const getDiscrepancyDetails = async (req, res) => {
    try {
        const {
            dataSource = 'combined',
            timeframe = 'today',
            startDate,
            endDate,
            page = 1,
            limit = 20,
            sortBy = 'createdAt',
            sortOrder = 'desc'
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

        let allDetails = [];

        // Get write-offs details
        if (dataSource === 'writeoffs' || dataSource === 'combined') {
            const writeOffDetails = await WriteOff.find(dateFilter)
                .populate('product', 'name image category weightOptions')
                .populate('adminId', 'name email')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .lean();

            const formattedWriteOffs = writeOffDetails.map(item => ({
                _id: item._id,
                type: 'writeoff',
                productName: item.productName,
                productCategory: item.productCategory,
                product: item.product, // Include the full product object
                weightKg: item.weightKg, // Include the weight
                quantity: item.quantity,
                cost: item.cost,
                reason: item.reason,
                description: item.description,
                adminName: item.adminName,
                createdAt: item.createdAt
            }));

            allDetails = [...allDetails, ...formattedWriteOffs];
        }

        // Get replacement requests details
        if (dataSource === 'replacements' || dataSource === 'combined') {
            const replacementDetails = await ReplacementRequest.find({ 
                ...dateFilter, 
                status: 'approved' 
            })
                .populate('product', 'name image category price basePricePerKg weightOptions')
                .populate('order', 'totalAmount')
                .populate('user', 'name email')
                .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
                .lean();

            
            const formattedReplacements = replacementDetails.map(item => {
                // Try order totalAmount first, then product price fields
                const costFromOrder = item.order?.totalAmount || 0;
                const costFromPrice = item.quantity * (item.product?.price || 0);
                const costFromBasePrice = item.quantity * (item.product?.basePricePerKg || 0);
                
                // Use order totalAmount first, then fallback to product calculations
                const cost = costFromOrder > 0 ? costFromOrder : (costFromPrice > 0 ? costFromPrice : costFromBasePrice);
                
                return {
                    _id: item._id,
                    type: 'replacement',
                    productName: item.product.name,
                    productCategory: item.product.category,
                    product: item.product, // Include the full product object
                    quantity: item.quantity,
                    cost: cost,
                    reason: item.reason,
                    description: item.description,
                    adminName: item.user.name,
                    createdAt: item.createdAt
                };
            });

            allDetails = [...allDetails, ...formattedReplacements];
        }

        // Sort combined data
        allDetails.sort((a, b) => {
            const aValue = a[sortBy];
            const bValue = b[sortBy];
            if (sortOrder === 'desc') {
                return new Date(bValue) - new Date(aValue);
            } else {
                return new Date(aValue) - new Date(bValue);
            }
        });

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const paginatedDetails = allDetails.slice(skip, skip + parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                details: paginatedDetails,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(allDetails.length / parseInt(limit)),
                    totalItems: allDetails.length,
                    hasNextPage: skip + paginatedDetails.length < allDetails.length,
                    hasPrevPage: parseInt(page) > 1
                }
            },
            message: 'Discrepancy details retrieved successfully'
        });

    } catch (error) {
        console.error('Error fetching discrepancy details:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve discrepancy details',
            error: error.message
        });
    }
};