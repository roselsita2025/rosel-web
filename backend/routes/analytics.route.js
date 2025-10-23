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
    getTopProductsBySource,
    getCustomerAnalytics,
    getDiscrepancyAnalytics,
    getDiscrepancyDetails
} from "../controllers/analytics.controller.js";


const router = express.Router();

// Helper function to parse date strings consistently in Philippines timezone
// Input: "2025-10-15" → Output: Date object for 2025-10-15 00:00:00 Philippines time
function parseDateInPhilippines(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
    const day = parseInt(parts[2]);
    
    // Create date in Philippines timezone (UTC+8)
    // Note: This creates the date in server's local time, assuming server is in Philippines
    // For production, consider using a library like moment-timezone or date-fns-tz
    const date = new Date(year, month, day);
    return date;
}

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
            const startDate = parseDateInPhilippines(start); startDate.setHours(0,0,0,0);
            const endDate = parseDateInPhilippines(end); endDate.setHours(23,59,59,999);
            const newOrders = await (await import('../models/order.model.js')).default.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } });
            return res.json({ newOrders, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = parseDateInPhilippines(dateStr);
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
            const startDate = parseDateInPhilippines(start); startDate.setHours(0,0,0,0);
            const endDate = parseDateInPhilippines(end); endDate.setHours(23,59,59,999);
            const totalSalesQuantity = await getTotalSalesQuantity(startDate, endDate);
            return res.json({ totalSalesQuantity, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = parseDateInPhilippines(dateStr);
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
            const startDate = parseDateInPhilippines(start); startDate.setHours(0,0,0,0);
            const endDate = parseDateInPhilippines(end); endDate.setHours(23,59,59,999);
            const { revenue } = await getRevenueForRange(startDate, endDate);
            return res.json({ revenue, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = parseDateInPhilippines(dateStr);
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
            const startDate = parseDateInPhilippines(start); startDate.setHours(0,0,0,0);
            const endDate = parseDateInPhilippines(end); endDate.setHours(23,59,59,999);
            const { results } = await getTopCategoriesByRange(startDate, endDate, limit);
            return res.json({ categories: results, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = parseDateInPhilippines(dateStr);
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
            const startDate = parseDateInPhilippines(start); startDate.setHours(0,0,0,0);
            const endDate = parseDateInPhilippines(end); endDate.setHours(23,59,59,999);
            const { results } = await getTopProductsByRange(startDate, endDate, limit);
            return res.json({ products: results, startDate, endDate, range: { start, end } });
        }
        if (dateStr) {
            const d = parseDateInPhilippines(dateStr);
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


router.get("/by-source", verifyToken, verifyAdmin, async (req, res) => {
    try {
        const dataSource = String(req.query.source || 'combined');
        const timeframe = String(req.query.timeframe || '').toLowerCase();
        const start = req.query.start ? String(req.query.start) : '';
        const end = req.query.end ? String(req.query.end) : '';

        const analyticsData = await getAnalyticsDataBySource(dataSource);

        // Resolve date range
        let startDate, endDate;
        if (start && end) {
            startDate = parseDateInPhilippines(start);
            startDate.setHours(0,0,0,0);
            endDate = parseDateInPhilippines(end);
            endDate.setHours(23,59,59,999);
        } else if (timeframe) {
            const now = new Date();
            endDate = now;
            switch (timeframe) {
                case 'today':
                    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'week':
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                case 'month':
                    startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    break;
                case 'year':
                    startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
                    break;
                case 'custom':
                    // If client sends timeframe=custom but without start/end, default to last 7 days
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    break;
                default:
                    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            }
        } else {
            endDate = new Date();
            startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        const dailySalesData = await getDailySalesDataBySource(startDate, endDate, dataSource);

        res.json({
            analyticsData,
            dailySalesData,
            dataSource,
            startDate,
            endDate
        });
    } catch (error) {
        console.log("Error in analytics by-source route", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
});

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

// Get customer analytics
router.get("/customers", verifyToken, verifyAdmin, getCustomerAnalytics);

// ===== DISCREPANCY ANALYTICS ROUTES =====

// Get discrepancy analytics data
router.get("/discrepancy", verifyToken, verifyAdmin, getDiscrepancyAnalytics);

// Get discrepancy details table data
router.get("/discrepancy/details", verifyToken, verifyAdmin, getDiscrepancyDetails);

export default router;
