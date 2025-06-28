const { getAuth } = require("@clerk/express");
const chatService = require("../services/chatService");
const aiService = require("../services/aiService");
const fileService = require("../services/fileService");
const logger = require("../utils/logger");
const User = require("../models/User");

class ChatController {
  // Helper method to ensure user exists
  async ensureUserExists(clerkUserId, sessionClaims = {}) {
    let user = await User.findOne({ clerkId: clerkUserId });

    if (!user) {
      user = new User({
        clerkId: clerkUserId,
        email: sessionClaims.email || `${clerkUserId}@temp.com`,
        firstName: sessionClaims.given_name || "User",
        lastName: sessionClaims.family_name || "",
        avatar: sessionClaims.picture || null,
      });
      await user.save();
      logger.info(`Auto-created user: ${clerkUserId}`);
    }

    return user;
  }

  // Helper method to transform conversation for frontend
  transformConversation(conversation) {
    return {
      id: conversation._id.toString(),
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      lastMessageAt: conversation.updatedAt, // Use updatedAt as lastMessageAt
    };
  }

  // Helper method to transform conversations array
  transformConversations(conversations) {
    return conversations.map((conv) => this.transformConversation(conv));
  }

  // Helper method to transform message for frontend
  transformMessage(message) {
    return {
      id: message._id.toString(),
      role: message.role,
      content: message.content,
      timestamp: message.createdAt,
      model: message.metadata?.model,
    };
  }

  // Helper method to transform messages array
  transformMessages(messages) {
    return messages.map((msg) => this.transformMessage(msg));
  }

  async getConversations(req, res, next) {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const search = req.query.search;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      const conversations = await chatService.getUserConversations(
        userId,
        page,
        limit,
        search
      );

      res.json({
        conversations: this.transformConversations(conversations),
        pagination: {
          page,
          limit,
          total: conversations.length,
          pages: Math.ceil(conversations.length / limit),
        },
      });
    } catch (error) {
      logger.error("Get conversations error:", error);
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;
      const { title, model } = req.body;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      const conversation = await chatService.createConversation({
        userId: userId,
        title: title || "New Conversation",
        model: model || "gemini-1.5-flash",
      });

      res.status(201).json(this.transformConversation(conversation));
    } catch (error) {
      logger.error("Create conversation error:", error);
      next(error);
    }
  }

  async getConversation(req, res, next) {
    try {
      const { id } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      const conversation = await chatService.getConversation(id, userId);
      res.json(this.transformConversation(conversation));
    } catch (error) {
      logger.error("Get conversation error:", error);
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async updateConversation(req, res, next) {
    try {
      const { id } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;
      const updates = req.body;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      const conversation = await chatService.updateConversation(
        id,
        userId,
        updates
      );
      res.json(this.transformConversation(conversation));
    } catch (error) {
      logger.error("Update conversation error:", error);
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const { id } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      await chatService.deleteConversation(id, userId);
      res.json({ message: "Conversation deleted successfully" });
    } catch (error) {
      logger.error("Delete conversation error:", error);
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { id } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      // Verify conversation ownership
      await chatService.getConversation(id, userId);

      const messages = await chatService.getConversationMessages(
        id,
        page,
        limit
      );

      res.json({
        messages: this.transformMessages(messages),
        pagination: {
          page,
          limit,
          total: messages.length,
          pages: Math.ceil(messages.length / limit),
        },
      });
    } catch (error) {
      logger.error("Get messages error:", error);
      if (error.message === "Conversation not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const { id } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;
      const {
        content,
        model,
        temperature,
        maxTokens,
        customApiKeys,
        attachments,
      } = req.body;

      if (!content && (!attachments || attachments.length === 0)) {
        return res
          .status(400)
          .json({ error: "Message content or attachments are required" });
      }

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      // Verify conversation ownership
      const conversation = await chatService.getConversation(id, userId);

      // Process file attachments if any
      let processedContent = content || "";
      let fileBuffers = [];

      if (attachments && attachments.length > 0) {
        logger.info(`Processing ${attachments.length} file attachments`);

        const fileContents = [];
        for (const attachment of attachments) {
          try {
            // Process file directly from Cloudinary
            const processedFile = await fileService.processFileFromCloudinary(
              attachment.id
            );

            if (processedFile.extractable) {
              fileContents.push(
                `\n\n--- File: ${processedFile.filename} ---\n${processedFile.content}\n--- End of ${processedFile.filename} ---\n`
              );
            } else {
              fileContents.push(`\n\n${processedFile.content}\n`);
            }

            if (processedFile.buffer && !processedFile.extractable) {
              fileBuffers.push({
                buffer: processedFile.buffer,
                mimetype: processedFile.mimetype,
                filename: processedFile.filename,
              });
            }
          } catch (error) {
            logger.error(
              `Error processing attachment ${attachment.originalName}:`,
              error
            );
            fileContents.push(
              `\n\n[Error processing file: ${attachment.originalName}]\n`
            );
          }
        }

        if (fileContents.length > 0) {
          processedContent = `${content}\n\nAttached files:${fileContents.join(
            ""
          )}`;
        }
      }

      // Create user message with original content (not processed)
      const userMessage = await chatService.addMessage(id, {
        role: "user",
        content: content || "Files attached",
        userId,
        attachments: attachments || [],
      });

      // Set response headers for streaming
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Get conversation history for context
      const messages = await chatService.getConversationMessages(id, 1, 50);
      const conversationHistory = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Add the current message with processed content to history
      conversationHistory.push({
        role: "user",
        content: processedContent,
      });

      // Generate AI response with streaming
      const streamResult = await aiService.streamResponse(conversationHistory, {
        userId,
        model: model || conversation.model || "gemini-1.5-flash",
        temperature: temperature || 0.7,
        maxTokens: maxTokens || 1000,
        customApiKeys: customApiKeys || {},
        fileBuffers: fileBuffers, // Pass file buffers directly
      });

      let fullResponse = "";

      // Stream the response
      for await (const chunk of streamResult.textStream) {
        fullResponse += chunk;
        res.write(chunk);
      }

      // Save assistant message
      await chatService.addMessage(id, {
        role: "assistant",
        content: fullResponse,
        userId,
        model: model || conversation.model || "gemini-1.5-flash",
      });

      // Store memory for this conversation
      try {
        await aiService.storeMemory(conversationHistory, fullResponse, userId);
        logger.info(`Memory stored for user: ${userId}`);
      } catch (memoryError) {
        logger.error("Error storing memory:", memoryError);
        // Don't fail the request if memory storage fails
      }

      // Update conversation last message time
      await chatService.updateConversation(id, userId, {
        lastMessageAt: new Date(),
      });

      res.end();
    } catch (error) {
      logger.error("Send message error:", error);
      if (!res.headersSent) {
        if (error.message === "Conversation not found") {
          return res.status(404).json({ error: error.message });
        }
        next(error);
      }
    }
  }

  async deleteMessage(req, res, next) {
    try {
      const { conversationId, messageId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      // Verify conversation ownership
      await chatService.getConversation(conversationId, userId);

      await chatService.deleteMessage(conversationId, messageId);
      res.json({ message: "Message deleted successfully" });
    } catch (error) {
      logger.error("Delete message error:", error);
      if (error.message === "Message not found") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async editMessage(req, res, next) {
    try {
      const { conversationId, messageId } = req.params;
      const {
        content,
        model,
        temperature = 0.7,
        maxTokens = 2000,
        customApiKeys,
      } = req.body;
      const auth = getAuth(req);
      const userId = auth.userId;

      // Ensure user exists
      await this.ensureUserExists(userId, auth.sessionClaims);

      // Verify conversation ownership
      const conversation = await chatService.getConversation(
        conversationId,
        userId
      );

      // Update the message content
      await chatService.updateMessage(messageId, { content });

      // Get conversation history up to this message for context
      const messages = await chatService.getConversationMessages(
        conversationId
      );
      const messageIndex = messages.findIndex(
        (msg) => msg._id.toString() === messageId
      );

      if (messageIndex === -1) {
        return res.status(404).json({ error: "Message not found" });
      }

      // Remove messages after the edited one and regenerate from this point
      const messagesToKeep = messages.slice(0, messageIndex + 1);
      await chatService.deleteMessagesAfter(conversationId, messageId);

      // Prepare conversation history for AI
      const conversationHistory = messagesToKeep.map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Set response headers for streaming (same as sendMessage)
      res.setHeader("Content-Type", "text/plain");
      res.setHeader("Transfer-Encoding", "chunked");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Generate AI response with streaming
      const streamResult = await aiService.streamResponse(conversationHistory, {
        userId,
        model: model || conversation.model || "gemini-1.5-flash",
        temperature,
        maxTokens,
        customApiKeys: customApiKeys || {},
      });

      let fullResponse = "";

      // Stream the response
      for await (const chunk of streamResult.textStream) {
        fullResponse += chunk;
        res.write(chunk);
      }

      // Save assistant message
      await chatService.addMessage(conversationId, {
        role: "assistant",
        content: fullResponse,
        userId,
        model: model || conversation.model || "gemini-1.5-flash",
        metadata: {
          regenerated: true,
        },
      });

      // Store memory for this conversation
      try {
        await aiService.storeMemory(conversationHistory, fullResponse, userId);
        logger.info(`Memory stored for user: ${userId}`);
      } catch (memoryError) {
        logger.error("Error storing memory:", memoryError);
        // Don't fail the request if memory storage fails
      }

      // Update conversation last message time
      await chatService.updateConversation(conversationId, userId, {
        lastMessageAt: new Date(),
      });

      res.end();
    } catch (error) {
      logger.error("Edit message error:", error);
      if (!res.headersSent) {
        if (
          error.message === "Message not found" ||
          error.message === "Conversation not found"
        ) {
          return res.status(404).json({ error: error.message });
        }
        next(error);
      }
    }
  }

  async getAvailableModels(req, res, next) {
    try {
      const models = await aiService.getAvailableModels();
      res.json({ models });
    } catch (error) {
      logger.error("Get models error:", error);
      next(error);
    }
  }
}

module.exports = new ChatController();
