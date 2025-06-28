const { getAuth } = require("@clerk/express");
const logger = require("../utils/logger");

class AuthController {
  async getCurrentUser(req, res, next) {
    try {
      const auth = getAuth(req);
      res.json({
        userId: auth.userId,
        sessionId: auth.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get current user error:", error);
      next(error);
    }
  }

  async logout(req, res, next) {
    try {
      const auth = getAuth(req);
      logger.info(`User ${auth.userId} logged out`);
      res.json({
        success: true,
        message: "Logout successful",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Logout error:", error);
      next(error);
    }
  }

  async verifyToken(req, res, next) {
    try {
      const auth = getAuth(req);
      res.json({
        valid: true,
        userId: auth.userId,
        sessionId: auth.sessionId,
      });
    } catch (error) {
      logger.error("Verify token error:", error);
      next(error);
    }
  }

  async testAuth(req, res, next) {
    try {
      const auth = getAuth(req);
      res.json({
        message: "Authentication successful",
        userId: auth.userId,
        sessionId: auth.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Test auth error:", error);
      next(error);
    }
  }

  async getSessionInfo(req, res, next) {
    try {
      const auth = getAuth(req);
      res.json({
        userId: auth.userId,
        sessionId: auth.sessionId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error("Get session info error:", error);
      next(error);
    }
  }

  async validateToken(req, res, next) {
    try {
      const auth = getAuth(req);
      res.json({
        valid: true,
        userId: auth.userId,
        sessionId: auth.sessionId,
        message: "Token is valid",
      });
    } catch (error) {
      logger.error("Validate token error:", error);
      next(error);
    }
  }
}

module.exports = new AuthController();
