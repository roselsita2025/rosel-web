import express from "express";
import { verifyAdmin, verifyToken } from "../middleware/verifyToken.js";
import { 
    getAnalyticsData, 
    getDailySalesData, 
    getNewOrdersByTimeframe, 
    getTotalSalesByTimeframe, 
    getRevenueByTimeframe, 
    getTopCategoriesByTimeframe, 
    getTopProductsByTimeframe, 
    getRevenueForRange, 
    getTopCategoriesByRange, 
    getTopProductsByRange, 
    getTotalSalesQuantity,
    getAnalyticsDataBySource,
    getDailySalesDataBySource,
    getNewOrdersCountBySource,
    getTotalSalesQuantityBySource,
    getRevenueBySource,
    getTopProductsBySource
} from "../controllers/analytics.controller.js";


const router = express.Router();

router.get("/", verifyToken, verifyAdmin, async (req, res) => {
	try {
		const analyticsData = await getAnalyticsData();

		const endDate = new Date();
		const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);

		const dailySalesData = await getDailySalesData(startDate, endDate);

		res.json({
			analyticsData,
			dailySalesData,
		});
	} catch (error) {
		console.log("Error in analytics route", error.message);
		res.status(500).json({ message: "Server error", error: error.message });
	}
});

router.get("/new-orders", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        if (start && end) {
            const startDate = new Date(start); startDate.setHours(0,0,0,0);
            const endDate = new Date(end); endDate.setHours(23,59,59,999);
            const newOrders = await (await import('../models/order.model.js')).default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
            return res.json({ newOrders, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = new Date(dateStr);
            const startDate = new Date(d); startDate.setHours(0,0,0,0);
            const endDate = new Date(d); endDate.setHours(23,59,59,999);
            const newOrders = await (await import('../models/order.model.js')).default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
            return res.json({ newOrders, startDate, endDate, date: dateStr });
        }
        const { newOrders, startDate, endDate } = await getNewOrdersByTimeframe(timeframe);
        res.json({ newOrders, startDate, endDate, timeframe });
    } catch (error) {
        console.log("Error in new-orders analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/total-sales", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        if (start && end) {
            const startDate = new Date(start); startDate.setHours(0,0,0,0);
            const endDate = new Date(end); endDate.setHours(23,59,59,999);
            const totalSalesQuantity = await getTotalSalesQuantity(startDate, endDate);
            return res.json({ totalSalesQuantity, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = new Date(dateStr);
            const startDate = new Date(d); startDate.setHours(0,0,0,0);
            const endDate = new Date(d); endDate.setHours(23,59,59,999);
            const totalSalesQuantity = await getTotalSalesQuantity(startDate, endDate);
            return res.json({ totalSalesQuantity, startDate, endDate, date: dateStr });
        }
        const { totalSalesQuantity, startDate, endDate } = await getTotalSalesByTimeframe(timeframe);
        res.json({ totalSalesQuantity, startDate, endDate, timeframe });
    } catch (error) {
        console.log("Error in total-sales analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/revenue", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        if (start && end) {
            const startDate = new Date(start); startDate.setHours(0,0,0,0);
            const endDate = new Date(end); endDate.setHours(23,59,59,999);
            const { revenue } = await getRevenueForRange(startDate, endDate);
            return res.json({ revenue, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = new Date(dateStr);
            const startDate = new Date(d); startDate.setHours(0,0,0,0);
            const endDate = new Date(d); endDate.setHours(23,59,59,999);
            const { revenue } = await getRevenueForRange(startDate, endDate);
            return res.json({ revenue, startDate, endDate, date: dateStr });
        }
        const { revenue, startDate, endDate } = await getRevenueByTimeframe(timeframe);
        res.json({ revenue, startDate, endDate, timeframe });
    } catch (error) {
        console.log("Error in revenue analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/top-categories", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const limit = Number(req.query.limit || 10);
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        if (start && end) {
            const startDate = new Date(start); startDate.setHours(0,0,0,0);
            const endDate = new Date(end); endDate.setHours(23,59,59,999);
            const { results } = await getTopCategoriesByRange(startDate, endDate, limit);
            return res.json({ categories: results, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = new Date(dateStr);
            const startDate = new Date(d); startDate.setHours(0,0,0,0);
            const endDate = new Date(d); endDate.setHours(23,59,59,999);
            const { results } = await getTopCategoriesByRange(startDate, endDate, limit);
            return res.json({ categories: results, startDate, endDate, date: dateStr });
        }
        const { results, startDate, endDate } = await getTopCategoriesByTimeframe(timeframe, limit);
        res.json({ categories: results, startDate, endDate, timeframe });
    } catch (error) {
        console.log("Error in top-categories analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

router.get("/top-products", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const limit = Number(req.query.limit || 10);
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        if (start && end) {
            const startDate = new Date(start); startDate.setHours(0,0,0,0);
            const endDate = new Date(end); endDate.setHours(23,59,59,999);
            const { results } = await getTopProductsByRange(startDate, endDate, limit);
            return res.json({ products: results, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = new Date(dateStr);
            const startDate = new Date(d); startDate.setHours(0,0,0,0);
            const endDate = new Date(d); endDate.setHours(23,59,59,999);
            const { results } = await getTopProductsByRange(startDate, endDate, limit);
            return res.json({ products: results, startDate, endDate, date: dateStr });
        }
        const { results, startDate, endDate } = await getTopProductsByTimeframe(timeframe, limit);
        res.json({ products: results, startDate, endDate, timeframe });
    } catch (error) {
        console.log("Error in top-products analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// ===== NEW COMBINED ANALYTICS ENDPOINTS =====

// Get analytics data by source (orders, pos, or combined)
router.get("/by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const dataSource = String(req.query.source || 'combined');
        const analyticsData = await getAnalyticsDataBySource(dataSource);

        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        const dailySalesData = await getDailySalesDataBySource(startDate, endDate, dataSource);

        res.json({
            analyticsData,
            dailySalesData,
            dataSource
        });
    } catch (error) {
        console.log("Error in analytics by-source route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get new orders/transactions count by source
router.get("/new-orders-by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dataSource = String(req.query.source || 'combined');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        
        let startDate, endDate;
        
        if (start && end) {
            startDate = new Date(start); startDate.setHours(0,0,0,0);
            endDate = new Date(end); endDate.setHours(23,59,59,999);
        } else if (dateStr) {
            const d = new Date(dateStr);
            startDate = new Date(d); startDate.setHours(0,0,0,0);
            endDate = new Date(d); endDate.setHours(23,59,59,999);
        } else {
            // Use timeframe logic
            const endDateTemp = new Date();
            let startDateTemp = new Date();
            switch (timeframe) {
                case "today":
                    startDateTemp = new Date(endDateTemp.getFullYear(), endDateTemp.getMonth(), endDateTemp.getDate());
                    break;
                case "week":
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "month":
                    startDateTemp = new Date(endDateTemp.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "year":
                    startDateTemp = new Date(endDateTemp.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            startDate = startDateTemp;
            endDate = endDateTemp;
        }
        
        const newOrders = await getNewOrdersCountBySource(startDate, endDate, dataSource);
        res.json({ newOrders, startDate, endDate, dataSource, timeframe });
    } catch (error) {
        console.log("Error in new-orders-by-source analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get total sales quantity by source
router.get("/total-sales-by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dataSource = String(req.query.source || 'combined');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        
        let startDate, endDate;
        
        if (start && end) {
            startDate = new Date(start); startDate.setHours(0,0,0,0);
            endDate = new Date(end); endDate.setHours(23,59,59,999);
        } else if (dateStr) {
            const d = new Date(dateStr);
            startDate = new Date(d); startDate.setHours(0,0,0,0);
            endDate = new Date(d); endDate.setHours(23,59,59,999);
        } else {
            // Use timeframe logic
            const endDateTemp = new Date();
            let startDateTemp = new Date();
            switch (timeframe) {
                case "today":
                    startDateTemp = new Date(endDateTemp.getFullYear(), endDateTemp.getMonth(), endDateTemp.getDate());
                    break;
                case "week":
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "month":
                    startDateTemp = new Date(endDateTemp.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "year":
                    startDateTemp = new Date(endDateTemp.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            startDate = startDateTemp;
            endDate = endDateTemp;
        }
        
        const totalSalesQuantity = await getTotalSalesQuantityBySource(startDate, endDate, dataSource);
        res.json({ totalSalesQuantity, startDate, endDate, dataSource, timeframe });
    } catch (error) {
        console.log("Error in total-sales-by-source analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get revenue by source
router.get("/revenue-by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dataSource = String(req.query.source || 'combined');
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        
        let startDate, endDate;
        
        if (start && end) {
            startDate = new Date(start); startDate.setHours(0,0,0,0);
            endDate = new Date(end); endDate.setHours(23,59,59,999);
        } else if (dateStr) {
            const d = new Date(dateStr);
            startDate = new Date(d); startDate.setHours(0,0,0,0);
            endDate = new Date(d); endDate.setHours(23,59,59,999);
        } else {
            // Use timeframe logic
            const endDateTemp = new Date();
            let startDateTemp = new Date();
            switch (timeframe) {
                case "today":
                    startDateTemp = new Date(endDateTemp.getFullYear(), endDateTemp.getMonth(), endDateTemp.getDate());
                    break;
                case "week":
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "month":
                    startDateTemp = new Date(endDateTemp.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "year":
                    startDateTemp = new Date(endDateTemp.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            startDate = startDateTemp;
            endDate = endDateTemp;
        }
        
        const revenue = await getRevenueBySource(startDate, endDate, dataSource);
        res.json({ revenue, startDate, endDate, dataSource, timeframe });
    } catch (error) {
        console.log("Error in revenue-by-source analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get top products by source
router.get("/top-products-by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const timeframe = String(req.query.timeframe || 'today');
        const dataSource = String(req.query.source || 'combined');
        const limit = Number(req.query.limit || 10);
        const dateStr = req.query.date ? String(req.query.date) : '';
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';
        
        let startDate, endDate;
        
        if (start && end) {
            startDate = new Date(start); startDate.setHours(0,0,0,0);
            endDate = new Date(end); endDate.setHours(23,59,59,999);
        } else if (dateStr) {
            const d = new Date(dateStr);
            startDate = new Date(d); startDate.setHours(0,0,0,0);
            endDate = new Date(d); endDate.setHours(23,59,59,999);
        } else {
            // Use timeframe logic
            const endDateTemp = new Date();
            let startDateTemp = new Date();
            switch (timeframe) {
                case "today":
                    startDateTemp = new Date(endDateTemp.getFullYear(), endDateTemp.getMonth(), endDateTemp.getDate());
                    break;
                case "week":
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case "month":
                    startDateTemp = new Date(endDateTemp.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case "year":
                    startDateTemp = new Date(endDateTemp.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDateTemp = new Date(endDateTemp.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
            startDate = startDateTemp;
            endDate = endDateTemp;
        }
        
        const products = await getTopProductsBySource(startDate, endDate, dataSource, limit);
        res.json({ products, startDate, endDate, dataSource, timeframe });
    } catch (error) {
        console.log("Error in top-products-by-source analytics route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

export default router;
