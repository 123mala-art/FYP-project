import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";

// Import modular routes
import authRoutes from "./routes/auth.js";
import codeRoutes from "./routes/code.js";
import aiRoutes from "./routes/ai.js";
import executeRoutes from "./routes/execute.js";
import shareRoutes from "./routes/share.js";

dotenv.config();

const app = express();

// -------------------------
// MIDDLEWARE
// -------------------------
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());

// -------------------------
// MONGO DB CONNECTION
// -------------------------
const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devstudio";

async function connectWithRetry(retries = 5, delayMs = 2000) {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
      console.log("🔗 Connected to MongoDB");
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err.message || err);
      if (i < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  console.error("Failed to connect to MongoDB after retries.");
}

connectWithRetry();

// -------------------------
// REGISTER MODULAR ROUTES
// -------------------------
app.use("/auth", authRoutes);
app.use("/code", codeRoutes);
app.post("/ai", aiRoutes);
app.post("/run", executeRoutes);
app.use("/share", shareRoutes);
app.post("/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.json({ success: false, message: "All fields required" });

    const existing = await User.findOne({ email }).exec();
    if (existing)
      return res.json({ success: false, message: "User already exists" });

    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ name, email, passwordHash });

    res.json({ success: true, message: "Signup successful" });
  } catch (err) {
    console.error("Signup error:", err);
    res.json({ success: false, message: "Signup failed" });
  }
});

// -------------------------
// LOGIN ROUTE
// -------------------------
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password required" });
    }

    const user = await User.findOne({ email }).exec();
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || "devsecret",
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    });

    res.json({ success: true });
  } catch (err) {
    console.error("Login error:", err);
    res.json({ message: "Login failed" });
  }
});

// -------------------------
// LOGOUT ROUTE
// -------------------------
app.post("/auth/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out" });
});

// -------------------------
// GET LOGGED USER
// -------------------------
app.get("/auth/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select("name email")
      .exec();
    res.json({ user });
  } catch {
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

// -------------------------
// SAVE CODE
// -------------------------
app.post("/code/save", authMiddleware, async (req, res) => {
  try {
    const { language, code } = req.body;
    await User.findByIdAndUpdate(req.userId, {
      $push: { history: { language, code } }
    });
    res.json({ success: true });
  } catch (err) {
    console.error("Save code error:", err);
    res.status(500).json({ success: false, message: "Failed to save code" });
  }
});

// -------------------------
// LOAD CODE HISTORY
// -------------------------
app.get("/code/history", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ history: user.history || [] });
  } catch (err) {
    console.error("Load history error:", err);
    res.status(500).json({ history: [] });
  }
});

// -------------------------
// AI ENDPOINT WITH GROQ (FIXED MODELS)
// -------------------------
app.post("/ai", async (req, res) => {
  try {
    const { query } = req.body;
    
    console.log("🤖 AI Query received:", query);
    
    if (!query || query.trim() === "") {
      return res.json({ answer: "Please ask a question!" });
    }

    // Try primary model first, then fallback
    let modelToUse = GROQ_MODELS.primary;
    let attemptCount = 0;
    const maxAttempts = 2;

    while (attemptCount < maxAttempts) {
      try {
        console.log(`🔄 Attempting with model: ${modelToUse}`);
        
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: [
              {
                role: "system",
                content: "You are a helpful coding assistant specialized in Python, JavaScript, C++, HTML, and CSS. Provide clear, concise answers with code examples when relevant. Format code in markdown with proper syntax highlighting. Keep responses under 500 words."
              },
              {
                role: "user",
                content: query
              }
            ],
            temperature: 0.7,
            max_tokens: 1024,
            top_p: 1,
            stream: false
          })
        });

        if (response.ok) {
          const data = await response.json();
          const answer = data.choices?.[0]?.message?.content || "No response from AI";
          
          console.log(`✅ AI Response sent successfully using model: ${modelToUse}`);
          return res.json({ answer });
        }

        // If not OK, try to get error details
        const errorData = await response.json().catch(() => ({}));
        console.error(`❌ Groq API Error (${modelToUse}):`, response.status, errorData);

        // If model not found or deprecated, try fallback
        if (response.status === 400 && errorData.error?.message?.includes("model")) {
          console.log("⚠️ Model not available, trying fallback...");
          modelToUse = GROQ_MODELS.fallback;
          attemptCount++;
          continue;
        }

        // For other errors, return fallback response
        break;

      } catch (fetchError) {
        console.error(`❌ Fetch error with ${modelToUse}:`, fetchError.message);
        attemptCount++;
        if (attemptCount < maxAttempts) {
          modelToUse = GROQ_MODELS.fallback;
          continue;
        }
        break;
      }
    }

    // If all attempts failed, return helpful fallback
    console.log("⚠️ Using local fallback response");
    return res.json({ 
      answer: generateSmartFallback(query)
    });

  } catch (error) {
    console.error("❌ AI Error:", error.message);
    res.json({ 
      answer: generateSmartFallback(req.body.query)
    });
  }
});

// -------------------------
// SMART FALLBACK RESPONSES
// -------------------------
function generateSmartFallback(query) {
  const lowerQuery = query.toLowerCase();
  
  // Python help
  if (lowerQuery.includes("python")) {
    if (lowerQuery.includes("prime") || lowerQuery.includes("number")) {
      return `Here's a Python function to check if a number is prime:

\`\`\`python
def is_prime(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True

# Test
number = int(input("Enter a number: "))
if is_prime(number):
    print(f"{number} is prime!")
else:
    print(f"{number} is not prime")
\`\`\`

This function checks divisibility up to the square root of n for efficiency.`;
    }
    
    if (lowerQuery.includes("loop") || lowerQuery.includes("for")) {
      return `Python Loops:

**For Loop:**
\`\`\`python
# Loop through range
for i in range(5):
    print(i)

# Loop through list
fruits = ["apple", "banana", "cherry"]
for fruit in fruits:
    print(fruit)
\`\`\`

**While Loop:**
\`\`\`python
count = 0
while count < 5:
    print(count)
    count += 1
\`\`\`

**List Comprehension:**
\`\`\`python
squares = [x**2 for x in range(10)]
\`\`\``;
    }
    
    if (lowerQuery.includes("function")) {
      return `Python Functions:

\`\`\`python
# Basic function
def greet(name):
    return f"Hello, {name}!"

# Function with default parameter
def power(base, exponent=2):
    return base ** exponent

# Function with multiple returns
def divide(a, b):
    if b == 0:
        return None, "Cannot divide by zero"
    return a / b, None

# Lambda function
square = lambda x: x ** 2
\`\`\``;
    }
  }
  
  // JavaScript help
  if (lowerQuery.includes("javascript") || lowerQuery.includes("js")) {
    if (lowerQuery.includes("array")) {
      return `JavaScript Array Methods:

\`\`\`javascript
let arr = [1, 2, 3, 4, 5];

// Map - transform elements
let doubled = arr.map(x => x * 2);

// Filter - select elements
let evens = arr.filter(x => x % 2 === 0);

// Reduce - aggregate
let sum = arr.reduce((acc, x) => acc + x, 0);

// Find - get first match
let found = arr.find(x => x > 3);

// ForEach - iterate
arr.forEach(x => console.log(x));
\`\`\``;
    }
    
    if (lowerQuery.includes("function")) {
      return `JavaScript Functions:

\`\`\`javascript
// Function declaration
function greet(name) {
    return \`Hello \${name}!\`;
}

// Arrow function
const square = (x) => x * x;

// Function with default params
const power = (base, exp = 2) => base ** exp;

// Async function
async function fetchData() {
    const response = await fetch(url);
    return await response.json();
}
\`\`\``;
    }
  }
  
  // C++ help
  if (lowerQuery.includes("c++") || lowerQuery.includes("cpp")) {
    if (lowerQuery.includes("vector") || lowerQuery.includes("array")) {
      return `C++ Vectors:

\`\`\`cpp
#include <iostream>
#include <vector>
using namespace std;

int main() {
    // Create vector
    vector<int> nums = {1, 2, 3, 4, 5};
    
    // Add elements
    nums.push_back(6);
    
    // Access elements
    cout << nums[0] << endl;
    
    // Iterate
    for(int num : nums) {
        cout << num << " ";
    }
    
    // Size
    cout << "Size: " << nums.size();
    
    return 0;
}
\`\`\``;
    }
    
    if (lowerQuery.includes("pointer")) {
      return `C++ Pointers:

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int x = 10;
    int* ptr = &x;  // Pointer to x
    
    cout << "Value: " << x << endl;
    cout << "Address: " << &x << endl;
    cout << "Pointer: " << ptr << endl;
    cout << "Dereferenced: " << *ptr << endl;
    
    // Change value through pointer
    *ptr = 20;
    cout << "New value: " << x << endl;
    
    return 0;
}
\`\`\``;
    }
  }
  
  // General help
  if (lowerQuery.includes("help")) {
    return `I can help you with:

📝 **Code Examples:**
- "Write a Python function to reverse a string"
- "Show me JavaScript array methods"
- "C++ class example"

🐛 **Debugging:**
- "Why am I getting [error]?"
- "How to fix [problem]?"

💡 **Concepts:**
- "Explain [topic] in [language]"
- "Difference between [A] and [B]"

🔄 **Conversion:**
- "Convert this Python code to C++"

Just ask specific questions!`;
  }
  
  // Default response
  return `I'd love to help! I'm currently in fallback mode, but I can still assist with:

🐍 Python - loops, functions, data structures
💻 JavaScript - arrays, functions, async/await  
⚡ C++ - pointers, classes, STL
🎨 HTML/CSS - layouts, styling

Try asking:
- "How do I use loops in Python?"
- "Show me JavaScript array methods"
- "C++ pointer example"
- "HTML form example"

Or be specific: "Write a function to [your task]"`;
}

// -------------------------
// RUN CODE WITH PISTON API
// -------------------------
async function executePistonWithRetry(payload, maxRetries = 3) {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🚀 Piston attempt ${attempt}/${maxRetries}...`);
      const response = await fetch(
        "https://emkc.org/api/v2/piston/execute",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Piston success");
      return data;
    } catch (err) {
      lastError = err;
      console.warn(`⚠️ Piston attempt ${attempt} failed: ${err.message}`);
      
      if (attempt < maxRetries) {
        const delay = 1000 * Math.pow(2, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

app.post("/run", async (req, res) => {
  const { language, code, input } = req.body;

  console.log(`🏃 Running ${language} code...`);
  console.log(`📝 Code length: ${code?.length}`);
  console.log(`📥 Input provided: ${input ? 'Yes' : 'No'}`);

  try {
    // JavaScript runs in browser
    if (language === "javascript") {
      try {
        let logs = [];
        const oldLog = console.log;
        console.log = (...args) => logs.push(args.join(" "));
        new Function(code)();
        console.log = oldLog;
        return res.json({ output: logs.join("\n") || "✅ Executed successfully!" });
      } catch (err) {
        return res.json({ output: "❌ Error: " + err.message });
      }
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
      stdin: input || "",
    };

    const data = await executePistonWithRetry(payload, 3);
    
    const stdout = data.run?.stdout || "";
    const stderr = data.run?.stderr || "";
    const output = stdout || stderr || "✅ Executed successfully (no output)";
    
    console.log(`📤 Output: ${output.substring(0, 100)}...`);
    res.json({ output });

  } catch (err) {
    console.error("❌ Execution error:", err.message);
    res.json({ 
      output: `❌ Execution failed: ${err.message}\n\nPlease check your code and try again.` 
    });
  }
});

// -------------------------
// SHARE CODE
// -------------------------
const sharedCodes = {};

app.post("/share", (req, res) => {
  const { language, code } = req.body;
  const id = Math.random().toString(36).substring(2, 8);
  sharedCodes[id] = { language, code };
  console.log(`📤 Code shared: ${id}`);
  res.json({ shareId: id });
});

app.get("/share/:id", (req, res) => {
  const code = sharedCodes[req.params.id];
  if (!code) return res.status(404).json({ error: "Not found" });
  res.json(code);
});

// -------------------------
// STATUS ROUTES
// -------------------------
app.get("/", (req, res) => res.send("✅ DevStudio Backend is running!"));

app.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ 
    ok: true, 
    mongoState,
    groqEnabled: !!GROQ_API_KEY,
    groqModel: GROQ_MODELS.primary,
    timestamp: new Date().toISOString()
  });
});

app.get("/db/status", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      status: "Connected",
      dbName: mongoose.connection.name,
      userCount: userCount
    });
  } catch (err) {
    res.status(500).json({ 
      status: "Disconnected", 
      error: err.message 
    });
  }
});

// -------------------------
// START SERVER
// -------------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("============================================================");
  console.log("🚀 DevStudio Backend Server");
  console.log("============================================================");
  console.log(`📍 Server: http://localhost:${PORT}`);
  console.log(`🤖 Groq AI: ${GROQ_API_KEY ? '✅ Enabled' : '❌ Disabled'}`);
  console.log(`🎯 AI Model: ${GROQ_MODELS.primary}`);
  console.log(`🗄️  MongoDB: ${MONGO_URI}`);
  console.log("============================================================");
});

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err.stack);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("❌ Unhandled Rejection:", reason);
});
