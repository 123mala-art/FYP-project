import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { authMiddleware } from "../utils/auth.js";
import { validateEmail, validatePassword, validateName, sanitizeString } from "../utils/validation.js";

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required"
      });
    }

    // Sanitize inputs
    const sanitizedName = sanitizeString(name);
    const sanitizedEmail = sanitizeString(email).toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Validate name
    if (!validateName(sanitizedName)) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 100 characters"
      });
    }

    // Validate password strength
    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long"
      });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: sanitizedEmail }).exec();
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: sanitizedName,
      email: sanitizedEmail,
      passwordHash
    });

    console.log(`✅ User registered: ${sanitizedEmail}`);
    res.status(201).json({
      success: true,
      message: "Signup successful! Please login.",
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("❌ Signup error:", err);
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email already registered"
      });
    }
    res.status(500).json({
      success: false,
      message: "Signup failed. Please try again."
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required"
      });
    }

    // Sanitize email
    const sanitizedEmail = sanitizeString(email).toLowerCase();

    // Validate email format
    if (!validateEmail(sanitizedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address"
      });
    }

    // Find user
    const user = await User.findOne({ email: sanitizedEmail }).exec();
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Verify password
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    // Set secure cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    console.log(`✅ User logged in: ${sanitizedEmail}`);
    res.json({
      success: true,
      message: "Login successful!",
      token, // Send token to frontend
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again."
    });
  }
});

// LOGOUT
router.post("/logout", (req, res) => {
  try {
    res.clearCookie("token");
    res.json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (err) {
    console.error("❌ Logout error:", err);
    res.status(500).json({
      success: false,
      message: "Logout failed"
    });
  }
});

// GET CURRENT USER
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("name email createdAt")
      .exec();

    if (!user) {
      return res.status(404).json({
        error: "User not found"
      });
    }

    res.json({ user });

  } catch (err) {
    console.error("❌ Fetch user error:", err);
    res.status(500).json({
      error: "Failed to fetch user information"
    });
  }
});

export default router;
