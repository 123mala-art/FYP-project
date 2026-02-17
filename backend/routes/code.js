import express from "express";
import { User } from "../models/User.js";
import { authMiddleware } from "../utils/auth.js";
import { validateLanguage, validateCode } from "../utils/validation.js";

const router = express.Router();

// SAVE CODE
router.post("/save", authMiddleware, async (req, res) => {
  try {
    const { language, code } = req.body;

    // Validation
    if (!language || !code) {
      return res.status(400).json({
        success: false,
        message: "Language and code are required"
      });
    }

    // Validate language
    if (!validateLanguage(language)) {
      return res.status(400).json({
        success: false,
        message: `Invalid language: ${language}`
      });
    }

    // Validate code length
    if (!validateCode(code)) {
      return res.status(400).json({
        success: false,
        message: "Code is empty or exceeds maximum length"
      });
    }

    // Save to database
    const result = await User.findByIdAndUpdate(
      req.userId,
      {
        $push: {
          history: {
            language,
            code,
            savedAt: new Date()
          }
        }
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    console.log(`✅ Code saved for user: ${req.userId}`);
    res.json({
      success: true,
      message: "Code saved successfully"
    });

  } catch (err) {
    console.error("❌ Save code error:", err);
    res.status(500).json({
      success: false,
      message: "Failed to save code"
    });
  }
});

// GET CODE HISTORY
router.get("/history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("history")
      .exec();

    if (!user) {
      return res.status(404).json({
        history: [],
        message: "User not found"
      });
    }

    // Limit to last 50 saved codes
    const history = (user.history || []).slice(-50);

    console.log(`✅ Retrieved ${history.length} saved codes for user: ${req.userId}`);
    res.json({ history });

  } catch (err) {
    console.error("❌ Load history error:", err);
    res.status(500).json({
      history: [],
      message: "Failed to load history"
    });
  }
});

export default router;
