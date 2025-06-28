const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const User = require("../models/User");

class ChatService {
  async createConversation(data) {
    const user = await User.findOne({ clerkId: data.userId });
    if (!user) {
      throw new Error("User not found");
    }

    const conversation = new Conversation({
      userId: user._id,
      title: data.title || "New Conversation",
      model: data.model || process.env.DEFAULT_AI_MODEL || "gpt-3.5-turbo",
      systemPrompt: data.systemPrompt,
    });

    await conversation.save();
    return conversation;
  }

  async getConversation(conversationId, clerkUserId) {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId: user._id,
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  async getUserConversations(clerkUserId, page = 1, limit = 20, search = null) {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }

    let query = { userId: user._id, isArchived: false };

    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    const conversations = await Conversation.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("userId", "firstName lastName avatar");

    return conversations;
  }

  async createMessage(data) {
    const message = new Message(data);
    await message.save();

    // Update conversation metadata
    await Conversation.findByIdAndUpdate(data.conversationId, {
      $inc: { "metadata.messageCount": 1 },
      $set: { "metadata.lastActivity": new Date() },
    });

    // Update user usage
    if (data.role === "user") {
      const conversation = await Conversation.findById(
        data.conversationId
      ).populate("userId");
      await User.findByIdAndUpdate(conversation.userId._id, {
        $inc: { "usage.messagesCount": 1 },
        $set: { "usage.lastActive": new Date() },
      });
    }

    return message;
  }

  async addMessage(conversationId, data) {
    const message = new Message({
      conversationId,
      role: data.role,
      content: data.content,
      model: data.model,
      metadata: data.metadata || {},
      files: data.attachments ? data.attachments.map((att) => att.id) : [],
    });

    await message.save();

    // Update conversation metadata
    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: { "metadata.messageCount": 1 },
      $set: { "metadata.lastActivity": new Date() },
    });

    // Update user usage
    if (data.role === "user") {
      const conversation = await Conversation.findById(conversationId).populate(
        "userId"
      );
      await User.findByIdAndUpdate(conversation.userId._id, {
        $inc: { "usage.messagesCount": 1 },
        $set: { "usage.lastActive": new Date() },
      });
    }

    return message;
  }

  async updateConversation(conversationId, clerkUserId, updates) {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }

    const conversation = await Conversation.findOneAndUpdate(
      { _id: conversationId, userId: user._id },
      updates,
      { new: true }
    );

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    return conversation;
  }

  async getConversationMessages(conversationId, page = 1, limit = 50) {
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate("files");

    return messages;
  }

  async editMessage(messageId, content, clerkUserId) {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }

    const message = await Message.findById(messageId).populate(
      "conversationId"
    );

    if (
      !message ||
      message.conversationId.userId.toString() !== user._id.toString()
    ) {
      throw new Error("Message not found or unauthorized");
    }

    // Store edit history
    message.editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    message.content = content;
    message.isEdited = true;

    await message.save();
    return message;
  }

  async deleteConversation(conversationId, clerkUserId) {
    const conversation = await this.getConversation(
      conversationId,
      clerkUserId
    );

    // Delete all messages
    await Message.deleteMany({ conversationId });

    // Delete conversation
    await conversation.deleteOne();
  }

  async getMessageById(messageId, clerkUserId) {
    const user = await User.findOne({ clerkId: clerkUserId });
    if (!user) {
      throw new Error("User not found");
    }

    const message = await Message.findById(messageId).populate({
      path: "conversationId",
      match: { userId: user._id },
    });

    if (!message || !message.conversationId) {
      throw new Error("Message not found or unauthorized");
    }

    return message;
  }

  async updateMessage(messageId, updates) {
    const message = await Message.findById(messageId);
    if (!message) {
      throw new Error("Message not found");
    }

    // Store edit history if content is being updated
    if (updates.content && updates.content !== message.content) {
      message.editHistory.push({
        content: message.content,
        editedAt: new Date(),
      });
      message.isEdited = true;
    }

    Object.assign(message, updates);
    await message.save();
    return message;
  }

  async deleteMessagesAfter(conversationId, messageId) {
    // Get the message to find its timestamp
    const targetMessage = await Message.findById(messageId);
    if (!targetMessage) {
      throw new Error("Message not found");
    }

    // Delete all messages in the conversation created after this message
    await Message.deleteMany({
      conversationId,
      createdAt: { $gt: targetMessage.createdAt },
    });
  }

  async deleteMessage(conversationId, messageId) {
    const message = await Message.findOne({
      _id: messageId,
      conversationId,
    });

    if (!message) {
      throw new Error("Message not found");
    }

    await message.deleteOne();

    // Update conversation metadata
    await Conversation.findByIdAndUpdate(conversationId, {
      $inc: { "metadata.messageCount": -1 },
    });
  }
}

module.exports = new ChatService();
