import express from 'express';
import { sendContactMessage, getContactInfo } from '../controllers/contact.controller.js';

const router = express.Router();

// Public routes - no authentication required
router.post('/send-message', sendContactMessage);
router.get('/info', getContactInfo);

export default router;
