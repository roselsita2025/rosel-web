import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import {
    createReplacementRequest,
    getCustomerReplacementRequests,
    getReplacementRequestDetails,
    cancelReplacementRequest,
    getAllReplacementRequests,
    getAdminReplacementRequestDetails,
    updateReplacementRequestStatus,
    getReplacementRequestStats
} from '../controllers/replacementRequest.controller.js';

const router = express.Router();

// Customer routes (require authentication)
router.post('/', verifyToken, createReplacementRequest);
router.get('/', verifyToken, getCustomerReplacementRequests);
router.get('/:requestId', verifyToken, getReplacementRequestDetails);
router.patch('/:requestId/cancel', verifyToken, cancelReplacementRequest);

// Admin routes (require admin authentication)
router.get('/admin/all', verifyToken, verifyAdmin, getAllReplacementRequests);
router.get('/admin/stats', verifyToken, verifyAdmin, getReplacementRequestStats);
router.get('/admin/:requestId', verifyToken, verifyAdmin, getAdminReplacementRequestDetails);
router.patch('/admin/:requestId/status', verifyToken, verifyAdmin, updateReplacementRequestStatus);

export default router;
