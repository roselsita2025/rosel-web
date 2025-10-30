import mongoose from "mongoose";
import { CATEGORIES, PRODUCT_STATUSES } from "../constants/products.js";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        unique: true,
        trim: true
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
    basePricePerKg: {
        type: Number,
        min: 0,
        required: [true, 'Base price per kilogram is required']
    },
    weightOptions: [
        {
            _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
            weightKg: { type: Number, min: 0.01, required: true },
            stockUnits: { type: Number, min: 0, default: 0, required: true },
            barcode: { 
                type: String, 
                trim: true, 
                sparse: true,
                default: undefined
            },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now },
            expireAt: { 
                type: Date, 
                default: function() {
                    return new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
                }
            }
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
                const legacyQty = Number(ret.quantity || 0);
                const defaultWeightKg = 15;
                const base = Number(doc.basePricePerKg || 0);
                const price = Number((base * defaultWeightKg).toFixed(2));
                ret.weightOptions = [
                    {
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

// Custom validation to ensure weight option barcodes are unique across all products
productSchema.pre('save', async function(next) {
    if (!this.isModified('weightOptions')) {
        return next();
    }
    
    try {
        // Get all weight option barcodes from this product (excluding empty/undefined)
        const weightBarcodes = (this.weightOptions || [])
            .map(opt => opt.barcode)
            .filter(barcode => barcode && barcode.trim());
        
        if (weightBarcodes.length === 0) {
            return next();
        }
        
        // Check for duplicates within this product's own weight options
        const uniqueBarcodes = new Set(weightBarcodes);
        if (uniqueBarcodes.size !== weightBarcodes.length) {
            const error = new Error('Duplicate barcodes found within weight options of this product');
            error.code = 11000;
            return next(error);
        }
        
        // Check if any of these barcodes exist in other products' weight options
        const Product = this.constructor;
        const conflictingProducts = await Product.find({
            _id: { $ne: this._id },
            'weightOptions.barcode': { $in: weightBarcodes }
        });
        
        if (conflictingProducts.length > 0) {
            const conflictingBarcode = conflictingProducts[0].weightOptions
                .find(opt => weightBarcodes.includes(opt.barcode))?.barcode;
            const error = new Error(`Weight option barcode '${conflictingBarcode}' already exists in another product`);
            error.code = 11000;
            error.conflictingBarcode = conflictingBarcode;
            return next(error);
        }
        
        next();
    } catch (error) {
        next(error);
    }
});

    const Product = mongoose.model('Product', productSchema);
    
    export default Product;