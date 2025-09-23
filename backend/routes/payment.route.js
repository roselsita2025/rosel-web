import express from 'express';
import { verifyToken } from '../middleware/verifyToken.js';
import { checkoutSuccess, createCheckoutSession, handlePaymentCancellation } from '../controllers/payment.controller.js';

const router = express.Router();

router.post("/create-checkout-session", verifyToken, createCheckoutSession); 
router.post("/checkout-success", verifyToken, checkoutSuccess);
router.post("/cancel", verifyToken, handlePaymentCancellation); 

export default router;