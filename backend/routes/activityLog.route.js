import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getActivityLogs,
    getActivityLogsByProduct,
    getActivityStats
} from "../controllers/activityLog.controller.js";

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Get all activity logs with filtering and pagination
router.get("/", getActivityLogs);

// Get activity logs for a specific product
router.get("/product/:productId", getActivityLogsByProduct);

// Get activity statistics
router.get("/stats", getActivityStats);

export default router;
