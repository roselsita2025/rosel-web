import mongoose from 'mongoose';
import Product from '../models/product.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rosel';

async function migrateWeightOptions() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find({ 'weightOptions.0': { $exists: true } });
        console.log(`Found ${products.length} products with weight options`);

        let updatedCount = 0;

        for (const product of products) {
            let productUpdated = false;

            if (product.weightOptions && Array.isArray(product.weightOptions)) {
                for (const opt of product.weightOptions) {
                    // Only update if createdAt is missing
                    if (!opt.createdAt || !opt.expireAt || !opt.updatedAt) {
                        if (!opt.createdAt) {
                            opt.createdAt = new Date();
                        }
                        if (!opt.updatedAt) {
                            opt.updatedAt = new Date();
                        }
                        if (!opt.expireAt) {
                            // Set expire at 1 year after createdAt
                            opt.expireAt = new Date(opt.createdAt.getTime() + 365 * 24 * 60 * 60 * 1000);
                        }
                        productUpdated = true;
                    }
                }

                if (productUpdated) {
                    await product.save();
                    updatedCount++;
                    console.log(`Updated weight options for product: ${product.name}`);
                }
            }
        }

        console.log(`Migration complete! Updated ${updatedCount} products.`);
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

migrateWeightOptions();

