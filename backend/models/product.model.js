import mongoose from "mongoose";
import { CATEGORIES, PRODUCT_STATUSES } from "../constants/products.js";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required']
    },
    price: {
        type: Number,
        min: 0,
        default: 0
    },
    description: {
        type: String,
        required: [true, 'Description is required']
    },
    barcode: {
        type: String,
        trim: true,
        unique: true,
        sparse: true,
        default: undefined
    },
    image: {
        type: String,
        required: [true, 'Image is required']
    },
    images: {
        type: [String],
        default: []
    },
    mainImageUrl: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
        enum: CATEGORIES       
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    quantity: {
        type: Number,
        min: 0,
        default: 0,
        required: [true, 'Quantity is required']
    },
    // Base price per kilogram used when weight options are specified
    basePricePerKg: {
        type: Number,
        min: 0,
        required: [true, 'Base price per kilogram is required']
    },
    // Weight-based variants with independent stock counts
    weightOptions: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            weightKg: { type: Number, min: 0.01, required: true },
            stockUnits: { type: Number, min: 0, default: 0, required: true }
        }
    ],
    status: {
        type: String,
        enum: Object.values(PRODUCT_STATUSES),
        default: PRODUCT_STATUSES.AVAILABLE
    },
    supplier: {
        type: String,
        trim: true,
        default: ""
    }
    },{
    timestamps: true,
    toJSON: { virtuals: true, transform: function(doc, ret) {
        try {
            const hasWeightOptions = Array.isArray(doc.weightOptions) && doc.weightOptions.length > 0;
            ret.hasWeightOptions = hasWeightOptions;
            if (hasWeightOptions) {
                const base = Number(doc.basePricePerKg || 0);
                let priceMin = null;
                let priceMax = null;
                let totalStockUnits = 0;
                ret.weightOptions = (ret.weightOptions || []).map((opt) => {
                    const w = Number(opt.weightKg || 0);
                    const price = Number((base * w).toFixed(2));
                    const stockUnits = Number(opt.stockUnits || 0);
                    totalStockUnits += stockUnits;
                    priceMin = priceMin === null ? price : Math.min(priceMin, price);
                    priceMax = priceMax === null ? price : Math.max(priceMax, price);
                    return { ...opt, price };
                });
                // If there is still legacy quantity on the product (from pre-weight mode), expose it as a synthetic 15kg option
                const legacyQty = Number(ret.quantity || 0);
                if (legacyQty > 0) {
                    const defaultWeightKg = 15;
                    const alreadyHas15 = ret.weightOptions.some(o => Number(o.weightKg).toFixed(2) === Number(defaultWeightKg).toFixed(2));
                    if (!alreadyHas15) {
                        const price = Number((base * defaultWeightKg).toFixed(2));
                        ret.weightOptions.push({ weightKg: defaultWeightKg, stockUnits: legacyQty, price });
                        totalStockUnits += legacyQty;
                        priceMin = priceMin === null ? price : Math.min(priceMin, price);
                        priceMax = priceMax === null ? price : Math.max(priceMax, price);
                    }
                }
                ret.priceMin = priceMin === null ? 0 : priceMin;
                ret.priceMax = priceMax === null ? 0 : priceMax;
                ret.totalStockUnits = totalStockUnits;
            } else {
                // For legacy products without weight options, synthesize a default 15kg option for display purposes
                const legacyQty = Number(ret.quantity || 0);
                const defaultWeightKg = 15;
                const base = Number(doc.basePricePerKg || 0);
                const price = Number((base * defaultWeightKg).toFixed(2));
                ret.weightOptions = [
                    {
                        // No real subdocument id; keep undefined so mutation actions stay disabled
                        weightKg: defaultWeightKg,
                        stockUnits: legacyQty,
                        price,
                    },
                ];
                ret.priceMin = price;
                ret.priceMax = price;
                ret.totalStockUnits = legacyQty;
            }
        } catch (_) {
            // Best-effort transform; ignore errors to avoid breaking responses
        }
        return ret;
    }},
    toObject: { virtuals: true }
});

    const Product = mongoose.model('Product', productSchema);
    
    export default Product;