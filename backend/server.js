import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors({ origin: "*", methods: ["GET", "POST"] }));
app.use(bodyParser.json());

// Test endpoints
app.get("/", (req, res) => res.send("✅ Backend is working!"));
app.get("/test", (req, res) => {
  res.json({ 
    status: "ok",
    message: "Server is running correctly"
  });
});

// Simple local fallback responder for when external AI is unavailable
function generateLocalAnswer(query) {
  const q = (query || "").toLowerCase();
  if (!q) return "I couldn't see a question — please ask something about your code.";
  
  // Code generation examples
  if (q.includes('example') || q.includes('code for') || q.includes('how to')) {
    if (q.includes('python')) {
      if (q.includes('list') || q.includes('array'))
        return 'Here\'s a Python list example:\n```python\n# Create and manipulate a list\nnumbers = [1, 2, 3, 4, 5]\nprint(f"List: {numbers}")\n\n# Add elements\nnumbers.append(6)\n\n# List comprehension\nsquares = [x**2 for x in numbers]\nprint(f"Squares: {squares}")\n```';
      if (q.includes('function'))
        return 'Here\'s a Python function example:\n```python\ndef calculate_average(numbers):\n    """Calculate the average of a list of numbers"""\n    if not numbers:\n        return 0\n    return sum(numbers) / len(numbers)\n\n# Example usage\nscores = [85, 92, 78, 90, 88]\navg = calculate_average(scores)\nprint(f"Average score: {avg}")\n```';
    }
    if (q.includes('javascript')) {
      if (q.includes('array') || q.includes('loop'))
        return 'Here\'s a JavaScript array example:\n```javascript\n// Create and manipulate an array\nconst numbers = [1, 2, 3, 4, 5];\nconsole.log("Array:", numbers);\n\n// Map and filter\nconst doubled = numbers.map(n => n * 2);\nconst evenNumbers = numbers.filter(n => n % 2 === 0);\n\nconsole.log("Doubled:", doubled);\nconsole.log("Even numbers:", evenNumbers);\n```';
    }
  }

  // Language-specific help
  if (q.includes('python')) 
    return 'For Python help:\n```python\n# Common patterns:\n\n# 1. Reading input\nuser_input = input("Enter something: ")\n\n# 2. Error handling\ntry:\n    result = some_function()\nexcept Exception as e:\n    print(f"Error: {e}")\n\n# 3. File handling\nwith open("file.txt", "r") as f:\n    content = f.read()\n```';
  
  if (q.includes('javascript'))
    return 'For JavaScript help:\n```javascript\n// Common patterns:\n\n// 1. Async/await\nasync function getData() {\n  try {\n    const response = await fetch(url);\n    const data = await response.json();\n    return data;\n  } catch (error) {\n    console.error("Error:", error);\n  }\n}\n\n// 2. Event handling\nbutton.addEventListener("click", () => {\n  console.log("Button clicked!");\n});\n```';

  // Generic coding tips with examples
  return "Here are some coding tips:\n\n1. Use clear variable names:\n```javascript\n// Good\nconst userAge = 25;\nconst isLoggedIn = true;\n\n// Avoid\nconst a = 25;\nconst flag = true;\n```\n\n2. Add comments for complex logic:\n```javascript\n// Calculate user discount based on membership level\nconst discount = calculateDiscount(user.level);\n```";
}

// ---------- RUN CODE ----------
app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;
  console.log(`Executing ${language} code:`, { code: code.slice(0, 100) + '...', hasInput: !!input });

  try {
    if (language === "javascript") {
      try {
        let logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));
        new Function(code)();
        console.log = originalLog;
        return res.json({ output: logs.join("\n") || "✅ Executed successfully!" });
      } catch (err) {
        return res.json({ output: "❌ JS Error: " + err.message });
      }
    }

    const expectsInput =
      (language === "python" && code.includes("input(")) ||
      (language === "cpp" && code.includes("cin"));

    if (expectsInput && !input) {
      return res.json({ output: "🔸 This program needs input.", needsInput: true });
    }

    const langMap = {
      python: { name: "python", version: "3.9.4" },  // Using a more stable version
      cpp: { name: "cpp", version: "9.3.0" },     // Using a more widely supported version
    };

    console.log('Sending code execution request for', language);
    const response = await fetch("https://emkc.org/api/v2/piston/execute", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: langMap[language].name,
        version: langMap[language].version,
        files: [{ content: code }],
        stdin: input || "",
      }),
    });

    if (!response.ok) {
      console.error('Code execution failed with status:', response.status);
      throw new Error(`Execution service returned ${response.status}`);
    }

    const data = await response.json();
    console.log('Execution response:', data);

    if (data.run && data.run.stderr) {
      // There was an error in the code execution
      return res.json({ output: `❌ Error: ${data.run.stderr}` });
    }

    const result = data?.run?.output || "⚠️ No output";
    res.json({ output: result });
  } catch (error) {
    console.error('Code execution error:', error);
    res.status(500).json({ 
      output: "❌ Code execution failed. Please try again. If the problem persists, check your code for syntax errors.",
      error: error.message 
    });
  }
});

// ---------- AI FEATURE ----------
import fs from 'fs/promises';
import path from 'path';

const CHAT_HISTORY_FILE = './chatHistory.json';

// Load chat history
async function loadChatHistory() {
  try {
    const data = await fs.readFile(CHAT_HISTORY_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return { history: [] };
  }
}

// Save chat history
async function saveChatHistory(history) {
  await fs.writeFile(CHAT_HISTORY_FILE, JSON.stringify({ history }, null, 2));
}

// Get chat history endpoint
app.get("/ai/history", async (req, res) => {
  try {
    const chatHistory = await loadChatHistory();
    res.json(chatHistory);
  } catch (error) {
    console.error("Failed to load chat history:", error);
    res.status(500).json({ error: "Failed to load chat history" });
  }
});

app.post("/ai", async (req, res) => {
  try {
    console.log("Received AI request:", req.body);

    const { query } = req.body;
    if (!query) {
      console.log("No query provided");
      return res.status(400).json({ answer: "Please ask a question!" });
    }

    // Using free alternative model from Hugging Face
    console.log("Making request to AI API...");
    const response = await fetch(
      "https://api-inference.huggingface.co/models/bigcode/starcoder",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Using free model without auth
        },
        body: JSON.stringify({
          inputs: `You are an expert coding assistant. Always provide practical code examples when asked. Format code blocks with \`\`\` markers and language name. Focus on writing clean, working code with comments.

If the user asks for code or examples:
1. Provide complete, runnable code snippets
2. Include helpful comments
3. Show example usage
4. Explain key parts briefly

User: ${query}
Assistant:`,
          parameters: {
            max_new_tokens: 1000,
            temperature: 0.7,
            top_p: 0.95,
            do_sample: true
          }
        })
      }
    );

    console.log("AI API response status:", response.status);
    const data = await response.json();
    console.log("AI API response:", data);

    // If external API failed, use local fallback instead of throwing a 500
    if (!response.ok || response.status === 401) {
      console.log('Using local fallback due to API issues');
      const fallback = generateLocalAnswer(query);
      return res.json({ answer: fallback });
    }

    // Extract the response from the model
    let answer = data[0]?.generated_text || "";

    // Clean up the response
    answer = answer
      .replace(/<\|assistant\|>/g, "")
      .replace(/<\|system\|>/g, "")
      .replace(/<\|user\|>/g, "")
      .trim();

    if (!answer) {
      console.error('External AI returned empty response');
      const fallback = generateLocalAnswer(query);
      return res.json({ answer: `${fallback} (fallback: external AI returned no text)` });
    }

    console.log("Sending successful response");
    return res.json({ answer });
  } catch (err) {
    console.error("AI request failed:", err);
    // On error, return a helpful local fallback so frontend doesn't get a 500
    const fallback = generateLocalAnswer(req.body?.query);
    return res.json({ answer: `${fallback} (fallback: error contacting external AI)` });
  }
});

// ---------- SHARE FEATURE ----------
app.post("/share", (req, res) => {
  const { language, code } = req.body;
  const id = Math.random().toString(36).substring(2, 8);
  sharedCodes[id] = { language, code };
  res.json({ shareId: id });
});

app.get("/share/:id", (req, res) => {
  const code = sharedCodes[req.params.id];
  if (code) res.json(code);
  else res.status(404).json({ error: "Not found" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Node backend running on http://localhost:${PORT}`));