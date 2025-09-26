import express from 'express';
import dotenv from 'dotenv';
import cors from "cors";
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './db/connectDB.js';
import { seedFAQs } from './utils/seedFAQs.js';
import { socketService } from './services/socketService.js';

import authRoutes from './routes/auth.route.js';
import productRoutes from './routes/product.route.js';
import cartRoutes from './routes/cart.route.js';
import couponRoutes from './routes/coupon.route.js';
import paymentRoutes from './routes/payment.route.js';
import analyticsRoutes from './routes/analytics.route.js';
import mapsRoutes from './routes/maps.route.js';
import webhookRoutes from './routes/webhook.route.js';
import lalamoveRoutes from './routes/lalamove.route.js';
import orderRoutes from './routes/order.route.js';
import adminRoutes from './routes/admin.route.js';
import adminOrderRoutes from './routes/adminOrder.route.js';
import replacementRequestRoutes from './routes/replacementRequest.route.js';
import chatRoutes from './routes/chat.route.js';
import notificationRoutes from './routes/notification.route.js';
import contactRoutes from './routes/contact.route.js';
import posRoutes from './routes/pos.route.js';
import activityLogRoutes from './routes/activityLog.route.js';
import reviewRoutes from './routes/reviews.js';

import './utils/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true}));

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser()); 

// Routes
app.use("/api/auth", authRoutes); 
app.use("/api/products", productRoutes);
app.use("/api/carts", cartRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/maps", mapsRoutes);
app.use("/api/webhooks", webhookRoutes);
app.use("/api/lalamove", lalamoveRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use("/api/replacement-requests", replacementRequestRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/pos", posRoutes);
app.use("/api/activity-logs", activityLogRoutes);
app.use("/api/reviews", reviewRoutes);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/dist')));

const server = app.listen(PORT, async () => {
    await connectDB();
    await seedFAQs();
    
    // Initialize WebSocket service
    socketService.initialize(server);
});

// Serve React app for all non-API routes
// This must be the last route defined
app.get('*', (req, res) => {
  // Only serve React app for non-API routes
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  } else {
    res.status(404).json({ message: 'API route not found' });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});