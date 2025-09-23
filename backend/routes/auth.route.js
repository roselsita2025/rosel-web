import express from 'express';
import { login, logout, signup, verifyEmail, forgotPassword, resetPassword, checkAuth, updateProfile, verifyLoginOtp, resendLoginOtp, changePassword, changeEmail, getSocketToken } from '../controllers/auth.controller.js';
import { verifyCaptcha } from '../middleware/verifyCaptcha.js';
import { verifyToken } from '../middleware/verifyToken.js';

const router = express.Router();

router.get("/check-auth", verifyToken, checkAuth);
router.get("/socket-token", verifyToken, getSocketToken);
router.post("/signup", verifyCaptcha, signup);
router.post("/login", verifyCaptcha, login);
router.post("/logout", logout);
router.post("/login/verify-otp", verifyLoginOtp);
router.post("/login/resend-otp", resendLoginOtp);

router.post("/verify-email", verifyEmail);
router.post("/forgot-password", forgotPassword);

router.post("/reset-password/:token", resetPassword);

router.patch("/update-profile", verifyToken, updateProfile);
router.patch("/change-password", verifyToken, changePassword);
router.patch("/change-email", verifyToken, changeEmail);

export default router;