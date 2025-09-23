import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import {
    getUserNotifications,
    getNotificationStats,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    getNotificationSummary,
    getAllNotifications,
    createNotification,
    createBulkNotifications,
    cleanupExpiredNotifications,
    testNotification
} from '../controllers/notification.controller.js';

const router = express.Router();

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

// Customer and Admin routes (authenticated users)
router.use(verifyToken);

// Get user's notifications
router.get('/', getUserNotifications);

// Get notification statistics
router.get('/stats', getNotificationStats);

// Get notification summary for dropdown
router.get('/summary', getNotificationSummary);

// Mark a specific notification as read
router.patch('/:notificationId/read', markNotificationAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', markAllNotificationsAsRead);

// Delete a notification
router.delete('/:notificationId', deleteNotification);

// Admin-only routes
router.use(isAdmin);

// Get all notifications (admin view)
router.get('/admin/all', getAllNotifications);

// Create a notification
router.post('/admin/create', createNotification);

// Create bulk notifications
router.post('/admin/bulk', createBulkNotifications);

// Cleanup expired notifications
router.delete('/admin/cleanup', cleanupExpiredNotifications);

// Test notification endpoint (Admin only)
router.post('/test', isAdmin, testNotification);

export default router;
