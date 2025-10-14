import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    createWriteOff,
    getWriteOffs,
    getWriteOffAnalytics,
    getWriteOffTrends,
    getWriteOffByCategory
} from '../controllers/writeOff.controller.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Create a new write-off
router.post('/', createWriteOff);

// Get all write-offs with filtering and pagination
router.get('/', getWriteOffs);

// Get write-off analytics data
router.get('/analytics', getWriteOffAnalytics);

// Get write-off trends over time
router.get('/trends', getWriteOffTrends);

// Get write-offs by category
router.get('/by-category', getWriteOffByCategory);

export default router;
