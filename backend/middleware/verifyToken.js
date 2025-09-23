import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.token;
  console.log("🔍 verifyToken middleware called, has token:", !!token);
  
  if (!token) {
    console.log("❌ No token provided");
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - no token provided" });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("✅ Token verified, userId:", decoded.userId);
    
    if (!decoded || !decoded.userId) {
      console.log("❌ Invalid token structure");
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized - invalid token" });
    }

    // Fetch full user document from DB
    const user = await User.findById(decoded.userId).populate("cartItems.product");
    if (!user) {
      console.log("❌ User not found in database");
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    console.log("✅ User authenticated:", user.name, "Role:", user.role);

    // Attach user to request
    req.user = user;       // full Mongoose doc
    req.userId = user._id; // shortcut if only the ID is needed

    next();
  } catch (error) {
    console.error("❌ Error in verifyToken:", error);
    return res
      .status(401)
      .json({ success: false, message: "Unauthorized - token error" });
  }
};

export const verifyAdmin = async (req, res, next) => {
  try {
    // req.user is already a full doc (from verifyToken)
    const user = req.user || (await User.findById(req.userId));
    if (user && user.role === "admin") {
      return next();
    }
    return res
      .status(403)
      .json({ success: false, message: "Unauthorized - admin role required" });
  } catch (error) {
    console.error("Error in verifyAdmin:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server error" });
  }
};
