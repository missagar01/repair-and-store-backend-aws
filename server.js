import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { initPool } from "./src/config/db.js";
import { connectRedis } from "./src/config/redisClient.js";
import redisClient from "./src/config/redisClient.js";
import routes from "./src/routes/index.js";
import { fileURLToPath } from "url";
import path from "path";
import { dirname } from "path";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middlewares
// CORS configuration - allow all origins for backend API
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes mounted under /api so frontend can call consistent base path
app.use("/api", routes);

// Serve static files from frontend build (in production)
const frontendBuildPath = path.join(__dirname, "public");

if (fs.existsSync(frontendBuildPath)) {
  // Serve static files
  app.use(express.static(frontendBuildPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get("*", (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith("/api")) {
      return res.status(404).json({
        success: false,
        message: "Route not found",
      });
    }
    res.sendFile(path.join(frontendBuildPath, "index.html"));
  });
} else {
  // Development mode - API health check
  app.get("/", (req, res) => {
    res.json({ 
      success: true, 
      message: "Unified Backend API is running 🚀",
      version: "1.0.0",
      note: "Frontend build not found. Run 'npm run build:all' to build frontend."
    });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 3004;

/**
 * Start server safely with proper database pool initialization
 */
async function startServer() {
  try {
    // Initialize Oracle pool if Oracle is configured
    if (process.env.ORACLE_USER && process.env.ORACLE_PASSWORD && process.env.ORACLE_CONNECTION_STRING) {
      console.log("⏳ Initializing Oracle pool...");
      await initPool();
      console.log("✅ Oracle pool initialized");
    } else {
      console.log("ℹ️ Oracle not configured, skipping Oracle pool initialization");
    }

    // Initialize Redis connection (non-blocking, graceful degradation)
    if (process.env.REDIS_HOST || process.env.REDIS_URL) {
      // Try to connect, but don't wait or block
      connectRedis().catch(() => {
        // Silent - error handler in redisClient will log once
      });
      // Give it a moment, but don't wait
      setTimeout(() => {
        if (redisClient.isOpen) {
          console.log("✅ Redis connection active");
        }
      }, 1000);
    } else {
      console.log("ℹ️ Redis not configured, skipping Redis initialization");
    }

    // PostgreSQL connection will be initialized on first use via config files

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Unified Backend Server running on port ${PORT}`);
      console.log(`📡 API available at http://0.0.0.0:${PORT}`);
      console.log(`🌐 Server listening on all network interfaces`);
      console.log(`📘 Swagger documentation is disabled for this deployment`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();
