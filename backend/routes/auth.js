const express = require("express");
const router = express.Router();
const { requireAuth, getAuth } = require("@clerk/express");
const User = require("../models/User");
const logger = require("../utils/logger");
const authController = require("../controllers/authController");

// Verify token and get user info
router.post("/verify", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    let user = await User.findOne({ clerkId: auth.userId });

    // Create user if doesn't exist
    if (!user) {
      user = new User({
        clerkId: auth.userId,
        email: auth.sessionClaims?.email,
        firstName: auth.sessionClaims?.given_name,
        lastName: auth.sessionClaims?.family_name,
        avatar: auth.sessionClaims?.picture,
      });
      await user.save();
      logger.info(`New user created: ${auth.userId}`);
    }

    res.json({
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        preferences: user.preferences,
        subscription: user.subscription,
      },
      valid: true,
    });
  } catch (error) {
    logger.error("Auth verify error:", error);
    next(error);
  }
});

// Refresh user data from Clerk
router.post("/refresh", async (req, res, next) => {
  try {
    const auth = getAuth(req);

    if (!auth.userId) {
      return res.status(401).json({
        error: "Unauthorized",
        message: "Authentication required",
      });
    }

    const user = await User.findOneAndUpdate(
      { clerkId: auth.userId },
      {
        email: auth.sessionClaims?.email,
        firstName: auth.sessionClaims?.given_name,
        lastName: auth.sessionClaims?.family_name,
        avatar: auth.sessionClaims?.picture,
        "usage.lastActive": new Date(),
      },
      { new: true, upsert: true }
    );

    res.json({
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        preferences: user.preferences,
        subscription: user.subscription,
      },
    });
  } catch (error) {
    logger.error("Auth refresh error:", error);
    next(error);
  }
});

// Health check endpoint (no auth required)
router.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "Auth service is running",
    timestamp: new Date().toISOString(),
  });
});

// Get current user info (requires auth)
router.get("/me", requireAuth(), authController.getCurrentUser);

// Logout endpoint
router.post("/logout", requireAuth(), authController.logout);

// Verify token endpoint (requires auth)
router.get("/verify", requireAuth(), authController.verifyToken);

// Test endpoint to verify auth is working
router.get("/test", requireAuth(), authController.testAuth);

// Session info endpoint
router.get("/session", requireAuth(), authController.getSessionInfo);

// Token validation endpoint
router.post("/validate", requireAuth(), authController.validateToken);

module.exports = router;
