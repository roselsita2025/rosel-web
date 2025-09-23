import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getAllProductsForCustomers, getFeaturedProducts, getProductsByCategory, getRecommendedProducts, toggleFeaturedProduct, getProductById, updateProductQuantity, addProductQuantity, removeProductQuantity, searchProducts, suggestProducts, updateProduct, getProductByBarcode } from '../controllers/product.controller.js';
import { verifyAdmin, verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/", verifyToken, verifyAdmin, getAllProducts);
router.get("/all", getAllProductsForCustomers);
router.get("/featured", getFeaturedProducts);
router.get("/search", searchProducts);
router.get("/suggest", suggestProducts);
router.get("/category/:category", getProductsByCategory);
router.get("/recommendations", getRecommendedProducts);
router.get("/categories", (req, res) => {
    // static categories for frontend; no auth required
    res.json({ categories: ["pork", "beef", "chicken", "sliced", "processed", "ground"] });
});
router.get("/barcode/:barcode", verifyToken, verifyAdmin, getProductByBarcode);
router.get("/:id", getProductById);
router.post("/", verifyToken, verifyAdmin, createProduct);
router.put("/:id", verifyToken, verifyAdmin, updateProduct);
router.patch("/:id", verifyToken, verifyAdmin, toggleFeaturedProduct);
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);
router.put("/quantity/update", verifyToken, verifyAdmin, updateProductQuantity);
router.put("/quantity/add", verifyToken, verifyAdmin, addProductQuantity);
router.put("/quantity/remove", verifyToken, verifyAdmin, removeProductQuantity);

export default router;