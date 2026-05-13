import express from "express";
import { execSync } from "child_process";
import { executePistonWithRetry } from "../utils/piston.js";
import { validateLanguage, validateCode, sanitizeString } from "../utils/validation.js";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const WANDBOX_URL = process.env.WANDBOX_URL || "https://wandbox.org/api/compile.json";
// By default, do not delay user response waiting for Wandbox retries.
// If you want retries, set WANDBOX_MAX_RETRIES > 0 in the environment.
const WANDBOX_MAX_RETRIES = Number(process.env.WANDBOX_MAX_RETRIES || 0);
const WANDBOX_RETRY_DELAY_MS = Number(process.env.WANDBOX_RETRY_DELAY_MS || 5000);

async function executeViaWandbox(code, input) {
  // If code was sent with literal "\\n" sequences (common when JSON is double-escaped),
  // convert them back into real newlines so Wandbox compiles correctly.
  let codeForWandbox = code;
  if (!code.includes("\n") && code.includes("\\n")) {
    codeForWandbox = codeForWandbox.replace(/\\r\\n/g, "\n").replace(/\\n/g, "\n");
  }

  let attempt = 0;
  let lastErr;

  while (attempt <= WANDBOX_MAX_RETRIES) {
    try {
      const response = await fetch(WANDBOX_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          compiler: "gcc-head",
          code: codeForWandbox,
          options: "-Wall -Wextra -O2",
          stdin: input || "",
          save: false,
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();

      if (data.program_output) return data.program_output;
      if (data.compiler_error) throw new Error(data.compiler_error);
      if (data.stderr) throw new Error(data.stderr);

      return "✅ Executed successfully (no output)";
    } catch (err) {
      lastErr = err;
      attempt += 1;
      console.warn(`⚠️ Wandbox attempt ${attempt} failed: ${err.message}`);

      if (attempt <= WANDBOX_MAX_RETRIES) {
        console.log(`ℹ️ Retrying Wandbox in ${WANDBOX_RETRY_DELAY_MS / 1000}s (attempt ${attempt + 1}/${WANDBOX_MAX_RETRIES + 1})...`);
        await new Promise((r) => setTimeout(r, WANDBOX_RETRY_DELAY_MS));
      }
    }
  }

  console.error("❌ Wandbox error (all retries failed):", lastErr?.message);
  throw lastErr;
}

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

    // Python and C++ use Piston (with local Python fallback)
    const versions = {
      python: "3.10.0",
      cpp: "10.2.0",
    };

    // Local Python execution
    if (language === "python") {
      try {
        const tempDir = os.tmpdir();
        const tempFile = path.join(tempDir, `devstudio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.py`);
        
        fs.writeFileSync(tempFile, code, 'utf-8');
        
        try {
          const output = execSync(`python "${tempFile}"`, {
            input: sanitizedInput,
            encoding: 'utf-8',
            maxBuffer: 10 * 1024 * 1024,
            timeout: 30000,
            stdio: ['pipe', 'pipe', 'pipe']
          });
          
          fs.unlinkSync(tempFile);
          console.log(`📤 Local Python Output: ${(output || "").length} characters`);
          return res.json({ output: output || "✅ Executed successfully (no output)" });
        } catch (execError) {
          try { fs.unlinkSync(tempFile); } catch (e) {}
          console.error("❌ Python execution error:", execError.message);
          return res.status(500).json({
            output: `❌ Python Error:\n${execError.stderr || execError.message}`
          });
        }
      } catch (err) {
        console.error("❌ Python setup error:", err.message);
        return res.status(500).json({
          output: `❌ Execution failed: ${err.message}`
        });
      }
    }

    // C++ Execution - Prefer Piston (fast, stable); fallback to Wandbox if Piston fails.
    if (language === "cpp") {
      try {
        // Prefer Piston because it is reliable and avoids local toolchain issues.
        const payload = {
          language: "cpp",
          version: versions.cpp,
          files: [{ content: code }],
          stdin: sanitizedInput,
        };

        const data = await executePistonWithRetry(payload, 2);
        const stdout = data.run?.stdout || "";
        const stderr = data.run?.stderr || "";
        const output = stdout || stderr || "✅ Executed successfully (no output)";

        console.log(`📤 Piston C++ Output: ${output.length} characters`);
        return res.json({ output, compiler: "Piston (online)" });
      } catch (pistonErr) {
        console.warn("⚠️ Piston failed, falling back to Wandbox:", pistonErr.message);

        try {
          const output = await executeViaWandbox(code, sanitizedInput);
          console.log(`📤 Wandbox C++ Output: ${(output || "").length} characters`);
          return res.json({
            output: output || "✅ Executed successfully (no output)",
            compiler: "Wandbox (online)"
          });
        } catch (wandboxErr) {
          console.error("❌ Wandbox C++ failed:", wandboxErr.message);
          return res.status(500).json({
            output: `❌ C++ Execution failed: ${wandboxErr.message}\n\nPlease check your code and try again.`
          });
        }
      }
    }

    // Fallback to Piston for other languages
    try {
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

      console.log(`📤 Piston Output: ${output.length} characters`);
      res.json({ output });
    } catch (pistonErr) {
      console.error("❌ Piston API failed:", pistonErr.message);
      res.status(500).json({
        output: `❌ Execution failed: ${pistonErr.message}\n\nPlease check your code and try again.`
      });
    }

  } catch (err) {
    console.error("❌ Execution error:", err.message);
    res.status(500).json({
      output: `❌ Execution failed: ${err.message}\n\nPlease check your code and try again.`
    });
  }
});

export default router;
