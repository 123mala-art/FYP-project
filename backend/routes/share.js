import express from "express";

const router = express.Router();
const sharedCodes = {};

// SHARE CODE
router.post("/", (req, res) => {
  try {
    const { language, code } = req.body;

    if (!language || !code) {
      return res.status(400).json({ error: "Language and code are required" });
    }

    const id = Math.random().toString(36).substring(2, 8);
    sharedCodes[id] = { language, code, createdAt: new Date() };
    
    console.log(`📤 Code shared with ID: ${id}`);
    res.json({ shareId: id, success: true });
  } catch (err) {
    console.error("Share error:", err);
    res.status(500).json({ error: "Failed to share code: " + err.message });
  }
});

// GET SHARED CODE
router.get("/:id", (req, res) => {
  try {
    const code = sharedCodes[req.params.id];
    
    if (!code) {
      return res.status(404).json({ error: "Shared code not found" });
    }

    res.json(code);
  } catch (err) {
    console.error("Get share error:", err);
    res.status(500).json({ error: "Failed to retrieve shared code" });
  }
});

export default router;
