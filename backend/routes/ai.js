import express from "express";
import { queryGroqAPI, generateSmartFallback } from "../utils/groqAPI.js";

const router = express.Router();

// AI ENDPOINT
router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.json({ answer: "❌ Please ask a question!" });
    }

    console.log("🤖 AI Query received:", query.substring(0, 100));

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.log("⚠️ Using fallback response (API key not configured)");
      const fallback = generateSmartFallback(query);
      return res.json({ answer: fallback });
    }

    try {
      const answer = await queryGroqAPI(query, apiKey);
      return res.json({ answer });
    } catch (groqError) {
      console.error("⚠️ Groq API failed, using fallback:", groqError.message);
      const fallback = generateSmartFallback(query);
      return res.json({ answer: fallback });
    }

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(500).json({
      answer: "❌ An error occurred while processing your request. Please try again."
    });
  }
});

export default router;
