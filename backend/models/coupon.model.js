import mongoose from "mongoose";

const couponUsageSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
		uses: { type: Number, default: 0 },
	},
	{ _id: false }
);

const couponSchema = new mongoose.Schema(
	{
		code: {
			type: String,
			required: true,
			unique: true,
			trim: true,
		},
		type: {
			type: String,
			enum: ["percent", "fixed"],
			required: true,
		},
		amount: {
			type: Number, // percent or currency amount depending on type
			required: true,
			min: 0,
		},
		minOrderAmount: {
			type: Number, // in PHP
			default: 0,
			min: 0,
		},
		expirationDate: {
			type: Date,
			required: true,
		},
		userLimit: {
			type: Number, // number of distinct users allowed to use this coupon
			default: null,
			min: 1,
		},
		useLimit: {
			type: Number, // total number of times the coupon can be used across all users
			default: null,
			min: 1,
		},
		perUserUseLimit: {
			type: Number, // how many times each user can use the coupon
			default: 1,
			min: 1,
		},
		manualStatus: {
			type: String,
			enum: ["Active", "Inactive", "Used", "Expired", "Removed"],
			default: "Active",
		},
		usage: {
			totalUses: { type: Number, default: 0 },
			users: [couponUsageSchema],
		},
	},
	{
		timestamps: true,
	}
);

const Coupon = mongoose.model("Coupon", couponSchema);

export default Coupon;