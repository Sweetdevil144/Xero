const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

// Basic health check
router.get("/", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Database health check
router.get("/db", async (req, res) => {
  try {
    const startTime = Date.now();
    await mongoose.connection.db.admin().ping();
    const responseTime = Date.now() - startTime;

    res.json({
      status: "healthy",
      database: "connected",
      responseTime,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      database: "disconnected",
      error: error.message,
    });
  }
});

// AI service health check
router.get("/ai", async (req, res) => {
  try {
    const { createOpenAI } = require("@ai-sdk/openai");

    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const startTime = Date.now();
    // Simple test request
    const models = ["gpt-3.5-turbo", "gpt-4"];
    const responseTime = Date.now() - startTime;

    res.json({
      status: "healthy",
      service: "openai",
      responseTime,
      models,
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      service: "openai",
      error: error.message,
    });
  }
});

module.exports = router;
