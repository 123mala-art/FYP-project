import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });
console.log("DEBUG: Loaded backend .env from", envPath);

// Import modular routes
import authRoutes from "./routes/auth.js";
import codeRoutes from "./routes/code.js";
import aiRoutes from "./routes/ai.js";
import executeRoutes from "./routes/execute.js";
import shareRoutes from "./routes/share.js";

dotenv.config();

// Quick startup debug to ensure Node prints at process start
console.log("DEBUG: server.js starting");

const app = express();

// -------------------------
// MIDDLEWARE
// -------------------------
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://127.0.0.1:3000',
      'https://smart-code-editor-ivp3.vercel.app',
      /\.vercel\.app$/  // Allow all vercel apps
    ],
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
app.use("/ai", aiRoutes);
app.use("/execute", executeRoutes);
app.use("/run", executeRoutes);  // Also available as /run for backward compatibility
app.use("/share", shareRoutes);

// -------------------------
// STATUS ROUTES
// -------------------------
app.get("/", (req, res) => res.send("✅ DevStudio Backend is running (Modular)!"));

app.get("/health", async (req, res) => {
  const mongoState = mongoose.connection.readyState;
  res.json({ 
    ok: true, 
    mongoState,
    architecture: "modular",
    timestamp: new Date().toISOString()
  });
});


app.get("/netinfo", (req, res) => {
  const ip = getLanIp();
  res.json({ ip });
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
// compute LAN ip for logging
function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return null;
}

const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log("============================================================");
  console.log("🚀 DevStudio Backend Server (MODULAR ARCHITECTURE)");
  console.log("============================================================");
  console.log(`📍 Server listening on: http://${HOST}:${PORT}`);
  const lan = getLanIp();
  if (lan) console.log(`📡 LAN IP: http://${lan}:${PORT}`);
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
