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

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin role required.'
        });
    }
    next();
};

router.use(verifyToken);

router.get('/', getUserNotifications);

router.get('/stats', getNotificationStats);

router.get('/summary', getNotificationSummary);

router.patch('/:notificationId/read', markNotificationAsRead);

router.patch('/mark-all-read', markAllNotificationsAsRead);

router.delete('/:notificationId', deleteNotification);

router.use(isAdmin);

router.get('/admin/all', getAllNotifications);

router.post('/admin/create', createNotification);

router.post('/admin/bulk', createBulkNotifications);

router.delete('/admin/cleanup', cleanupExpiredNotifications);

router.post('/test', isAdmin, testNotification);

export default router;
