import bcryptjs from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import { generateTokenAndSetCookie } from "../utils/generateTokenAndSetCookie.js";
import { sendPasswordResetEmail, sendResetSuccessEmail, sendVerificationEmail, sendWelcomeEmail, sendLoginOtpEmail } from "../sendgrid/emails.js";
import { User } from "../models/user.model.js";
import cloudinary from "../db/cloudinary.js";
import { redis } from "../db/redis.js";

export const signup = async (req, res) => {
    const {email, password, name} = req.body;

    try {
        if (!email || !password || !name) {
            throw new Error ("All fields are required");
        }

        // Enforce strong password policy: at least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!passwordPolicyRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters and include uppercase, lowercase, number, and special character",
            });
        }

        const userAlreadyExists = await User.findOne({email});
        if(userAlreadyExists) {
            return res.status(400).json({success:false, message: "User already exists"});
        }
        
        const hashedPassword = await bcryptjs.hash(password, 10);
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000 // 24 hours  
        }); 

        await user.save();

        generateTokenAndSetCookie(res, user._id);

        await sendVerificationEmail(user.email, verificationToken);

        res.status(201).json({
            success: true, 
            message: "User created successfully",
            user: {
                ...user._doc,
                password: undefined
            },
        });

    } catch (error) {
        res.status(400).json({success: false, message: error.message});
    }
};

export const verifyEmail = async (req, res) => {
    const {code} = req.body;

    try {
        const user = await User.findOne ({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        });

        if (!user) {
            return res.status(400).json({success: false, message: "Invalid or expired verification code"});
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;
        await user.save();

        await sendWelcomeEmail(user.email, user.name);

        res.status(200).json({
            success: true, 
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined,
            }
        });
            
    } catch (error) {
        console.log("error in verifEmail", error);
        return res.status(500).json({success: false, message: "Server error"});
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = (email || "").toLowerCase();
        const failKey = `login_fail_count:${normalizedEmail}`;
        const lockKey = `login_lock:${normalizedEmail}`;

        // If locked, return remaining seconds
        const lockTtl = await redis.ttl(lockKey);
        if (lockTtl && lockTtl > 0) {
            return res.status(429).json({ success: false, message: `Too many failed login attempts. Try again in ${lockTtl} seconds.` });
        }

        const user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            // Count failed attempt for the provided email identifier
            const attempts = await redis.incr(failKey);
            if (attempts === 1) {
                await redis.expire(failKey, 600); // keep counter for 10 minutes
            }
            if (attempts >= 5) {
                await redis.set(lockKey, "1", "EX", 120); // 2 minutes lockout
                await redis.del(failKey);
                return res.status(429).json({ success: false, message: "Too many failed login attempts. Try again in 120 seconds." });
            }
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }
        const isPasswordValid = await bcryptjs.compare(password, user.password);
        if (!isPasswordValid) {
            const attempts = await redis.incr(failKey);
            if (attempts === 1) {
                await redis.expire(failKey, 600);
            }
            if (attempts >= 5) {
                await redis.set(lockKey, "1", "EX", 120);
                await redis.del(failKey);
                return res.status(429).json({ success: false, message: "Too many failed login attempts. Try again in 120 seconds." });
            }
            return res.status(400).json({ success: false, message: "Invalid credentials" });
        }

        // Reset counters on successful password validation
        await redis.del(failKey);
        await redis.del(lockKey);

        // Generate OTP and store in Redis for 10 minutes
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const redisKey = `login_otp:${user._id.toString()}`;
        await redis.set(redisKey, otpCode, "EX", 10 * 60);

        // Send OTP via email
        await sendLoginOtpEmail(user.email, otpCode);

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email",
            otpRequired: true,
            email: user.email,
        });
    } catch (error) {
        console.log("Error in login", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const verifyLoginOtp = async (req, res) => {
    const { email, code } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        const redisKey = `login_otp:${user._id.toString()}`;
        const storedCode = await redis.get(redisKey);
        if (!storedCode) {
            return res.status(400).json({ success: false, message: "OTP expired or not found" });
        }
        if (storedCode !== code) {
            return res.status(400).json({ success: false, message: "Invalid OTP code" });
        }

        await redis.del(redisKey);

        generateTokenAndSetCookie(res, user._id);
        user.lastLogin = new Date();
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Logged in successfully",
            user: {
                ...user._doc,
                password: undefined,
            },
        });
    } catch (error) {
        console.log("Error in verifyLoginOtp ", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const resendLoginOtp = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid request" });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const redisKey = `login_otp:${user._id.toString()}`;
        await redis.set(redisKey, otpCode, "EX", 10 * 60);
        await sendLoginOtpEmail(user.email, otpCode);

        return res.status(200).json({ success: true, message: "OTP resent" });
    } catch (error) {
        console.log("Error in resendLoginOtp ", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const logout = async (req, res) => {
    res.clearCookie("token");
    res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        const resetToken = crypto.randomBytes(20).toString("hex");
        const resetPasswordExpiresAt = Date.now() + 1 * 60 * 60 * 1000; // 1 hr

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpiresAt = resetPasswordExpiresAt;

        await user.save();

        await sendPasswordResetEmail(user.email, `${process.env.CLIENT_URL}/reset-password/${resetToken}`);

        res.status(200).json({ success: true, message: "Password reset link sent to your email" });
    } catch (error) {
        console.log("Error in forgotPassword ", error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req, res) => {
    try {
        const {token} = req.params;
        const {password} = req.body;

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpiresAt: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired Token"});
        }

        const hashedPassword = await bcryptjs.hash(password, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpiresAt = undefined;
        await user.save();

        await sendResetSuccessEmail(user.email);

        res.status(200).json({success: true, message: "Password reset successful"});
    } catch (error) {
        console.log("Error in resetPassword ", error);
        res.status(400).json({ success: false, message: error.message});
    }
};

export const checkAuth = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        res.status(200).json({ success: true, user: {
            ...user._doc,
            password: undefined,
        }});
    } catch (error) {
        console.log("Error in checkAuth ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getSocketToken = async (req, res) => {
    try {
        console.log("🔐 getSocketToken called for userId:", req.userId);
        
        const user = await User.findById(req.userId);
        if (!user) {
            console.log("❌ User not found for userId:", req.userId);
            return res.status(400).json({ success: false, message: "User not found" });
        }

        console.log("✅ User found:", user.name, "Role:", user.role);

        // Generate a temporary token for WebSocket authentication
        const socketToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h", // Short-lived token for security
        });

        console.log("🎫 Socket token generated successfully");

        res.status(200).json({
            success: true,
            token: socketToken,
            user: {
                ...user._doc,
                password: undefined,
            }
        });
    } catch (error) {
        console.log("❌ Error in getSocketToken:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const { name, phone, address, image, avatarUrl } = req.body;

        if (name !== undefined) user.name = name;
        if (phone !== undefined) user.phone = phone;
        if (address !== undefined) {
            user.address = {
                street: address.street || "",
                barangay: address.barangay || "",
                city: address.city || "",
                province: address.province || "",
                postalCode: address.postalCode || "",
                country: address.country || "",
            };
        }

        // If a new base64 image was sent, upload to Cloudinary like product flow
        if (image) {
            const upload = await cloudinary.uploader.upload(image, { folder: "users" });
            user.profileImage = upload.secure_url;
        } else if (avatarUrl) {
            // Keep previously stored URL if provided
            user.profileImage = avatarUrl;
        }

        const updated = await user.save();

        res.status(200).json({
            success: true,
            user: {
                ...updated._doc,
                password: undefined,
            }
        });
    } catch (error) {
        console.log("Error in updateProfile ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "Current password and new password are required" 
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Current password is incorrect" 
            });
        }

        // Enforce strong password policy: at least 6 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        const passwordPolicyRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{6,}$/;
        if (!passwordPolicyRegex.test(newPassword)) {
            return res.status(400).json({
                success: false,
                message: "New password must be at least 6 characters and include uppercase, lowercase, number, and special character",
            });
        }

        // Hash new password
        const hashedNewPassword = await bcryptjs.hash(newPassword, 10);
        user.password = hashedNewPassword;
        await user.save();

        res.status(200).json({
            success: true,
            message: "Password changed successfully"
        });
    } catch (error) {
        console.log("Error in changePassword ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

export const changeEmail = async (req, res) => {
    try {
        const { newEmail, currentPassword } = req.body;

        if (!newEmail || !currentPassword) {
            return res.status(400).json({ 
                success: false, 
                message: "New email and current password are required" 
            });
        }

        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Verify current password
        const isCurrentPasswordValid = await bcryptjs.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            return res.status(400).json({ 
                success: false, 
                message: "Current password is incorrect" 
            });
        }

        // Check if new email is already in use
        const emailExists = await User.findOne({ email: newEmail.toLowerCase() });
        if (emailExists) {
            return res.status(400).json({ 
                success: false, 
                message: "Email is already in use" 
            });
        }

        // Generate verification token for new email
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
        user.email = newEmail.toLowerCase();
        user.isVerified = false; // User needs to verify new email
        user.verificationToken = verificationToken;
        user.verificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

        await user.save();

        // Send verification email to new email address
        await sendVerificationEmail(user.email, verificationToken);

        res.status(200).json({
            success: true,
            message: "Email changed successfully. Please check your new email for verification.",
            user: {
                ...user._doc,
                password: undefined,
            }
        });
    } catch (error) {
        console.log("Error in changeEmail ", error);
        res.status(400).json({ success: false, message: error.message });
    }
};