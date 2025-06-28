const express = require("express");
const router = express.Router();
const { requireAuth, getAuth } = require("@clerk/express");
const User = require("../models/User");
const aiService = require("../services/aiService");
const logger = require("../utils/logger");

// All user routes require authentication
router.use(requireAuth());

// Get user profile
router.get("/profile", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const user = await User.findOne({ clerkId: auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences,
      subscription: user.subscription,
      usage: user.usage,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    logger.error("Get profile error:", error);
    next(error);
  }
});

// Update user profile
router.put("/profile", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const { preferences } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: auth.userId },
      {
        preferences: {
          ...preferences,
        },
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      preferences: user.preferences,
      subscription: user.subscription,
    });
  } catch (error) {
    logger.error("Update profile error:", error);
    next(error);
  }
});

// Get user usage statistics
router.get("/usage", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const user = await User.findOne({ clerkId: auth.userId });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      usage: user.usage,
      subscription: user.subscription,
    });
  } catch (error) {
    logger.error("Get usage error:", error);
    next(error);
  }
});

// Update user preferences
router.put("/preferences", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const { theme, language, notifications, aiModel } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: auth.userId },
      {
        $set: {
          "preferences.theme": theme,
          "preferences.language": language,
          "preferences.notifications": notifications,
          "preferences.defaultAiModel": aiModel,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      preferences: user.preferences,
      message: "Preferences updated successfully",
    });
  } catch (error) {
    logger.error("Update preferences error:", error);
    next(error);
  }
});

// Get user memories
router.get("/memories", async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const limit = parseInt(req.query.limit) || 10;

    const memories = await aiService.getUserMemories(auth.userId, limit);

    res.json({
      memories,
      total: memories.length,
    });
  } catch (error) {
    logger.error("Get memories error:", error);
    next(error);
  }
});

// Delete user memories
router.delete("/memories", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    const success = await aiService.deleteUserMemories(auth.userId);

    if (success) {
      res.json({ message: "All memories deleted successfully" });
    } else {
      res.status(500).json({ error: "Failed to delete memories" });
    }
  } catch (error) {
    logger.error("Delete memories error:", error);
    next(error);
  }
});

module.exports = router;
