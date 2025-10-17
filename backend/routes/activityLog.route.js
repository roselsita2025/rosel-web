import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
import {
    getActivityLogs,
    getActivityLogsByProduct,
    getActivityStats
} from "../controllers/activityLog.controller.js";

const router = express.Router();

router.use(verifyToken);

router.get("/", getActivityLogs);

router.get("/product/:productId", getActivityLogsByProduct);

router.get("/stats", getActivityStats);

export default router;
