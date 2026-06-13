import express from "express";
import { SharedCode } from "../models/SharedCode.js";
import { requireDatabase } from "../utils/database.js";

const router = express.Router();

// SHARE CODE
router.post("/", requireDatabase(), async (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "Language and code are required" });
    }

    const shareId = Math.random().toString(36).substring(2, 8);
    
    // Save to MongoDB
    const sharedCode = new SharedCode({
      shareId,
      language,
      code,
      createdAt: new Date()
    });

    await sharedCode.save();

    // build absolute URL using request headers so host is correct even on mobile
    const origin = req.protocol + "://" + req.get("host");
    const shareUrl = `${origin}/share/${shareId}`;

    console.log(`📤 Code shared with ID: ${shareId} (saved to MongoDB)`);
    res.json({ shareId, shareUrl, success: true });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share code: " + err.message });
  }
});

// GET SHARED CODE
router.get("/:id", requireDatabase(), async (req, res) => {
  try {
    const sharedCode = await SharedCode.findOne({ shareId: req.params.id });
    
    if (!sharedCode) {
      return res.status(404).json({ error: "Shared code not found or expired" });
    }

    res.json({
      language: sharedCode.language,
      code: sharedCode.code,
      createdAt: sharedCode.createdAt
    });
  } catch (err) {
    console.error("Get share error:", err);
    res.status(500).json({ error: "Failed to retrieve shared code" });
  }
});

export default router;
