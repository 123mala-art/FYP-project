import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "./models/User.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(__dirname, ".env");
dotenv.config({ path: envPath });

// Import modular routes
import authRoutes from "./routes/auth.js";
import codeRoutes from "./routes/code.js";
import aiRoutes from "./routes/ai.js";
import executeRoutes from "./routes/execute.js";
import shareRoutes from "./routes/share.js";

const app = express();
const isVercel = process.env.VERCEL === "1";
const isProduction = process.env.NODE_ENV === "production";

// -------------------------
// MIDDLEWARE
// -------------------------
const configuredOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.CORS_ORIGINS || "").split(","),
]
  .map((origin) => origin && origin.trim())
  .filter(Boolean);

const allowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  ...configuredOrigins,
];

app.use(
  cors({
    origin(origin, callback) {
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked origin: ${origin}`));
    },
    credentials: true,
  })
);

app.use(cookieParser());
app.use(bodyParser.json());

// -------------------------
// MONGO DB CONNECTION
// -------------------------
const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI ||
  (isProduction ? "" : "mongodb://127.0.0.1:27017/devstudio");

function describeMongoUri(uri) {
  if (!uri) return "not configured";

  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.hostname}${parsed.pathname}`;
  } catch {
    return "configured";
  }
}

async function connectWithRetry(retries = 5, delayMs = 2000) {
  if (!MONGO_URI) {
    console.error("MONGO_URI is required in production.");
    return;
  }

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
const apiRouter = express.Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/code", codeRoutes);
apiRouter.use("/ai", aiRoutes);
apiRouter.use("/execute", executeRoutes);
apiRouter.use("/run", executeRoutes);  // Also available as /run for backward compatibility
apiRouter.use("/share", shareRoutes);

app.use(apiRouter);
app.use("/api", apiRouter);

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
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "Disconnected",
        mongoState: mongoose.connection.readyState,
        message: "Database unavailable. Check the backend MONGO_URI value in Vercel."
      });
    }

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

if (!isVercel) {
  app.listen(PORT, HOST, () => {
    console.log("============================================================");
    console.log("🚀 DevStudio Backend Server (MODULAR ARCHITECTURE)");
    console.log("============================================================");
    console.log(`📍 Server listening on: http://${HOST}:${PORT}`);
    const lan = getLanIp();
    if (lan) console.log(`📡 LAN IP: http://${lan}:${PORT}`);
    console.log(`🗄️  MongoDB: ${describeMongoUri(MONGO_URI)}`);
    console.log("============================================================");
  });
}

// Error handlers
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught exception:", err.stack);
});

process.on("unhandledRejection", (reason, p) => {
  console.error("❌ Unhandled Rejection:", reason);
});

export default app;
