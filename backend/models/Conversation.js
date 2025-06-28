const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "New Conversation",
    },
    model: {
      type: String,
      default: "gpt-3.5-turbo",
    },
    systemPrompt: String,
    metadata: {
      messageCount: { type: Number, default: 0 },
      tokenCount: { type: Number, default: 0 },
      lastActivity: { type: Date, default: Date.now },
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

conversationSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model("Conversation", conversationSchema);
