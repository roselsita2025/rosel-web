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
        required: [true, 'Price is required']
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
    status: {
        type: String,
        enum: Object.values(PRODUCT_STATUSES),
        default: PRODUCT_STATUSES.AVAILABLE
    }
    },{timestamps: true });

    const Product = mongoose.model('Product', productSchema);
    
    export default Product;