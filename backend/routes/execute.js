import express from "express";
import { execSync } from "child_process";
import { executePistonWithRetry } from "../utils/piston.js";
import { validateLanguage, validateCode, sanitizeString } from "../utils/validation.js";
import { executeViaWandbox } from "../utils/wandbox.js";
import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const isVercel = process.env.VERCEL === "1";
const forceOnlineExecution = process.env.CODE_EXECUTION_MODE === "online";
const shouldUseOnlineExecution = isVercel || forceOnlineExecution;
const WANDBOX_CPP_COMPILER = process.env.WANDBOX_CPP_COMPILER || "gcc-head";
const WANDBOX_PYTHON_COMPILER = process.env.WANDBOX_PYTHON_COMPILER || "cpython-3.10.15";
const WANDBOX_JS_COMPILER = process.env.WANDBOX_JS_COMPILER || "nodejs-20.17.0";


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

    // Run JavaScript in a hosted sandbox. Do not execute untrusted JS in the
    // backend process; it can read env vars or hang the serverless function.
    if (language === "javascript") {
      try {
        const output = await executeViaWandbox({
          compiler: WANDBOX_JS_COMPILER,
          code,
          input: sanitizedInput,
        });

        return res.json({
          output,
          compiler: `Wandbox (${WANDBOX_JS_COMPILER})`,
        });
      } catch (err) {
        console.error("❌ Wandbox JavaScript failed:", err.message);
        return res.status(502).json({
          output: `❌ JavaScript execution service failed: ${err.message}\n\nUse a dedicated code execution service if this needs stronger reliability.`
        });
      }
    }

    // HTML/CSS preview (should not reach here usually)
    if (language === "html" || language === "css") {
      return res.json({
        output: "✅ HTML/CSS should be previewed in browser"
      });
    }

    // Python and C++ use hosted execution in Vercel. Serverless runtimes do not
    // provide system compilers/interpreters like python, g++, etc.
    const versions = {
      cpp: "10.2.0",
    };

    // Python execution
    if (language === "python") {
      if (shouldUseOnlineExecution) {
        try {
          const output = await executeViaWandbox({
            compiler: WANDBOX_PYTHON_COMPILER,
            code,
            input: sanitizedInput,
          });

          console.log(`📤 Wandbox Python Output: ${(output || "").length} characters`);
          return res.json({
            output,
            compiler: `Wandbox (${WANDBOX_PYTHON_COMPILER})`,
          });
        } catch (wandboxErr) {
          console.error("❌ Wandbox Python failed:", wandboxErr.message);
          return res.status(502).json({
            output: `❌ Python execution service failed: ${wandboxErr.message}\n\nVercel cannot run local Python. Configure WANDBOX_PYTHON_COMPILER or use a dedicated code execution service.`
          });
        }
      }

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
          const output = await executeViaWandbox({
            compiler: WANDBOX_CPP_COMPILER,
            code,
            input: sanitizedInput,
            options: "-Wall -Wextra -O2",
          });
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
