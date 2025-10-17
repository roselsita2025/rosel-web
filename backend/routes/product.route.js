import express from 'express';
import { createProduct, deleteProduct, getAllProducts, getAllProductsForCustomers, getFeaturedProducts, getProductsByCategory, getRecommendedProducts, toggleFeaturedProduct, getProductById, updateProductQuantity, addProductQuantity, removeProductQuantity, searchProducts, suggestProducts, updateProduct, getProductByBarcode, clearFeaturedProductsCache, getProductsBatch, addWeightOption, updateWeightOption, deleteWeightOption, updateBasePricePerKg } from '../controllers/product.controller.js';
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
    res.json({ categories: ["pork", "beef", "chicken", "sliced", "processed", "seafood"] });
});
router.get("/barcode/:barcode", verifyToken, verifyAdmin, getProductByBarcode);
router.get("/batch", getProductsBatch);
router.get("/:id", getProductById);
router.post("/", verifyToken, verifyAdmin, createProduct);
router.put("/:id", verifyToken, verifyAdmin, updateProduct);
router.patch("/:id", verifyToken, verifyAdmin, toggleFeaturedProduct);
router.delete("/:id", verifyToken, verifyAdmin, deleteProduct);
router.put("/quantity/update", verifyToken, verifyAdmin, updateProductQuantity);
router.put("/quantity/add", verifyToken, verifyAdmin, addProductQuantity);
router.put("/quantity/remove", verifyToken, verifyAdmin, removeProductQuantity);
router.delete("/cache/featured", verifyToken, verifyAdmin, clearFeaturedProductsCache);

router.post("/:id/weights", verifyToken, verifyAdmin, addWeightOption);
router.patch("/:id/weights/:weightOptionId", verifyToken, verifyAdmin, updateWeightOption);
router.delete("/:id/weights/:weightOptionId", verifyToken, verifyAdmin, deleteWeightOption);
router.patch("/:id/base-price", verifyToken, verifyAdmin, updateBasePricePerKg);

export default router;