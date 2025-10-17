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

router.use(verifyToken);

router.post('/', createWriteOff);

router.get('/', getWriteOffs);

router.get('/analytics', getWriteOffAnalytics);

router.get('/trends', getWriteOffTrends);

router.get('/by-category', getWriteOffByCategory);

export default router;
