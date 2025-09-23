import ActivityLog from "../models/activityLog.model.js";
import Product from "../models/product.model.js";

export const getActivityLogs = async (req, res) => {
    try {
        console.log("Activity logs request received:", req.query);
        
        const {
            productId,
            adminId,
            action,
            startDate,
            endDate,
            page = 1,
            limit = 50,
            sort = "createdAt",
            order = "desc"
        } = req.query;

        // Build filter object
        const filter = {};
        
        if (productId) {
            filter.productId = productId;
        }
        
        if (adminId) {
            filter.adminId = adminId;
        }
        
        if (action) {
            filter.action = action;
        }
        
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        console.log("Filter object:", filter);

        // Build sort object
        const sortObj = {};
        sortObj[sort] = order === 'asc' ? 1 : -1;

        // Pagination
        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNumber - 1) * pageSize;

        // Execute query
        const [logs, total] = await Promise.all([
            ActivityLog.find(filter)
                .populate('productId', 'name category')
                .populate('adminId', 'name email')
                .sort(sortObj)
                .skip(skip)
                .limit(pageSize)
                .lean(),
            ActivityLog.countDocuments(filter)
        ]);

        console.log("Activity logs found:", logs.length, "Total:", total);

        res.json({
            logs,
            total,
            page: pageNumber,
            pageSize: logs.length,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.log("Error in getActivityLogs controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getActivityLogsByProduct = async (req, res) => {
    try {
        const { productId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const pageNumber = Math.max(1, parseInt(page));
        const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
        const skip = (pageNumber - 1) * pageSize;

        const [logs, total] = await Promise.all([
            ActivityLog.find({ productId })
                .populate('adminId', 'name email')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(pageSize)
                .lean(),
            ActivityLog.countDocuments({ productId })
        ]);

        res.json({
            logs,
            total,
            page: pageNumber,
            pageSize: logs.length,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.log("Error in getActivityLogsByProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const createActivityLog = async (logData) => {
    try {
        const activityLog = new ActivityLog(logData);
        await activityLog.save();
        return activityLog;
    } catch (error) {
        console.log("Error creating activity log", error.message);
        throw error;
    }
};

export const getActivityStats = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        const filter = {};
        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) {
                filter.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                filter.createdAt.$lte = new Date(endDate);
            }
        }

        const stats = await ActivityLog.aggregate([
            { $match: filter },
            {
                $group: {
                    _id: "$action",
                    count: { $sum: 1 },
                    totalQuantityChange: { $sum: "$quantityChange" }
                }
            }
        ]);

        const totalActivities = await ActivityLog.countDocuments(filter);
        const uniqueProducts = await ActivityLog.distinct("productId", filter);
        const uniqueAdmins = await ActivityLog.distinct("adminId", filter);

        res.json({
            stats,
            totalActivities,
            uniqueProducts: uniqueProducts.length,
            uniqueAdmins: uniqueAdmins.length
        });
    } catch (error) {
        console.log("Error in getActivityStats controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};
