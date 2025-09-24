import { stripe } from "../db/stripe.js";
import Coupon from "../models/coupon.model.js";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";
import { User } from "../models/user.model.js";
import { validateCouponForCheckout as validateCouponForCheckoutUtil, recordCouponUsage as recordCouponUsageUtil } from "../utils/coupons.js";
import lalamoveService from "../services/lalamove.service.js";
import { notificationService } from "../services/notificationService.js";

export const createCheckoutSession = async (req, res) => {
    try {
        // Payment request received
        
        // Lalamove quote structure available

        // Environment variables validated

        const { products, couponCode, shippingInfo, shippingMethod, lalamoveQuote, finalTotal, taxAmount, subtotal } = req.body;

        if (!Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ error: "No products provided" });
        }

        if (!shippingInfo) {
            return res.status(400).json({ error: "Shipping information is required" });
        }

        if (!shippingMethod) {
            return res.status(400).json({ error: "Shipping method is required" });
        }

        if (!process.env.CLIENT_URL) {
            console.error('CLIENT_URL environment variable is not set');
            return res.status(500).json({ error: "Server configuration error" });
        }

        if (!stripe) {
            console.error('Stripe is not configured');
            return res.status(500).json({ error: "Payment system not configured" });
        }

        // Calculate discount first to adjust product prices
        let discountAmount = 0;
        if (couponCode) {
            const couponDoc = await Coupon.findOne({ code: couponCode });
            if (couponDoc) {
                const productSubtotal = products.reduce((sum, product) => {
                    const quantity = product.cartQuantity || product.quantity || 1;
                    return sum + (product.price * quantity);
                }, 0);
                
                discountAmount = couponDoc.type === 'percent' 
                    ? (productSubtotal * couponDoc.amount / 100)
                    : Math.min(couponDoc.amount, productSubtotal);
            }
        }

        // Build Stripe line items and compute subtotal (in cents)
        let subtotalCents = 0;
        const lineItems = products.map((product) => {
            const cartQuantity = product.cartQuantity || product.quantity || 1;
            // Processing product
            
            // Calculate discounted price per unit
            const originalPrice = product.price;
            const totalProductValue = originalPrice * cartQuantity;
            const discountPerUnit = discountAmount > 0 ? (discountAmount * (totalProductValue / products.reduce((sum, p) => sum + (p.price * (p.cartQuantity || p.quantity || 1)), 0))) / cartQuantity : 0;
            const discountedPrice = Math.max(0, originalPrice - discountPerUnit);
            
            const unitAmount = Math.round(discountedPrice * 100);
            const quantity = cartQuantity;
            subtotalCents += unitAmount * quantity;
            
            return {
                price_data: {
                    currency: "php",
                    product_data: {
                        name: product.name,
                        images: [product.image],
                    },
                    unit_amount: unitAmount,
                },
                quantity,
            };
        });

        // Line items created successfully

        // Calculate shipping fee for Stripe
        let shippingFeeCents = 0;
        if (shippingMethod === 'lalamove' && lalamoveQuote) {
            const deliveryFee = parseFloat(
                lalamoveQuote.quotation?.data?.priceBreakdown?.total || 
                lalamoveQuote.quotation?.data?.total || 
                lalamoveQuote.quotation?.data?.price || 0
            );
            shippingFeeCents = Math.round(deliveryFee * 100);
        }

        // Validate coupon if provided
        let appliedCouponCode = "";
        if (couponCode) {
            try {
                console.log('Validating coupon:', couponCode);
                const couponDoc = await Coupon.findOne({ code: couponCode });
                console.log('Coupon found:', !!couponDoc);
                
                if (!couponDoc) {
                    return res.status(400).json({ message: "Coupon not found" });
                }
                
                const validation = validateCouponForCheckoutUtil(couponDoc, req.user, subtotalCents);
                console.log('Coupon validation result:', validation);
                
                if (!validation.valid) {
                    console.log('Coupon validation failed:', validation.message);
                    return res.status(400).json({ message: validation.message || "Invalid coupon" });
                }
                
                appliedCouponCode = couponDoc.code;
                console.log('Coupon validated successfully:', appliedCouponCode);
            } catch (couponError) {
                console.error('Error validating coupon:', couponError);
                return res.status(500).json({ message: "Error validating coupon", error: couponError.message });
            }
        }

        // Calculate product subtotal (actual revenue)
        const productSubtotal = products.reduce((sum, product) => {
            const quantity = product.cartQuantity || product.quantity || 1;
            return sum + (product.price * quantity);
        }, 0);

        // Calculate delivery fee
        let deliveryFee = 0;
        if (shippingMethod === 'lalamove' && lalamoveQuote) {
            deliveryFee = parseFloat(
                lalamoveQuote.quotation?.data?.priceBreakdown?.total || 
                lalamoveQuote.quotation?.data?.total || 
                lalamoveQuote.quotation?.data?.price || 0
            );
        }

        // Use tax amount from frontend or calculate if not provided
        const calculatedTaxAmount = taxAmount || (productSubtotal * 0.12);

        // Create a temporary order record to store full data
        const tempOrderData = {
            user: req.user._id, // Use 'user' instead of 'userId'
            products: products.map(p => ({
                product: p._id, // Use 'product' instead of 'productId'
                quantity: p.cartQuantity || p.quantity,
                price: p.price
            })),
            totalAmount: finalTotal, // Add required totalAmount
            productSubtotal: productSubtotal,
            deliveryFee: deliveryFee,
            taxAmount: calculatedTaxAmount,
            shippingInfo: shippingInfo,
            shippingMethod: shippingMethod,
            lalamoveDetails: lalamoveQuote ? {
                quotationId: lalamoveQuote.quotation?.data?.quotationId,
                quotation: lalamoveQuote.quotation, // Store the full quotation data
                serviceType: lalamoveQuote.serviceType,
                distance: lalamoveQuote.distance,
                duration: lalamoveQuote.duration,
                totalWeight: lalamoveQuote.totalWeight,
                deliveryFee: parseFloat(
                    lalamoveQuote.quotation?.data?.priceBreakdown?.total || 
                    lalamoveQuote.quotation?.data?.total || 
                    lalamoveQuote.quotation?.data?.price || 0
                ),
                status: 'pending'
            } : null,
            coupon: couponCode ? { 
                code: couponCode,
                type: 'percent', // Default type
                amount: 0, // Default amount
                discount: 0 // Default discount
            } : null,
            status: 'pending', // Use valid enum value
            paymentStatus: 'pending'
        };

        // Create temporary order without stripeSessionId initially
        const tempOrder = new Order(tempOrderData);
        await tempOrder.save();
        // Temporary order created successfully

        // Creating Stripe session

        // Add shipping fee as a separate line item if applicable
        if (shippingFeeCents > 0) {
            lineItems.push({
                price_data: {
                    currency: "php",
                    product_data: {
                        name: "Delivery Fee",
                    },
                    unit_amount: shippingFeeCents,
                },
                quantity: 1,
            });
        }

        // Add tax as a separate line item if applicable
        if (calculatedTaxAmount && calculatedTaxAmount > 0) {
            const taxCents = Math.round(calculatedTaxAmount * 100);
            lineItems.push({
                price_data: {
                    currency: "php",
                    product_data: {
                        name: "Tax (12%)",
                    },
                    unit_amount: taxCents,
                },
                quantity: 1,
            });
            // Added tax line item
        }


        const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: lineItems,
            mode: "payment",
            success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.CLIENT_URL}/purchase-cancel?session_id={CHECKOUT_SESSION_ID}`,
            // Remove discounts array since we're handling discount manually
            metadata: {
                userId: req.user._id.toString(),
                couponCode: appliedCouponCode,
                tempOrderId: tempOrder._id.toString(),
                shippingMethod: shippingMethod,
                finalTotal: finalTotal ? finalTotal.toString() : null,
            },
        });

        // Update the temporary order with the Stripe session ID
        tempOrder.stripeSessionId = session.id;
        await tempOrder.save();
        // Updated temporary order with Stripe session ID

        // Stripe session created successfully

        // Return session id and subtotal for reference (total is computed by Stripe)
        res.status(200).json({ 
            success: true,
            id: session.id, 
            subtotal: subtotalCents / 100,
            message: "Checkout session created successfully"
        });
    } catch (error) {
        console.error("Error in createCheckoutSession controller:", error);
        console.error("Error stack:", error.stack);
        console.error("Error details:", {
            message: error.message,
            name: error.name,
            code: error.code,
            statusCode: error.statusCode
        });
        res.status(500).json({ 
            success: false,
            message: "Server error", 
            error: error.message 
        });
    }
};

/**
 * Handle payment cancellation cleanup
 * POST /api/payment/cancel
 */
export const handlePaymentCancellation = async (req, res) => {
    try {
        const { sessionId } = req.body;
        
        if (!sessionId) {
            return res.status(400).json({
                success: false,
                message: 'Session ID is required'
            });
        }

        console.log('Handling payment cancellation for session:', sessionId);
        
        // Retrieve the session to get metadata
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        
        if (!session.metadata || !session.metadata.tempOrderId) {
            console.log('No temporary order found for cancelled session');
            return res.status(200).json({
                success: true,
                message: 'No temporary order to clean up'
            });
        }

        const tempOrderId = session.metadata.tempOrderId;
        
        // Find and delete the temporary order
        const tempOrder = await Order.findById(tempOrderId);
        
        if (tempOrder) {
            // Only delete if payment status is still pending (not paid)
            if (tempOrder.paymentStatus === 'pending') {
                await Order.findByIdAndDelete(tempOrderId);
                console.log(`✅ Cleaned up temporary order ${tempOrderId} for cancelled payment`);
                
                return res.status(200).json({
                    success: true,
                    message: 'Temporary order cleaned up successfully'
                });
            } else {
                console.log(`Order ${tempOrderId} already has payment status: ${tempOrder.paymentStatus}`);
                return res.status(200).json({
                    success: true,
                    message: 'Order already processed'
                });
            }
        } else {
            console.log(`Temporary order ${tempOrderId} not found`);
            return res.status(200).json({
                success: true,
                message: 'Temporary order not found'
            });
        }
        
    } catch (error) {
        console.error('Error handling payment cancellation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to handle payment cancellation',
            error: error.message
        });
    }
};

export const checkoutSuccess = async (req, res) => {
    try {
        console.log('Checkout success called with:', req.body);
        const {sessionId} = req.body;
        
        // Check if this session has already been processed and payment completed
        const existingOrder = await Order.findOne({ stripeSessionId: sessionId });
        if (existingOrder && existingOrder.paymentStatus === 'paid') {
            console.log("Session already processed and payment completed, returning existing order");
            return res.status(200).json({
                message: "Session already processed", 
                orderId: existingOrder._id,
                alreadyProcessed: true
            });
        }
        
        if (existingOrder && existingOrder.paymentStatus !== 'paid') {
            console.log("Found existing order with pending payment, processing payment completion");
        }

        console.log('Retrieving Stripe session:', sessionId);
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        console.log('Stripe session retrieved:', {
            id: session.id,
            payment_status: session.payment_status,
            metadata: session.metadata
        });

        if(session.payment_status === "paid") {
            // Get the order data - either existing order or temporary order
            let orderToProcess;
            if (existingOrder) {
                orderToProcess = existingOrder;
                console.log("Using existing order for payment processing:", orderToProcess._id);
            } else {
                const tempOrderId = session.metadata.tempOrderId;
                orderToProcess = await Order.findById(tempOrderId);
                if (!orderToProcess) {
                    return res.status(400).json({ message: "Temporary order not found" });
                }
                console.log("Using temporary order for payment processing:", orderToProcess._id);
            }

            if (session.metadata.couponCode) {
                await recordCouponUsageUtil(session.metadata.couponCode, session.metadata.userId);
            }
            
            // Update product quantities
            for (const product of orderToProcess.products) {
                await Product.findByIdAndUpdate(
                    product.product, // Use 'product' instead of 'productId'
                    { $inc: { quantity: -product.quantity } },
                    { new: true }
                );
            }
            
            // Calculate correct subtotals for accurate revenue tracking
            const productSubtotal = orderToProcess.products.reduce((sum, product) => {
                return sum + (product.price * product.quantity);
            }, 0);

            let deliveryFee = 0;
            if (orderToProcess.shippingMethod === 'lalamove' && orderToProcess.lalamoveDetails) {
                deliveryFee = orderToProcess.lalamoveDetails.deliveryFee || 0;
            }

            const taxAmount = productSubtotal * 0.12;

            // Update the order with payment details
            orderToProcess.stripeSessionId = sessionId;
            orderToProcess.paymentStatus = 'paid';
            orderToProcess.status = 'processing';
            orderToProcess.totalAmount = session.amount_total / 100;
            orderToProcess.productSubtotal = productSubtotal;
            orderToProcess.deliveryFee = deliveryFee;
            orderToProcess.taxAmount = taxAmount;
            
            // Clean up Lalamove quotation data after successful payment
            console.log('Processing Lalamove details after payment:', {
                shippingMethod: orderToProcess.shippingMethod,
                hasLalamoveDetails: !!orderToProcess.lalamoveDetails,
                lalamoveDetails: orderToProcess.lalamoveDetails
            });
            
            if (orderToProcess.shippingMethod === 'lalamove' && orderToProcess.lalamoveDetails) {
                try {
                    console.log('Cleaning up Lalamove quotation data...');
                    
                    // Remove quotation data that will expire, keep essential data for future quotation generation
                    const essentialData = {
                        serviceType: orderToProcess.lalamoveDetails.serviceType,
                        distance: orderToProcess.lalamoveDetails.distance,
                        duration: orderToProcess.lalamoveDetails.duration,
                        totalWeight: orderToProcess.lalamoveDetails.totalWeight,
                        deliveryFee: orderToProcess.lalamoveDetails.deliveryFee,
                        status: 'pending_placement', // New status indicating order is ready for admin to place
                        lastStatusUpdate: new Date()
                    };
                    
                    // Update lalamoveDetails with only essential data
                    orderToProcess.lalamoveDetails = essentialData;
                    
                    console.log('Lalamove quotation data cleaned up, essential data preserved:', essentialData);
                    
                } catch (cleanupError) {
                    console.error('Failed to clean up Lalamove data:', cleanupError);
                    // Don't fail the payment process if cleanup fails
                    orderToProcess.lalamoveDetails.status = 'pending_placement';
                }
            }
            
            await orderToProcess.save();
            console.log('✅ Order saved successfully:', {
                orderId: orderToProcess._id,
                paymentStatus: orderToProcess.paymentStatus,
                status: orderToProcess.status,
                userId: orderToProcess.user,
                totalAmount: orderToProcess.totalAmount
            });
            
            // Clear the user's cart after successful payment
            try {
                const user = await User.findById(orderToProcess.user);
                if (user) {
                    user.cartItems = [];
                    await user.save();
                    console.log('✅ User cart cleared after successful payment');
                }
            } catch (cartError) {
                console.error('❌ Error clearing user cart:', cartError);
                // Don't fail the order creation if cart clearing fails
            }
            
            // Send notification to admins about new order
            try {
                await notificationService.sendNewOrderNotification(orderToProcess);
                console.log('✅ New order notification sent successfully');
            } catch (notificationError) {
                console.error('❌ Error sending new order notification:', notificationError);
                // Don't fail the order creation if notification fails
            }
            
            res.status(200).json({ 
                message: "Payment successful, order created, and coupon usage recorded.", 
                orderId: orderToProcess._id 
            });
        } else {
            res.status(400).json({message: "Payment not completed"});
        }

    } catch (error) {
        console.log("Error in checkoutSuccess controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};



function validateCouponForCheckout(couponDoc, user, subtotalCents) {
    if (!couponDoc) {
        return { valid: false, message: "Coupon not found" };
    }
    // Only customers can use coupons
    if (!user || user.role !== "customer") {
        return { valid: false, message: "Only customers can use coupons" };
    }
    // Manual status priority
    const status = couponDoc.manualStatus || "Active";
    if (status === "Inactive") return { valid: false, message: "Coupon is inactive" };
    if (status === "Removed") return { valid: false, message: "Coupon has been removed" };
    if (status === "Used") return { valid: false, message: "Coupon can no longer be used" };

    const now = Date.now();
    if (couponDoc.expirationDate && couponDoc.expirationDate.getTime() < now) {
        return { valid: false, message: "Coupon expired" };
    }

    // Usage limits
    const totalUses = couponDoc.usage?.totalUses || 0;
    const useLimit = couponDoc.useLimit || null;
    if (useLimit !== null && totalUses >= useLimit) {
        return { valid: false, message: "Coupon usage limit reached" };
    }

    const userUsage = (couponDoc.usage?.users || []).find(u => u.userId?.toString() === user._id.toString());
    const perUserUseLimit = typeof couponDoc.perUserUseLimit === "number" ? couponDoc.perUserUseLimit : 1;
    if (userUsage && userUsage.uses >= perUserUseLimit) {
        return { valid: false, message: "You have already used this coupon the maximum number of times" };
    }

    const distinctUsersUsed = (couponDoc.usage?.users || []).length;
    const userLimit = couponDoc.userLimit || null;
    const isNewUserForCoupon = !userUsage;
    if (userLimit !== null && isNewUserForCoupon && distinctUsersUsed >= userLimit) {
        return { valid: false, message: "Coupon user limit reached" };
    }

    // Minimum order amount check
    const minOrderAmountCents = Math.round((couponDoc.minOrderAmount || 0) * 100);
    if (subtotalCents < minOrderAmountCents) {
        return { valid: false, message: `Minimum order of ₱${(minOrderAmountCents/100).toFixed(2)} required` };
    }

    // Determine discount
    if (couponDoc.type === "percent") {
        return { valid: true, discountType: "percent", discountAmountCentsOrPercent: couponDoc.amount };
    } else if (couponDoc.type === "fixed") {
        const discountCents = Math.min(Math.round(couponDoc.amount * 100), subtotalCents);
        if (discountCents <= 0) return { valid: false, message: "Invalid discount amount" };
        return { valid: true, discountType: "fixed", discountAmountCentsOrPercent: discountCents };
    }
    return { valid: false, message: "Invalid coupon configuration" };
}

async function recordCouponUsage(couponCode, userId) {
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
    // If depleted by limits, we do not flip manualStatus automatically; effective status will be computed on read
    await coupon.save();
}