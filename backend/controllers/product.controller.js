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
        let cached = await redis.get("featuredProducts");
        if (cached) {
            return res.json(JSON.parse(cached));
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
        const {name, description, price, image, images = [], category, quantity, barcode} = req.body;

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
            price,
            image: mainImageUrl, // keep legacy field for compatibility
            images: uploadedUrls,
            mainImageUrl,
            category,
            quantity: quantity || 0,
            status: PRODUCT_STATUSES.AVAILABLE,
            barcode: typeof barcode === 'string' && barcode.trim() ? barcode.trim() : undefined,
        });

        // Log the activity
        try {
            await createActivityLog({
                productId: product._id,
                productName: product.name,
                action: 'created',
                details: `Product created with initial stock of ${product.quantity} units`,
                adminId: req.user.id,
                adminName: req.user.name,
                changes: {
                    price: product.price,
                    quantity: product.quantity,
                    status: product.status,
                    category: product.category
                },
                quantityChange: product.quantity,
                newQuantity: product.quantity
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
        // Aggregate top 6 selling products based on total ordered quantity and only available products
        // Exclude cancelled and refunded orders from recommendations
        const topSelling = await Order.aggregate([
            // Filter out cancelled and refunded orders
            { $match: { 
                status: { $nin: ['cancelled', 'refunded'] },
                paymentStatus: 'paid' // Only include paid orders
            }},
            { $unwind: "$products" },
            { $group: { _id: "$products.product", totalQuantity: { $sum: "$products.quantity" } } },
            { $sort: { totalQuantity: -1 } },
            { $limit: 6 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "product"
                }
            },
            { $unwind: "$product" },
            { $match: { "product.status": PRODUCT_STATUSES.AVAILABLE } },
            {
                $project: {
                    _id: "$product._id",
                    name: "$product.name",
                    description: "$product.description",
                    image: { $ifNull: ["$product.mainImageUrl", "$product.image"] },
                    price: "$product.price",
                    quantity: "$product.quantity",
                    sales: "$totalQuantity"
                }
            }
        ]);
        res.json({ products: topSelling });
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

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Enforce immutability for name, category, barcode
        const { name, category, barcode } = req.body;
        if (name && name !== product.name) {
            return res.status(400).json({ message: "Product name cannot be changed" });
        }
        if (category && category !== product.category) {
            return res.status(400).json({ message: "Category cannot be changed" });
        }
        if (typeof barcode === 'string' && barcode.trim() && barcode.trim() !== (product.barcode || '')) {
            return res.status(400).json({ message: "Barcode cannot be changed" });
        }

        // Updatable fields
        const { price, description, status, isFeatured, addImages = [], removeImageUrls = [], mainImageUrl } = req.body;

        if (typeof price === 'number') product.price = price;
        if (typeof description === 'string') product.description = description;
        if (typeof isFeatured === 'boolean') product.isFeatured = isFeatured;

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
        if (typeof isFeatured === 'boolean') {
            await updateFeaturedProductsCache();
        }

        // Log the activity if there were changes
        try {
            const changes = {};
            if (typeof price === 'number' && price !== product.price) changes.price = { from: product.price, to: price };
            if (typeof description === 'string' && description !== product.description) changes.description = 'updated';
            if (typeof isFeatured === 'boolean' && isFeatured !== product.isFeatured) changes.isFeatured = { from: product.isFeatured, to: isFeatured };
            if (status && status !== product.status) changes.status = { from: product.status, to: status };
            
            if (Object.keys(changes).length > 0) {
                await createActivityLog({
                    productId: updated._id,
                    productName: updated.name,
                    action: 'updated',
                    details: `Product updated: ${Object.keys(changes).join(', ')}`,
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
            const changes = {};
            if (typeof price === 'number' && price !== product.price) changes.price = { from: product.price, to: price };
            if (typeof description === 'string' && description !== product.description) changes.description = 'updated';
            if (typeof isFeatured === 'boolean' && isFeatured !== product.isFeatured) changes.isFeatured = { from: product.isFeatured, to: isFeatured };
            if (status && status !== product.status) changes.status = { from: product.status, to: status };
            
            if (Object.keys(changes).length > 0) {
                await notificationService.sendProductUpdatedNotification(updated, changes);
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
            console.log(`🔍 Checking low stock: quantity=${quantity}, oldQuantity=${oldQuantity}`);
            if (quantity <= 10 && oldQuantity > 10) {
                console.log(`🚨 Triggering low stock alert for product: ${updatedProduct.name}`);
                const result = await notificationService.sendLowStockAlert(updatedProduct, quantity, 10);
                console.log('✅ Low stock notification sent:', result);
            }
        } catch (notificationError) {
            console.error('❌ Error sending low stock notification:', notificationError);
            // Don't fail the quantity update if notification fails
        }

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
        console.log(`Stock removed: Product "${product.name}" - Quantity: ${quantityToRemove}, Reason: ${reason || 'Not specified'}, Old: ${oldQuantity}, New: ${updatedProduct.quantity}`);

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
        console.log("error in updateFeaturedProductsCache", error);
    }
};

async function buildHybridFeaturedProducts() {
    // Goal: Return up to 8 products. Start with manual isFeatured=true first (highest priority),
    // then auto-fill by cycling criteria: recently added, lowest stock, priciest. Skip trending for now.
    const MAX_FEATURED = 8;

    // Manual featured first (sorted by most recently created)
    const manualFeatured = await Product.find({ isFeatured: true, status: PRODUCT_STATUSES.AVAILABLE })
        .sort({ createdAt: -1 })
        .lean();

    const result = [];
    const usedIds = new Set();

    for (const p of manualFeatured) {
        if (result.length >= MAX_FEATURED) break;
        result.push(p);
        usedIds.add(String(p._id));
    }

    if (result.length >= MAX_FEATURED) {
        return result.slice(0, MAX_FEATURED);
    }

    // If we need to auto-fill, prepare candidate pools excluding already used ids
    const excludeIds = manualFeatured.map(p => p._id);

    const baseFilter = { _id: { $nin: excludeIds }, status: PRODUCT_STATUSES.AVAILABLE };
    const [recentlyAdded, lowestStock, priciest] = await Promise.all([
        Product.find(baseFilter).sort({ createdAt: -1 }).lean(),
        Product.find(baseFilter).sort({ quantity: 1, createdAt: -1 }).lean(),
        Product.find(baseFilter).sort({ price: -1, createdAt: -1 }).lean(),
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
                result.push(candidate);
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