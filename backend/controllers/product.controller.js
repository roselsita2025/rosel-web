import { privateDecrypt } from "crypto";
import cloudinary from "../db/cloudinary.js";
import { redis } from "../db/redis.js";
import Product from "../models/product.model.js";
import Order from "../models/order.model.js";
import { CATEGORIES, PRODUCT_STATUSES } from "../constants/products.js";
import { notificationService } from "../services/notificationService.js";
import { createActivityLog } from "./activityLog.controller.js";

export const getAllProducts = async (req, res) => {
    try {
        // Admin view: include all statuses
        const products = await Product.find({});
        res.json({products});
    } catch (error) {
        console.log("Error in getAllProducts controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getAllProductsForCustomers = async (req, res) => {
    try {
        // Customer view: only available products
        const products = await Product.find({ status: PRODUCT_STATUSES.AVAILABLE });
        res.json({products});
    } catch (error) {
        console.log("Error in getAllProductsForCustomers controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getFeaturedProducts = async (req, res) => {
    try {
        // Check if cache should be bypassed (for testing)
        const bypassCache = req.query.bypass === 'true' || req.query.t; // Also bypass on timestamp parameter
        
        if (!bypassCache) {
            let cached = await redis.get("featuredProducts");
            if (cached) {
                return res.json(JSON.parse(cached));
            }
        }

        const hybrid = await buildHybridFeaturedProducts();
        await redis.set("featuredProducts", JSON.stringify(hybrid));
        // Only expose available products to guests
        const filtered = Array.isArray(hybrid) ? hybrid.filter((p) => p.status === PRODUCT_STATUSES.AVAILABLE) : [];
        res.json(filtered);
    } catch (error) {
        console.log("Error in getFeaturedProducts controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const createProduct = async (req, res) => {
    try {
        const {name, description, basePricePerKg, image, images = [], category, quantity, barcode, weightKg, supplier} = req.body;

        // Validate category against fixed list
        if (!CATEGORIES.includes(String(category))) {
            return res.status(400).json({ message: "Invalid category" });
        }

        // Gather image payloads (support legacy single 'image' and new 'images' array)
        const incomingImages = [];
        if (Array.isArray(images)) incomingImages.push(...images.filter(Boolean));
        if (image) incomingImages.unshift(image);

        const uploadedUrls = [];
        for (const img of incomingImages) {
            // If already a URL, keep; if base64, upload
            if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
                uploadedUrls.push(img);
            } else if (img) {
                const uploaded = await cloudinary.uploader.upload(img, { folder: "products" });
                uploadedUrls.push(uploaded.secure_url);
            }
        }

        const mainImageUrl = uploadedUrls[0] || "";

        const product = await Product.create({
            name,
            description,
            basePricePerKg,
            image: mainImageUrl, // keep legacy field for compatibility
            images: uploadedUrls,
            mainImageUrl,
            category,
            quantity: weightKg ? 0 : (quantity || 0), // Only set quantity for legacy products without weight options
            status: PRODUCT_STATUSES.AVAILABLE,
            barcode: typeof barcode === 'string' && barcode.trim() ? barcode.trim() : undefined,
            supplier: supplier || "",
            // If weightKg is provided, create an initial weight option
            ...(weightKg && { weightOptions: [{ weightKg: Number(weightKg), stockUnits: quantity || 0 }] })
        });

        // Log the activity
        try {
            let activityDetails;
            let quantityChange = 0;
            let newQuantity = 0;

            if (weightKg && product.weightOptions && product.weightOptions.length > 0) {
                // Product created with weight options
                const weightOption = product.weightOptions[0];
                activityDetails = `Product created with a weight of ${weightOption.weightKg}kg with a stock of ${weightOption.stockUnits} units`;
                quantityChange = weightOption.stockUnits;
                newQuantity = weightOption.stockUnits;
            } else {
                // Legacy product without weight options
                activityDetails = `Product created with initial stock of ${product.quantity} units`;
                quantityChange = product.quantity;
                newQuantity = product.quantity;
            }

            await createActivityLog({
                productId: product._id,
                productName: product.name,
                action: 'created',
                details: activityDetails,
                adminId: req.user.id,
                adminName: req.user.name,
                changes: {
                    basePricePerKg: product.basePricePerKg,
                    quantity: weightKg ? (product.weightOptions?.[0]?.stockUnits || 0) : product.quantity,
                    status: product.status,
                    category: product.category,
                    ...(weightKg && { weightKg: Number(weightKg) })
                },
                quantityChange: quantityChange,
                newQuantity: newQuantity
            });
        } catch (logError) {
            console.error('Error logging product creation:', logError);
            // Don't fail the product creation if logging fails
        }

        // Send notification to admins about new product
        try {
            await notificationService.sendProductCreatedNotification(product);
        } catch (notificationError) {
            console.error('Error sending product created notification:', notificationError);
            // Don't fail the product creation if notification fails
        }

        res.status(201).json({product});
    } catch (error) {
        console.log("Error in createProduct controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        const urlsToDelete = new Set();
        if (product.image) urlsToDelete.add(product.image);
        if (Array.isArray(product.images)) product.images.forEach((u) => urlsToDelete.add(u));
        if (product.mainImageUrl) urlsToDelete.add(product.mainImageUrl);

        for (const url of urlsToDelete) {
            const last = String(url).split("/").pop() || "";
            const publicId = last.split(".")[0];
            if (publicId) {
                try {
                    await cloudinary.uploader.destroy(`products/${publicId}`);
                } catch (error) {
                    console.log("Error deleting image from cloudinary", error);
                }
            }
        }

        // Log the deletion activity
        try {
            await createActivityLog({
                productId: product._id,
                productName: product.name,
                action: 'deleted',
                details: `Product deleted permanently`,
                adminId: req.user.id,
                adminName: req.user.name,
                changes: {
                    status: 'deleted'
                }
            });
        } catch (logError) {
            console.error('Error logging product deletion:', logError);
            // Don't fail the product deletion if logging fails
        }

        // Send notification to admins about product removal
        try {
            await notificationService.sendProductRemovedNotification(product);
        } catch (notificationError) {
            console.error('Error sending product removed notification:', notificationError);
            // Don't fail the product deletion if notification fails
        }

        await Product.findByIdAndDelete(req.params.id);

        res.json({message: "Product deleted successfully"});
    } catch (error) {
        console.log("Error in deleteProduct controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
    
};

export const getRecommendedProducts = async (req, res) => {
    try {
        // Get top 6 selling products based on total ordered quantity and only available products
        // Exclude cancelled and refunded orders from recommendations
        const topSellingProductIds = await Order.aggregate([
            // Filter out cancelled and refunded orders
            { $match: { 
                status: { $nin: ['cancelled', 'refunded'] },
                paymentStatus: 'paid' // Only include paid orders
            }},
            { $unwind: "$products" },
            { $group: { _id: "$products.product", totalQuantity: { $sum: "$products.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 6 }
        ]);

        // Get the actual product documents with virtual fields
        const productIds = topSellingProductIds.map(item => item._id);
        const products = await Product.find({ 
            _id: { $in: productIds },
            status: PRODUCT_STATUSES.AVAILABLE 
        });

        // Add sales data to each product
        const productsWithSales = products.map(product => {
            const salesData = topSellingProductIds.find(item => item._id.toString() === product._id.toString());
            return {
                ...product.toJSON(),
                sales: salesData ? salesData.totalQuantity : 0
            };
        });

        res.json({ products: productsWithSales });
    } catch (error) {
        console.log("Error in getRecommendedProducts controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getProductsByCategory = async (req, res) => {
    const {category} = req.params;
    try {
        const products = await Product.find({category, status: PRODUCT_STATUSES.AVAILABLE});
        res.json({products});
    } catch (error) {
        console.log("Error in getProductsByCategory controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const searchProducts = async (req, res) => {
    try {
        const {
            q,
            category,
            minPrice,
            maxPrice,
            inStock,
            status,
            sort = "createdAt",
            order = "desc",
            page = 1,
            limit = 20,
        } = req.query;

        const filter = {};
        // By default, guests searching should see available only; admin can include others
        if (typeof status === 'string' && Object.values(PRODUCT_STATUSES).includes(status)) {
            filter.status = status;
        } else {
            filter.status = PRODUCT_STATUSES.AVAILABLE;
        }

        if (q && String(q).trim() !== "") {
            filter.name = { $regex: String(q).trim(), $options: "i" };
        }

        if (category && String(category).trim() !== "") {
            filter.category = String(category).trim();
        }

        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = Number(minPrice);
            if (maxPrice) filter.price.$lte = Number(maxPrice);
        }

        if (inStock === "true") {
            filter.quantity = { $gt: 0 };
        } else if (inStock === "false") {
            filter.quantity = { $lte: 0 };
        }

        const sortField = ["price", "name", "createdAt", "category"].includes(sort) ? sort : "createdAt";
        const sortOrder = String(order).toLowerCase() === "asc" ? 1 : -1;
        const sortObj = { [sortField]: sortOrder };

        const pageNumber = Math.max(1, Number(page) || 1);
        const pageSize = Math.max(1, Math.min(100, Number(limit) || 20));
        const skip = (pageNumber - 1) * pageSize;

        const [total, products] = await Promise.all([
            Product.countDocuments(filter),
            Product.find(filter).sort(sortObj).skip(skip).limit(pageSize)
        ]);

        res.json({ products, total, page: pageNumber, pageSize: products.length });
    } catch (error) {
        console.log("Error in searchProducts controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const suggestProducts = async (req, res) => {
    try {
        const { q, limit = 5 } = req.query;
        if (!q || String(q).trim() === "") {
            return res.json({ suggestions: [] });
        }

        const suggestions = await Product.find({
            name: { $regex: String(q).trim(), $options: "i" },
            status: PRODUCT_STATUSES.AVAILABLE,
        })
        .select("name image mainImageUrl price quantity category")
        .limit(Math.max(1, Math.min(20, Number(limit) || 5)));

        res.json({ suggestions });
    } catch (error) {
        console.log("Error in suggestProducts controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const toggleFeaturedProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.isFeatured = !product.isFeatured;
            const updatedProduct = await product.save();
            await updateFeaturedProductsCache();
            res.json(updatedProduct);
        } else {
            res.status(404).json({message: "Product not found"});
        }
    } catch (error) {
        console.log("Error in toggleFeaturedProduct controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }
        // Expose only available products to guests. Admin routes use /products (protected) instead.
        if (product.status !== PRODUCT_STATUSES.AVAILABLE) {
            return res.status(404).json({ message: "Product not found" });
        }
        res.json({product});
    } catch (error) {
        console.log("Error in getProductById controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const getProductByBarcode = async (req, res) => {
    try {
        const { barcode } = req.params;
        if (!barcode || !String(barcode).trim()) {
            return res.status(400).json({ message: "Barcode is required" });
        }
        const product = await Product.findOne({ barcode: String(barcode).trim() });
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        // Admin route only – do not filter by status here
        res.json({ product });
    } catch (error) {
        console.log("Error in getProductByBarcode controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const getProductsBatch = async (req, res) => {
    try {
        const { ids } = req.query;
        if (!ids) {
            return res.status(400).json({ message: "Product IDs are required" });
        }

        const productIds = ids.split(',').map(id => id.trim()).filter(id => id);
        if (productIds.length === 0) {
            return res.status(400).json({ message: "At least one valid product ID is required" });
        }

        const products = await Product.find({ 
            _id: { $in: productIds },
            status: PRODUCT_STATUSES.AVAILABLE 
        });

        res.json({ products });
    } catch (error) {
        console.log("Error in getProductsBatch controller:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Updatable fields
        const { name, category, barcode, basePricePerKg, description, status, isFeatured, supplier, addImages = [], removeImageUrls = [], mainImageUrl } = req.body;

        // Store original values for change detection
        const originalValues = {
            name: product.name,
            category: product.category,
            barcode: product.barcode,
            basePricePerKg: product.basePricePerKg,
            description: product.description,
            isFeatured: product.isFeatured,
            supplier: product.supplier,
            status: product.status
        };

        if (typeof name === 'string' && name.trim()) product.name = name.trim();
        if (typeof category === 'string' && category.trim()) product.category = category.trim();
        if (typeof barcode === 'string') product.barcode = barcode.trim() || undefined;
        if (typeof basePricePerKg === 'number') product.basePricePerKg = basePricePerKg;
        if (typeof description === 'string') product.description = description;
        if (typeof isFeatured === 'boolean') product.isFeatured = isFeatured;
        if (typeof supplier === 'string') product.supplier = supplier.trim();

        if (status) {
            if (!Object.values(PRODUCT_STATUSES).includes(status)) {
                return res.status(400).json({ message: "Invalid status" });
            }
            // If trashed: delete and return
            if (status === PRODUCT_STATUSES.TRASHED) {
                // delete images then delete product
                const urlsToDelete = new Set();
                if (product.image) urlsToDelete.add(product.image);
                if (Array.isArray(product.images)) product.images.forEach((u) => urlsToDelete.add(u));
                if (product.mainImageUrl) urlsToDelete.add(product.mainImageUrl);
                for (const url of urlsToDelete) {
                    const last = String(url).split("/").pop() || "";
                    const publicId = last.split(".")[0];
                    if (publicId) {
                        try { await cloudinary.uploader.destroy(`products/${publicId}`); } catch {}
                    }
                }
                await Product.findByIdAndDelete(id);
                return res.json({ message: "Product moved to trash and removed" });
            }
            product.status = status;
        }

        // Handle image removals
        if (Array.isArray(removeImageUrls) && removeImageUrls.length > 0) {
            product.images = (product.images || []).filter((u) => !removeImageUrls.includes(u));
            if (removeImageUrls.includes(product.image)) product.image = "";
            if (removeImageUrls.includes(product.mainImageUrl)) product.mainImageUrl = "";
            for (const url of removeImageUrls) {
                const last = String(url).split("/").pop() || "";
                const publicId = last.split(".")[0];
                if (publicId) {
                    try { await cloudinary.uploader.destroy(`products/${publicId}`); } catch {}
                }
            }
        }

        // Handle image additions (base64 or URLs)
        if (Array.isArray(addImages) && addImages.length > 0) {
            const newUrls = [];
            for (const img of addImages) {
                if (typeof img === 'string' && (img.startsWith('http://') || img.startsWith('https://'))) {
                    newUrls.push(img);
                } else if (img) {
                    const uploaded = await cloudinary.uploader.upload(img, { folder: "products" });
                    newUrls.push(uploaded.secure_url);
                }
            }
            product.images = [...(product.images || []), ...newUrls];
            if (!product.mainImageUrl && newUrls[0]) product.mainImageUrl = newUrls[0];
            if (!product.image && (product.mainImageUrl || product.images[0])) product.image = product.mainImageUrl || product.images[0];
        }

        // Set new main image if provided
        if (typeof mainImageUrl === 'string' && mainImageUrl) {
            if (!product.images?.includes(mainImageUrl)) {
                product.images = [mainImageUrl, ...(product.images || [])];
            }
            product.mainImageUrl = mainImageUrl;
            product.image = mainImageUrl; // keep legacy in sync
        }

        const updated = await product.save();
        if (typeof isFeatured === 'boolean' || status) {
            await updateFeaturedProductsCache();
        }

        // Log the activity if there were changes
        try {
            const changes = {};
            
            // Check for changes in all updatable fields
            if (typeof name === 'string' && name.trim() && name.trim() !== originalValues.name) {
                changes.name = { from: originalValues.name, to: name.trim() };
            }
            if (typeof category === 'string' && category.trim() && category.trim() !== originalValues.category) {
                changes.category = { from: originalValues.category, to: category.trim() };
            }
            if (typeof barcode === 'string') {
                const newBarcode = barcode.trim() || undefined;
                if (newBarcode !== originalValues.barcode) {
                    changes.barcode = { from: originalValues.barcode || 'none', to: newBarcode || 'none' };
                }
            }
            if (typeof basePricePerKg === 'number' && basePricePerKg !== originalValues.basePricePerKg) {
                changes.basePricePerKg = { from: originalValues.basePricePerKg, to: basePricePerKg };
            }
            if (typeof description === 'string' && description !== originalValues.description) {
                changes.description = { from: originalValues.description, to: description };
            }
            if (typeof isFeatured === 'boolean' && isFeatured !== originalValues.isFeatured) {
                changes.isFeatured = { from: originalValues.isFeatured, to: isFeatured };
            }
            if (status && status !== originalValues.status) {
                changes.status = { from: originalValues.status, to: status };
            }
            if (typeof supplier === 'string' && supplier.trim() !== originalValues.supplier) {
                changes.supplier = { from: originalValues.supplier || 'none', to: supplier.trim() || 'none' };
            }
            
            // Check for image changes
            if (Array.isArray(addImages) && addImages.length > 0) {
                changes.images = { action: 'added', count: addImages.length };
            }
            if (Array.isArray(removeImageUrls) && removeImageUrls.length > 0) {
                changes.images = { action: 'removed', count: removeImageUrls.length };
            }
            if (typeof mainImageUrl === 'string' && mainImageUrl && mainImageUrl !== product.mainImageUrl) {
                changes.mainImage = { action: 'updated' };
            }
            
            if (Object.keys(changes).length > 0) {
                const changeDescriptions = Object.keys(changes).map(key => {
                    const change = changes[key];
                    if (change.action) {
                        return `${key} ${change.action}`;
                    } else if (change.from !== undefined && change.to !== undefined) {
                        return `${key}: ${change.from} → ${change.to}`;
                    }
                    return key;
                });
                
                await createActivityLog({
                    productId: updated._id,
                    productName: updated.name,
                    action: 'updated',
                    details: `Product updated: ${changeDescriptions.join(', ')}`,
                    adminId: req.user.id,
                    adminName: req.user.name,
                    changes: changes
                });
            }
        } catch (logError) {
            console.error('Error logging product update:', logError);
            // Don't fail the product update if logging fails
        }

        // Send notification to admins about product update
        try {
            const notificationChanges = {};
            
            // Check for changes in key fields for notifications
            if (typeof name === 'string' && name.trim() && name.trim() !== originalValues.name) {
                notificationChanges.name = { from: originalValues.name, to: name.trim() };
            }
            if (typeof category === 'string' && category.trim() && category.trim() !== originalValues.category) {
                notificationChanges.category = { from: originalValues.category, to: category.trim() };
            }
            if (typeof basePricePerKg === 'number' && basePricePerKg !== originalValues.basePricePerKg) {
                notificationChanges.basePricePerKg = { from: originalValues.basePricePerKg, to: basePricePerKg };
            }
            if (typeof description === 'string' && description !== originalValues.description) {
                notificationChanges.description = 'updated';
            }
            if (typeof isFeatured === 'boolean' && isFeatured !== originalValues.isFeatured) {
                notificationChanges.isFeatured = { from: originalValues.isFeatured, to: isFeatured };
            }
            if (status && status !== originalValues.status) {
                notificationChanges.status = { from: originalValues.status, to: status };
            }
            
            if (Object.keys(notificationChanges).length > 0) {
                await notificationService.sendProductUpdatedNotification(updated, notificationChanges);
            }
        } catch (notificationError) {
            console.error('Error sending product updated notification:', notificationError);
            // Don't fail the product update if notification fails
        }

        res.json({ product: updated });
    } catch (error) {
        console.log("Error in updateProduct controller", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateProductQuantity = async (req, res) => {
    try {
        const {productId, quantity} = req.body;
        
        if (quantity < 0) {
            return res.status(400).json({message: "Quantity cannot be negative"});
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        const oldQuantity = product.quantity;
        product.quantity = quantity;
        const updatedProduct = await product.save();

        // Check for low stock alert
        try {
            if (quantity <= 10 && oldQuantity > 10) {
                const result = await notificationService.sendLowStockAlert(updatedProduct, quantity, 10);
            }
        } catch (notificationError) {
            console.error('❌ Error sending low stock notification:', notificationError);
            // Don't fail the quantity update if notification fails
        }

        // Update featured products cache since quantity changed
        await updateFeaturedProductsCache();
        
        res.json({product: updatedProduct, message: "Quantity updated successfully"});
    } catch (error) {
        console.log("Error in updateProductQuantity controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const addProductQuantity = async (req, res) => {
    try {
        const {productId, quantityToAdd} = req.body;
        
        if (quantityToAdd < 0) {
            return res.status(400).json({message: "Quantity to add cannot be negative"});
        }
        
        if (!Number.isInteger(quantityToAdd)) {
            return res.status(400).json({message: "Quantity must be a whole number (no decimals)"});
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        const oldQuantity = product.quantity;
        product.quantity += quantityToAdd;
        const updatedProduct = await product.save();

        // Log the stock in activity
        try {
            await createActivityLog({
                productId: updatedProduct._id,
                productName: updatedProduct.name,
                action: 'stock_in',
                details: `Stock increased by ${quantityToAdd} units`,
                adminId: req.user.id,
                adminName: req.user.name,
                changes: {
                    quantity: { from: oldQuantity, to: updatedProduct.quantity }
                },
                quantityChange: quantityToAdd,
                oldQuantity: oldQuantity,
                newQuantity: updatedProduct.quantity
            });
        } catch (logError) {
            console.error('Error logging stock in activity:', logError);
            // Don't fail the quantity update if logging fails
        }

        // Check for low stock alert
        try {
            if (updatedProduct.quantity <= 10 && oldQuantity > 10) {
                await notificationService.sendLowStockAlert(updatedProduct, updatedProduct.quantity, 10);
            }
        } catch (notificationError) {
            console.error('Error sending low stock notification:', notificationError);
            // Don't fail the quantity update if notification fails
        }

        // Update featured products cache since quantity changed
        await updateFeaturedProductsCache();
        
        res.json({product: updatedProduct, message: "Quantity added successfully"});
    } catch (error) {
        console.log("Error in addProductQuantity controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

export const removeProductQuantity = async (req, res) => {
    try {
        const {productId, quantityToRemove, reason} = req.body;
        
        if (quantityToRemove < 0) {
            return res.status(400).json({message: "Quantity to remove cannot be negative"});
        }
        
        if (!Number.isInteger(quantityToRemove)) {
            return res.status(400).json({message: "Quantity must be a whole number (no decimals)"});
        }

        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({message: "Product not found"});
        }

        if (product.quantity < quantityToRemove) {
            return res.status(400).json({message: "Cannot remove more quantity than available"});
        }

        const oldQuantity = product.quantity;
        product.quantity -= quantityToRemove;
        const updatedProduct = await product.save();

        // Log the stock out activity
        try {
            await createActivityLog({
                productId: updatedProduct._id,
                productName: updatedProduct.name,
                action: 'stock_out',
                details: `Stock decreased by ${quantityToRemove} units${reason ? ` (Reason: ${reason})` : ''}`,
                adminId: req.user.id,
                adminName: req.user.name,
                changes: {
                    quantity: { from: oldQuantity, to: updatedProduct.quantity }
                },
                quantityChange: -quantityToRemove,
                oldQuantity: oldQuantity,
                newQuantity: updatedProduct.quantity,
                reason: reason
            });
        } catch (logError) {
            console.error('Error logging stock out activity:', logError);
            // Don't fail the quantity update if logging fails
        }

        // Log the stock removal with reason

        // Check for low stock alert
        try {
            if (updatedProduct.quantity <= 10 && oldQuantity > 10) {
                await notificationService.sendLowStockAlert(updatedProduct, updatedProduct.quantity, 10);
            }
        } catch (notificationError) {
            console.error('Error sending low stock notification:', notificationError);
            // Don't fail the quantity update if notification fails
        }

        const message = reason 
            ? `Quantity removed successfully (Reason: ${reason})`
            : "Quantity removed successfully";

        // Update featured products cache since quantity changed
        await updateFeaturedProductsCache();
        
        res.json({product: updatedProduct, message});
    } catch (error) {
        console.log("Error in removeProductQuantity controller", error.message);
        res.status(500).json({message: "Server error", error: error.message});
    }
};

async function updateFeaturedProductsCache() {
    try {
        const hybrid = await buildHybridFeaturedProducts();
        await redis.set("featuredProducts", JSON.stringify(hybrid));
    } catch (error) {
        console.log("❌ Error in updateFeaturedProductsCache:", error);
    }
};

export const clearFeaturedProductsCache = async (req, res) => {
    try {
        await redis.del("featuredProducts");
        res.json({ message: "Featured products cache cleared successfully" });
    } catch (error) {
        console.log("Error clearing featured products cache:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

async function buildHybridFeaturedProducts() {
    // Goal: Return up to 8 products. Start with manual isFeatured=true first (highest priority),
    // then auto-fill by cycling criteria: recently added, lowest stock, priciest. Skip trending for now.
    const MAX_FEATURED = 8;

    // Manual featured first (sorted by most recently created)
    const manualFeatured = await Product.find({ isFeatured: true, status: PRODUCT_STATUSES.AVAILABLE })
        .sort({ createdAt: -1 });

    const result = [];
    const usedIds = new Set();

    for (const p of manualFeatured) {
        if (result.length >= MAX_FEATURED) break;
        result.push(p.toJSON());
        usedIds.add(String(p._id));
    }

    if (result.length >= MAX_FEATURED) {
        return result.slice(0, MAX_FEATURED);
    }

    // If we need to auto-fill, prepare candidate pools excluding already used ids
    const excludeIds = manualFeatured.map(p => p._id);

    const baseFilter = { _id: { $nin: excludeIds }, status: PRODUCT_STATUSES.AVAILABLE };
    const [recentlyAdded, lowestStock, priciest] = await Promise.all([
        Product.find(baseFilter).sort({ createdAt: -1 }),
        Product.find(baseFilter).sort({ totalStockUnits: 1, createdAt: -1 }),
        Product.find(baseFilter).sort({ priceMin: -1, createdAt: -1 }),
    ]);

    const pools = [recentlyAdded, lowestStock, priciest /* trending (skip for now) */];
    const poolIndices = [0, 0, 0];

    let poolCursor = 0; // 0: recent, 1: lowest stock, 2: priciest, 3 would be trending (skipped)
    let safety = 0;

    while (result.length < MAX_FEATURED && safety < 100) {
        safety++;

        // Cycle: 0 -> 1 -> 2 -> 3 (skip) -> 0 -> ...
        if (poolCursor === 3) {
            // trending placeholder – skip adding for now
            poolCursor = 0;
            continue;
        }

        const pool = pools[poolCursor];
        if (!pool || pool.length === 0) {
            poolCursor = (poolCursor + 1) % 4; // include the skipped 3
            continue;
        }

        // Advance to next unused item in the current pool
        let idx = poolIndices[poolCursor];
        while (idx < pool.length && usedIds.has(String(pool[idx]._id))) {
            idx++;
        }
        poolIndices[poolCursor] = idx;

        if (idx < pool.length) {
            const candidate = pool[idx];
            if (!usedIds.has(String(candidate._id))) {
                result.push(candidate.toJSON());
                usedIds.add(String(candidate._id));
            }
            poolIndices[poolCursor] = idx + 1;
        }

        // Move to next criterion (including placeholder trending step)
        poolCursor = (poolCursor + 1) % 4;

        // Stop if we've exhausted all pools
        const noMoreCandidates = pools.every((p, i) => {
            if (!p || p.length === 0) return true;
            let j = poolIndices[i];
            while (j < p.length && usedIds.has(String(p[j]._id))) j++;
            return j >= p.length;
        });
        if (noMoreCandidates) break;
    }

    
    return result;
}

// ==================== WEIGHT-BASED ADMIN ENDPOINTS ====================

export const addWeightOption = async (req, res) => {
    try {
        const { id } = req.params;
        let { weightKg, stockUnits } = req.body || {};

        if (typeof weightKg !== 'number' || weightKg <= 0) {
            return res.status(400).json({ message: "weightKg must be a positive number" });
        }
        if (!Number.isFinite(weightKg)) {
            return res.status(400).json({ message: "weightKg must be finite" });
        }
        // normalize to 2 decimals
        weightKg = Math.round(weightKg * 100) / 100;

        if (typeof stockUnits !== 'number' || !Number.isInteger(stockUnits) || stockUnits < 0) {
            return res.status(400).json({ message: "stockUnits must be an integer >= 0" });
        }

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });

        product.weightOptions = Array.isArray(product.weightOptions) ? product.weightOptions : [];
        product.weightOptions.push({ weightKg, stockUnits });
        const updated = await product.save();

        // Invalidate featured cache if needed
        try { await redis.del("featuredProducts"); } catch {}

        res.json({ product: updated });
    } catch (error) {
        console.log("Error in addWeightOption:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateWeightOption = async (req, res) => {
    try {
        const { id, weightOptionId } = req.params;
        const { weightKg, stockUnits } = req.body || {};

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const opt = product.weightOptions?.id(weightOptionId);
        if (!opt) return res.status(404).json({ message: "Weight option not found" });

        if (typeof weightKg !== 'undefined') {
            if (typeof weightKg !== 'number' || weightKg <= 0 || !Number.isFinite(weightKg)) {
                return res.status(400).json({ message: "weightKg must be a positive finite number" });
            }
            opt.weightKg = Math.round(weightKg * 100) / 100;
        }
        if (typeof stockUnits !== 'undefined') {
            if (typeof stockUnits !== 'number' || !Number.isInteger(stockUnits) || stockUnits < 0) {
                return res.status(400).json({ message: "stockUnits must be an integer >= 0" });
            }
            // Store old stock before updating
            const oldStock = opt.stockUnits;
            opt.stockUnits = stockUnits;
            
            const updated = await product.save();
            try { await redis.del("featuredProducts"); } catch {}
            
            // Log the activity if stock was updated
            try {
                const newStock = stockUnits;
                const stockChange = newStock - oldStock;
                
                if (stockChange > 0) {
                    // Stock in
                    await createActivityLog({
                        productId: updated._id,
                        productName: updated.name,
                        action: 'stock_in',
                        details: `Stock increased by ${stockChange} units for ${opt.weightKg}kg option`,
                        adminId: req.user.id,
                        adminName: req.user.name,
                        changes: {
                            stockUnits: { from: oldStock, to: newStock },
                            weightKg: opt.weightKg
                        },
                        quantityChange: stockChange,
                        oldQuantity: oldStock,
                        newQuantity: newStock
                    });
                } else if (stockChange < 0) {
                    // Stock out
                    await createActivityLog({
                        productId: updated._id,
                        productName: updated.name,
                        action: 'stock_out',
                        details: `Stock decreased by ${Math.abs(stockChange)} units for ${opt.weightKg}kg option`,
                        adminId: req.user.id,
                        adminName: req.user.name,
                        changes: {
                            stockUnits: { from: oldStock, to: newStock },
                            weightKg: opt.weightKg
                        },
                        quantityChange: stockChange,
                        oldQuantity: oldStock,
                        newQuantity: newStock
                    });
                }
            } catch (logError) {
                console.error('Error logging weight option stock update:', logError);
                // Don't fail the update if logging fails
            }
            
            res.json({ product: updated });
        } else {
            // No stock update, just save and return
            const updated = await product.save();
            try { await redis.del("featuredProducts"); } catch {}
            res.json({ product: updated });
        }
    } catch (error) {
        console.log("Error in updateWeightOption:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const deleteWeightOption = async (req, res) => {
    try {
        const { id, weightOptionId } = req.params;
        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        const opt = product.weightOptions?.id(weightOptionId);
        if (!opt) return res.status(404).json({ message: "Weight option not found" });

        opt.deleteOne();
        const updated = await product.save();
        try { await redis.del("featuredProducts"); } catch {}
        res.json({ product: updated });
    } catch (error) {
        console.log("Error in deleteWeightOption:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

export const updateBasePricePerKg = async (req, res) => {
    try {
        const { id } = req.params;
        const { basePricePerKg } = req.body || {};
        if (typeof basePricePerKg !== 'number' || basePricePerKg < 0 || !Number.isFinite(basePricePerKg)) {
            return res.status(400).json({ message: "basePricePerKg must be a finite number >= 0" });
        }

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "Product not found" });
        
        // Store original price for change detection
        const originalPrice = product.basePricePerKg;
        product.basePricePerKg = basePricePerKg;
        const updated = await product.save();
        try { await redis.del("featuredProducts"); } catch {}
        
        // Log the activity if price was actually changed
        if (originalPrice !== basePricePerKg) {
            try {
                await createActivityLog({
                    productId: updated._id,
                    productName: updated.name,
                    action: 'updated',
                    details: `Base price per kilogram updated from ₱${originalPrice} to ₱${basePricePerKg}`,
                    adminId: req.user.id,
                    adminName: req.user.name,
                    changes: {
                        basePricePerKg: { from: originalPrice, to: basePricePerKg }
                    }
                });
            } catch (logError) {
                console.error('Error logging base price update:', logError);
                // Don't fail the price update if logging fails
            }
        }
        
        res.json({ product: updated });
    } catch (error) {
        console.log("Error in updateBasePricePerKg:", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};