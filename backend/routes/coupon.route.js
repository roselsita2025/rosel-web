import express from 'express';
import { verifyAdmin, verifyToken } from '../middleware/verifyToken.js';
import { getCoupons, validateCoupon, createCoupon, updateCoupon, listCoupons, getCouponById } from '../controllers/coupon.controller.js';

const router = express.Router();

// Customer endpoints
router.get("/", verifyToken, getCoupons);
router.post("/validate", verifyToken, validateCoupon);

// Admin endpoints
router.post("/admin", verifyToken, verifyAdmin, createCoupon);
router.put("/admin/:id", verifyToken, verifyAdmin, updateCoupon);
router.get("/admin", verifyToken, verifyAdmin, listCoupons);
router.get("/admin/:id", verifyToken, verifyAdmin, getCouponById);


export default router;