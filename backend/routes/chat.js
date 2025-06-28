const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const chatController = require("../controllers/chatController");

// All chat routes require authentication
router.use(requireAuth());

// Get user's conversations
router.get(
  "/conversations",
  chatController.getConversations.bind(chatController)
);

// Create new conversation
router.post(
  "/conversations",
  chatController.createConversation.bind(chatController)
);

// Get conversation by ID
router.get(
  "/conversations/:id",
  chatController.getConversation.bind(chatController)
);

// Update conversation
router.put(
  "/conversations/:id",
  chatController.updateConversation.bind(chatController)
);

// Delete conversation
router.delete(
  "/conversations/:id",
  chatController.deleteConversation.bind(chatController)
);

// Get conversation messages
router.get(
  "/conversations/:id/messages",
  chatController.getMessages.bind(chatController)
);

// Send message (streaming)
router.post(
  "/conversations/:id/messages",
  chatController.sendMessage.bind(chatController)
);

// Edit message and regenerate
router.put(
  "/conversations/:conversationId/messages/:messageId",
  chatController.editMessage.bind(chatController)
);

// Delete message
router.delete(
  "/conversations/:conversationId/messages/:messageId",
  chatController.deleteMessage.bind(chatController)
);

// Get AI models
router.get("/models", chatController.getAvailableModels.bind(chatController));

module.exports = router;
