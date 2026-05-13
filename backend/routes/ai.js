import express from "express";
import { queryOpenAIAPI } from "../utils/openaiAPI.js";

const router = express.Router();

// AI ENDPOINT
router.post("/", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || query.trim() === "") {
      return res.json({ answer: "❌ Please ask a question!" });
    }

    console.log("🤖 AI Query received:", query.substring(0, 100));

    const apiKeyRaw = process.env.GROQ_API_KEY;
    const apiKey = apiKeyRaw?.trim();

    if (!apiKey) {
      console.error("⚠️ GROQ_API_KEY is missing or empty in backend environment.");
      return res.status(500).json({
        answer: "❌ Groq API key missing. Please add GROQ_API_KEY to backend/.env."
      });
    }

    if (apiKeyRaw !== apiKey) {
      console.warn("⚠️ GROQ_API_KEY has leading/trailing whitespace; trimming before use.");
    }

    try {
      const answer = await queryOpenAIAPI(query, apiKey);
      return res.json({ answer });
    } catch (openAIError) {
      console.error("⚠️ OpenAI API failed:", openAIError.message);
      return res.status(500).json({
        answer: `❌ OpenAI error: ${openAIError.message}`
      });
    }

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.status(500).json({
      answer: "❌ An error occurred while processing your request. Please try again."
    });
  }
});

export default router;
