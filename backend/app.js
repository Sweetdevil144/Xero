const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const mongoose = require("mongoose");
const path = require("path");
const { clerkMiddleware } = require("@clerk/express");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const chatRoutes = require("./routes/chat");
const fileRoutes = require("./routes/files");
const userRoutes = require("./routes/users");
const healthRoutes = require("./routes/health");

const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();

// Database connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("MongoDB connection error:", error);
    process.exit(1);
  });

app.use(clerkMiddleware());

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://unpkg.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
        fontSrc: ["'self'", "https:", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
  })
);

// CORS configuration
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

morgan.token("method-colored", (req) => {
  const method = req.method;
  switch (method) {
    case "GET":
      return `\x1b[32m${method}\x1b[0m`;
    case "POST":
      return `\x1b[33m${method}\x1b[0m`;
    case "PUT":
      return `\x1b[34m${method}\x1b[0m`;
    case "DELETE":
      return `\x1b[31m${method}\x1b[0m`;
    default:
      return `\x1b[37m${method}\x1b[0m`;
  }
});

morgan.token("status-colored", (req, res) => {
  const status = res.statusCode;
  if (status >= 500) return `\x1b[31m${status}\x1b[0m`;
  if (status >= 400) return `\x1b[33m${status}\x1b[0m`;
  if (status >= 300) return `\x1b[36m${status}\x1b[0m`;
  if (status >= 200) return `\x1b[32m${status}\x1b[0m`;
  return `\x1b[37m${status}\x1b[0m`;
});

morgan.token("time-short", () => {
  const now = new Date();
  return now.toTimeString().split(" ")[0];
});

if (process.env.NODE_ENV !== "production") {
  app.use(
    morgan(":time-short :method-colored :url :status-colored :response-time ms")
  );
} else {
  app.use(morgan("combined"));
}

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.get("/docs", (req, res) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.sendFile(path.join(__dirname, "swagger-ui.html"));
});

app.get("/swagger.yaml", (req, res) => {
  res.set({
    "Cache-Control": "no-cache, no-store, must-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    "Content-Type": "application/x-yaml",
  });
  res.sendFile(path.join(__dirname, "swagger.yaml"));
});

// Health check (no auth required)
app.use("/api/health", healthRoutes);

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/files", fileRoutes);
app.use("/api/users", userRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "Xero API",
    version: "1.0.0",
    status: "running",
    documentation: "/docs",
    endpoints: {
      auth: "/api/auth",
      chat: "/api/chat",
      files: "/api/files",
      users: "/api/users",
      health: "/api/health",
    },
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Route not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Graceful shutdown
process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  logger.info("Shutting down gracefully...");
  await mongoose.connection.close();
  process.exit(0);
});

module.exports = app;
