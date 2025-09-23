import express from 'express';
import { verifyToken, verifyAdmin } from '../middleware/verifyToken.js';
import {
    createChat,
    getCustomerChats,
    getAdminChats,
    getChatMessages,
    sendMessage,
    assignChatToAdmin,
    updateChatStatus,
    endChat,
    getFAQs,
    createFAQ,
    updateFAQ,
    deleteFAQ,
    sendFAQResponse
} from '../controllers/chat.controller.js';

const router = express.Router();

// Customer routes (authenticated users)
router.post('/create', verifyToken, createChat);
router.get('/customer', verifyToken, getCustomerChats);
router.get('/:chatId/messages', verifyToken, getChatMessages);
router.post('/:chatId/messages', verifyToken, sendMessage);
router.post('/:chatId/faq-response', verifyToken, sendFAQResponse);
router.put('/:chatId/end', verifyToken, endChat);

// Public FAQ routes
router.get('/faqs', getFAQs);

// Admin routes
router.get('/admin/chats', verifyToken, verifyAdmin, getAdminChats);
router.post('/:chatId/assign', verifyToken, verifyAdmin, assignChatToAdmin);
router.patch('/:chatId/status', verifyToken, verifyAdmin, updateChatStatus);

// Admin FAQ management
router.post('/faqs', verifyToken, verifyAdmin, createFAQ);
router.patch('/faqs/:faqId', verifyToken, verifyAdmin, updateFAQ);
router.delete('/faqs/:faqId', verifyToken, verifyAdmin, deleteFAQ);

export default router;
