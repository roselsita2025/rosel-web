import Coupon from "../models/coupon.model.js";
import { computeEffectiveStatus, validateCouponForCheckout } from "../utils/coupons.js";

// CUSTOMER
export const getCoupons = async (req, res) => {
    try {
        // For new global model, return the most relevant active coupon(s) is optional.
        // To preserve existing frontend behavior (single coupon), return null.
        return res.json(null);
    } catch (error) {
        console.log("Error in getCoupons controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const validateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code) return res.status(400).json({ message: "Code is required" });
        const coupon = await Coupon.findOne({ code });
        const subtotalCents = Math.round((subtotal || 0) * 100);
        const result = validateCouponForCheckout(coupon, req.user, subtotalCents);
        if (!result.valid) return res.status(400).json({ message: result.message });

        // respond with normalized shape for frontend
        if (result.discountType === "percent") {
            return res.json({
                message: "Coupon is valid",
                code: coupon.code,
                type: "percent",
                amount: coupon.amount,
            });
        }
        // fixed
        return res.json({
            message: "Coupon is valid",
            code: coupon.code,
            type: "fixed",
            amount: (result.discountAmountCentsOrPercent / 100),
        });
    } catch (error) {
        console.log("Error in validateCoupon controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// ADMIN
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            type, // "percent" | "fixed"
            amount,
            expirationDate,
            minOrderAmount,
            userLimit,
            useLimit,
            perUserUseLimit,
            manualStatus,
        } = req.body;

        if (!code || !type || amount == null || !expirationDate) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        const exists = await Coupon.findOne({ code });
        if (exists) return res.status(400).json({ message: "Coupon code already exists" });

        const coupon = new Coupon({
            code: code.trim(),
            type,
            amount,
            expirationDate,
            minOrderAmount: minOrderAmount ?? 0,
            userLimit: userLimit ?? null,
            useLimit: useLimit ?? null,
            perUserUseLimit: perUserUseLimit ?? 1,
            manualStatus: manualStatus ?? "Active",
        });
        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        console.log("Error in createCoupon controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body || {};
        // Disallow code changes
        delete updates.code;

        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });

        // Locking rules (based on effective status priority over manual)
        const effectiveStatus = computeEffectiveStatus(coupon);
        if (["Used", "Expired", "Removed"].includes(effectiveStatus)) {
            return res.status(400).json({ message: `Coupon is ${effectiveStatus.toLowerCase()} and cannot be updated` });
        }

        Object.assign(coupon, updates);
        await coupon.save();
        res.json(coupon);
    } catch (error) {
        console.log("Error in updateCoupon controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const listCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({}).sort({ createdAt: -1 });
        // Attach effective status; auto-mark effective Used when depleted for monitoring
        const data = coupons.map(c => {
            const obj = c.toObject();
            obj.effectiveStatus = computeEffectiveStatus(c);
            return obj;
        });
        res.json(data);
    } catch (error) {
        console.log("Error in listCoupons controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findById(id);
        if (!coupon) return res.status(404).json({ message: "Coupon not found" });
        res.json({ ...coupon.toObject(), effectiveStatus: computeEffectiveStatus(coupon) });
    } catch (error) {
        console.log("Error in getCouponById controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};