import express from "express";
import { executePistonWithRetry } from "../utils/piston.js";
import { validateLanguage, validateCode, sanitizeString } from "../utils/validation.js";
import express from "express";
import { executePistonWithRetry } from "../utils/piston.js";
import { validateLanguage, validateCode, sanitizeString } from "../utils/validation.js";

const router = express.Router();

// RUN CODE
router.post("/", async (req, res) => {
  try {
    const { language, code, input } = req.body;

    // Validation
    if (!language || !code) {
      return res.status(400).json({
        output: "❌ Language and code are required"
      });
    }

    // Validate language
    if (!validateLanguage(language)) {
      return res.status(400).json({
        output: `❌ Unsupported language: ${language}. Supported: javascript, python, cpp, html, css`
      });
    }

    // Validate code length
    if (!validateCode(code)) {
      return res.status(400).json({
        output: "❌ Code is empty or exceeds maximum length (100KB)"
      });
    }

    // Sanitize input
    const sanitizedInput = input ? sanitizeString(input) : "";

    console.log(`🏃 Running ${language} code (${code.length} bytes)`);

    // JavaScript runs in browser (should not reach here usually)
    if (language === "javascript") {
      try {
        let logs = [];
        const oldLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));
        
        // Execute in try-catch to prevent infinite loops
        new Function(code)();
        
        console.log = oldLog;
        return res.json({
          output: logs.join("\n") || "✅ Executed successfully!"
        });
      } catch (err) {
        return res.json({
          output: `❌ JavaScript Error:\n${err.message}`
        });
      }
    }

    // HTML/CSS preview (should not reach here usually)
    if (language === "html" || language === "css") {
      return res.json({
        output: "✅ HTML/CSS should be previewed in browser"
      });
    }

    // Python and C++ use Piston
    const versions = {
      python: "3.10.0",
      cpp: "10.2.0",
    };

    const payload = {
      language,
      version: versions[language],
      files: [{ content: code }],
      stdin: sanitizedInput,
    };

    const data = await executePistonWithRetry(payload, 3);

    const stdout = data.run?.stdout || "";
    const stderr = data.run?.stderr || "";
    const output = stdout || stderr || "✅ Executed successfully (no output)";

    console.log(`📤 Output: ${output.length} characters`);
    res.json({ output });

  } catch (err) {
    console.error("❌ Execution error:", err.message);
    res.status(500).json({
      output: `❌ Execution failed: ${err.message}\n\nPlease check your code and try again.`
    });
  }
});

export default router;
