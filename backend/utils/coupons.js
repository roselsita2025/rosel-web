import Coupon from "../models/coupon.model.js";

export function computeEffectiveStatus(couponDoc) {
    if (!couponDoc) return "Removed";
    const manual = couponDoc.manualStatus || "Active";
    if (["Inactive", "Used", "Expired", "Removed"].includes(manual)) return manual;
    const now = Date.now();
    if (couponDoc.expirationDate && couponDoc.expirationDate.getTime() < now) return "Expired";
    const totalUses = couponDoc.usage?.totalUses || 0;
    if (typeof couponDoc.useLimit === "number" && totalUses >= couponDoc.useLimit) return "Used";
    const distinctUsers = (couponDoc.usage?.users || []).length;
    if (typeof couponDoc.userLimit === "number" && distinctUsers >= couponDoc.userLimit) return "Used";
    return "Active";
}

export function validateCouponForCheckout(couponDoc, user, subtotalCents) {
    if (!couponDoc) {
        return { valid: false, message: "Coupon not found" };
    }
    if (!user || user.role !== "customer") {
        return { valid: false, message: "Only customers can use coupons" };
    }

    const effectiveStatus = computeEffectiveStatus(couponDoc);
    if (effectiveStatus !== "Active") {
        return { valid: false, message: `Coupon is ${effectiveStatus.toLowerCase()}` };
    }

    const now = Date.now();
    if (couponDoc.expirationDate && couponDoc.expirationDate.getTime() < now) {
        return { valid: false, message: "Coupon expired" };
    }

    // Usage limits
    const totalUses = couponDoc.usage?.totalUses || 0;
    const useLimit = couponDoc.useLimit ?? null;
    if (useLimit !== null && totalUses >= useLimit) {
        return { valid: false, message: "Coupon usage limit reached" };
    }

    const userUsage = (couponDoc.usage?.users || []).find(u => u.userId?.toString() === user._id.toString());
    const perUserUseLimit = typeof couponDoc.perUserUseLimit === "number" ? couponDoc.perUserUseLimit : 1;
    if (userUsage && userUsage.uses >= perUserUseLimit) {
        return { valid: false, message: "You have already used this coupon the maximum number of times" };
    }

    const distinctUsersUsed = (couponDoc.usage?.users || []).length;
    const userLimit = couponDoc.userLimit ?? null;
    const isNewUserForCoupon = !userUsage;
    if (userLimit !== null && isNewUserForCoupon && distinctUsersUsed >= userLimit) {
        return { valid: false, message: "Coupon user limit reached" };
    }

    // Minimum order amount
    const minOrderAmountCents = Math.round((couponDoc.minOrderAmount || 0) * 100);
    if (subtotalCents < minOrderAmountCents) {
        return { valid: false, message: `Minimum order of ₱${(minOrderAmountCents/100).toFixed(2)} required` };
    }

    // Determine discount
    if (couponDoc.type === "percent") {
        return { valid: true, discountType: "percent", discountAmountCentsOrPercent: couponDoc.amount };
    }
    if (couponDoc.type === "fixed") {
        const discountCents = Math.min(Math.round(couponDoc.amount * 100), subtotalCents);
        if (discountCents <= 0) return { valid: false, message: "Invalid discount amount" };
        return { valid: true, discountType: "fixed", discountAmountCentsOrPercent: discountCents };
    }
    return { valid: false, message: "Invalid coupon configuration" };
}

export async function recordCouponUsage(couponCode, userId) {
    const coupon = await Coupon.findOne({ code: couponCode });
    if (!coupon) return;
    const users = coupon.usage?.users || [];
    const existing = users.find(u => u.userId?.toString() === userId.toString());
    if (existing) {
        existing.uses += 1;
    } else {
        users.push({ userId, uses: 1 });
    }
    const totalUses = (coupon.usage?.totalUses || 0) + 1;
    coupon.usage = { users, totalUses };
    await coupon.save();
}


