import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
	{
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		products: [
			{
				product: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "Product",
					required: true,
				},
				quantity: {
					type: Number,
					required: true,
					min: 1,
				},
				price: {
					type: Number,
					required: true,
					min: 0,
				},
			},
		],
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
		// Revenue breakdown for accurate analytics
		productSubtotal: {
			type: Number,
			required: true,
			min: 0,
		},
		deliveryFee: {
			type: Number,
			default: 0,
			min: 0,
		},
		taxAmount: {
			type: Number,
			default: 0,
			min: 0,
		},
		stripeSessionId: {
			type: String,
			unique: true,
			sparse: true, // Allows multiple null values but ensures uniqueness for non-null values
		},
		// Shipping Information
		shippingInfo: {
			email: { type: String, required: true },
			firstName: { type: String, required: true },
			lastName: { type: String, required: true },
			address: { type: String, required: true },
			barangay: { type: String, required: true },
			postalCode: { type: String, required: true },
			city: { type: String, required: true },
			province: { type: String, required: true },
			phone: { type: String, required: true },
			coordinates: {
				lat: { type: Number, required: true },
				lng: { type: Number, required: true }
			},
			fullAddress: { type: String, required: true }
		},
		// Shipping Method
		shippingMethod: {
			type: String,
			enum: ['pickup', 'lalamove'],
			required: true
		},
		// Lalamove Details (if applicable)
		lalamoveDetails: {
			quotationId: { type: String },
			quotation: { type: Object }, // Store the full quotation data
			orderId: { type: String },
			serviceType: { type: String },
			distance: { type: Number },
			duration: { type: Number },
			totalWeight: { type: Number },
			deliveryFee: { type: Number },
			driverId: { type: String },
			driverName: { type: String },
			driverPhone: { type: String },
			status: { 
				type: String, 
				enum: ['pending_placement', 'pending', 'accepted', 'picked_up', 'delivered', 'cancelled', 'failed', 'expired'],
				default: 'pending_placement'
			},
			trackingUrl: { type: String },
			lastStatusUpdate: { type: Date, default: Date.now }
		},
		// Coupon Information
		coupon: {
			code: { type: String },
			type: { type: String, enum: ['percent', 'fixed'] },
			amount: { type: Number },
			discount: { type: Number }
		},
		// Order Status
		status: {
			type: String,
			enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
			default: 'pending'
		},
		// Admin Order Status (for tracking admin workflow)
		adminStatus: {
			type: String,
			enum: ['order_received', 'order_preparing', 'order_prepared', 'order_placed', 'order_picked_up', 'order_completed'],
			default: 'order_received'
		},
		// Payment Information
		paymentStatus: {
			type: String,
			enum: ['pending', 'paid', 'failed', 'refunded'],
			default: 'pending'
		}
	},
	{ timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);

export default Order;