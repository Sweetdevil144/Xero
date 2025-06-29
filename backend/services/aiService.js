const { createOpenAI } = require("@ai-sdk/openai");
const { createGoogleGenerativeAI } = require("@ai-sdk/google");
const { createAnthropic } = require("@ai-sdk/anthropic");
const { generateText, streamText } = require("ai");
const openaiTokenCounter = require("openai-gpt-token-counter");
const { MemoryClient } = require("mem0ai");

class AIService {
  constructor() {
    this.mem0Client = null;
    this.providers = this.initializeProviders();
    this.initializeMem0();
  }

  initializeProviders() {
    const providers = [];

    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      providers.push({
        name: "openai",
        client: createOpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        }),
        models: {
          "gpt-3.5-turbo": "gpt-3.5-turbo",
          "gpt-4": "gpt-4",
          "gpt-4-turbo": "gpt-4-turbo",
          "gpt-4o": "gpt-4o",
        },
        defaultModel: "gpt-3.5-turbo",
      });
    }

    // Google Gemini Provider
    if (process.env.GEMINI_API_KEY) {
      providers.push({
        name: "gemini",
        client: createGoogleGenerativeAI({
          apiKey: process.env.GEMINI_API_KEY,
        }),
        models: {
          "gemini-1.5-flash": "gemini-1.5-flash",
          "gemini-1.5-pro": "gemini-1.5-pro",
          "gemini-2.0-flash": "gemini-2.0-flash",
        },
        defaultModel: process.env.DEFAULT_GEMINI_MODEL || "gemini-1.5-flash",
      });
    }

    // Anthropic Claude Provider
    if (process.env.CLAUDE_API_KEY) {
      providers.push({
        name: "claude",
        client: createAnthropic({
          apiKey: process.env.CLAUDE_API_KEY,
        }),
        models: {
          "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
          "claude-3-haiku": "claude-3-haiku-20240307",
          "claude-3-opus": "claude-3-opus-20240229",
        },
        defaultModel: process.env.DEFAULT_CLAUDE_MODEL || "claude-3-5-sonnet",
      });
    }

    console.log(
      `Initialized ${providers.length} AI providers:`,
      providers.map((p) => p.name)
    );
    return providers;
  }

  async initializeMem0() {
    try {
      if (process.env.MEM0_API_KEY) {
        this.mem0Client = new MemoryClient({
          apiKey: process.env.MEM0_API_KEY,
        });
        console.log("Mem0 client initialized successfully");
      } else {
        console.warn(
          "MEM0_API_KEY not found. Memory features will be disabled."
        );
      }
    } catch (error) {
      console.error("Error initializing Mem0:", error);
      this.mem0Client = null;
    }
  }

  getProviderAndModel(requestedModel) {
    const defaultOrder = ["gemini", "openai", "claude"];

    if (requestedModel) {
      for (const provider of this.providers) {
        if (provider.models[requestedModel]) {
          return {
            provider: provider,
            model: provider.models[requestedModel],
          };
        }
      }
    }

    // If no specific model or model not found, use default order
    for (const providerName of defaultOrder) {
      const provider = this.providers.find((p) => p.name === providerName);
      if (provider) {
        return {
          provider: provider,
          model: provider.defaultModel,
        };
      }
    }

    throw new Error("No AI providers available");
  }

  async generateResponse(messages, options = {}) {
    const errors = [];

    if (options.model) {
      for (const provider of this.providers) {
        if (provider.models[options.model]) {
          try {
            console.log(
              `Attempting generation with ${provider.name} for model ${options.model}`
            );

            // Add memory context if available
            const messagesWithMemory = await this.addMemoryContext(
              messages,
              options.userId
            );

            // Trim messages to fit within model's context window
            const modelMaxTokens = this.getModelMaxTokens(options.model);
            const reservedTokens = options.maxTokens || 8000;
            const availableTokens = modelMaxTokens - reservedTokens;
            
            const trimmedMessages = this.trimContextWindow(messagesWithMemory, availableTokens);
            
            console.log(`Trimmed messages from ${messagesWithMemory.length} to ${trimmedMessages.length} for model ${options.model} (max tokens: ${modelMaxTokens})`);

            // Use custom API key if provided, otherwise use default
            const clientToUse = this.getClientWithCustomKey(
              provider,
              options.customApiKeys
            );

            const result = await generateText({
              model: clientToUse(provider.models[options.model]),
              messages: trimmedMessages,
              temperature: options.temperature || 0.7,
              maxTokens: options.maxTokens || 1000,
            });

            // Store interaction in memory
            await this.storeMemory(messages, result.text, options.userId);

            console.log(
              `Successfully generated response with ${provider.name} using ${options.model}`
            );
            return result;
          } catch (error) {
            console.error(
              `${provider.name} generation failed for ${options.model}:`,
              error.message
            );
            errors.push(
              `${provider.name} (${options.model}): ${error.message}`
            );

            if (this.isQuotaError(error)) {
              console.log(
                `Quota error with ${provider.name}, trying fallback providers`
              );
              break;
            }

            console.warn(
              `Error with ${provider.name}, trying fallback providers`
            );
            break;
          }
        }
      }
    }

    console.log("Trying fallback providers with default models");
    for (const provider of this.providers) {
      if (options.model && provider.models[options.model]) {
        continue;
      }

      try {
        console.log(`Attempting fallback generation with ${provider.name}`);

        const messagesWithMemory = await this.addMemoryContext(
          messages,
          options.userId
        );

        // Trim messages for fallback model
        const fallbackModel = Object.keys(provider.models)[0] || "gpt-3.5-turbo";
        const modelMaxTokens = this.getModelMaxTokens(fallbackModel);
        const reservedTokens = options.maxTokens || 1000;
        const availableTokens = modelMaxTokens - reservedTokens;
        
        const trimmedMessages = this.trimContextWindow(messagesWithMemory, availableTokens);

        // Use custom API key if provided, otherwise use default
        const clientToUse = this.getClientWithCustomKey(
          provider,
          options.customApiKeys
        );

        const result = await generateText({
          model: clientToUse(provider.defaultModel),
          messages: trimmedMessages,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000,
        });

        await this.storeMemory(messages, result.text, options.userId);

        console.log(
          `Successfully generated fallback response with ${provider.name}`
        );
        return result;
      } catch (error) {
        console.error(
          `${provider.name} fallback generation failed:`,
          error.message
        );
        errors.push(`${provider.name} (fallback): ${error.message}`);

        continue;
      }
    }

    throw new Error(`All AI providers failed. Errors: ${errors.join("; ")}`);
  }

  async streamResponse(messages, options = {}) {
    const errors = [];

    // Process file buffers for multimodal content
    let processedMessages = messages;
    if (options.fileBuffers && options.fileBuffers.length > 0) {
      processedMessages = this.addFileBuffersToMessages(
        messages,
        options.fileBuffers
      );
    }

    // If a specific model is requested, try that provider first
    if (options.model) {
      for (const provider of this.providers) {
        if (provider.models[options.model]) {
          try {
            console.log(
              `Attempting streaming with ${provider.name} for model ${options.model}`
            );

            // Add memory context if available
            const messagesWithMemory = await this.addMemoryContext(
              processedMessages,
              options.userId
            );

            // Trim messages to fit within model's context window
            const modelMaxTokens = this.getModelMaxTokens(options.model);
            const reservedTokens = options.maxTokens || 1000; // Reserve tokens for response
            const availableTokens = modelMaxTokens - reservedTokens;
            
            const trimmedMessages = this.trimContextWindow(messagesWithMemory, availableTokens);
            
            console.log(`Trimmed messages from ${messagesWithMemory.length} to ${trimmedMessages.length} for model ${options.model} (max tokens: ${modelMaxTokens})`);

            // Use custom API key if provided, otherwise use default
            const clientToUse = this.getClientWithCustomKey(
              provider,
              options.customApiKeys
            );

            const result = await streamText({
              model: clientToUse(provider.models[options.model]),
              messages: trimmedMessages,
              temperature: options.temperature || 0.7,
              maxTokens: options.maxTokens || 1000,
            });

            console.log(
              `Successfully started streaming with ${provider.name} using ${options.model}`
            );
            return result;
          } catch (error) {
            console.error(
              `${provider.name} streaming failed for ${options.model}:`,
              error.message
            );
            errors.push(
              `${provider.name} (${options.model}): ${error.message}`
            );

            // If it's a quota/rate limit error, break and try fallback
            if (this.isQuotaError(error)) {
              console.log(
                `Quota error with ${provider.name}, trying fallback providers`
              );
              break;
            }

            // For other errors, also break and try fallback
            console.warn(
              `Error with ${provider.name}, trying fallback providers`
            );
            break;
          }
        }
      }
    }

    // Fallback: Try providers in default order with their default models
    console.log("Trying fallback providers with default models");
    for (const provider of this.providers) {
      // Skip if we already tried this provider above
      if (options.model && provider.models[options.model]) {
        continue;
      }

      try {
        console.log(`Attempting fallback streaming with ${provider.name}`);

        // Add memory context if available
        const messagesWithMemory = await this.addMemoryContext(
          processedMessages,
          options.userId
        );

        // Trim messages for fallback model
        const fallbackModel = Object.keys(provider.models)[0] || "gpt-3.5-turbo";
        const modelMaxTokens = this.getModelMaxTokens(fallbackModel);
        const reservedTokens = options.maxTokens || 1000;
        const availableTokens = modelMaxTokens - reservedTokens;
        
        const trimmedMessages = this.trimContextWindow(messagesWithMemory, availableTokens);
        
        console.log(`Trimmed messages from ${messagesWithMemory.length} to ${trimmedMessages.length} for fallback model ${fallbackModel} (max tokens: ${modelMaxTokens})`);

        // Use custom API key if provided, otherwise use default
        const clientToUse = this.getClientWithCustomKey(
          provider,
          options.customApiKeys
        );

        const result = await streamText({
          model: clientToUse(provider.defaultModel),
          messages: trimmedMessages,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1000,
        });

        console.log(
          `Successfully started fallback streaming with ${provider.name}`
        );
        return result;
      } catch (error) {
        console.error(
          `${provider.name} fallback streaming failed:`,
          error.message
        );
        errors.push(`${provider.name} (fallback): ${error.message}`);

        // Continue to next provider
        continue;
      }
    }

    throw new Error(`All AI providers failed. Errors: ${errors.join("; ")}`);
  }

  isQuotaError(error) {
    const errorMessage = error.message.toLowerCase();
    return (
      errorMessage.includes("quota") ||
      errorMessage.includes("rate limit") ||
      errorMessage.includes("exceeded") ||
      errorMessage.includes("insufficient") ||
      errorMessage.includes("billing")
    );
  }

  async addMemoryContext(messages, userId) {
    try {
      if (!this.mem0Client || !userId) {
        return messages;
      }

      // Get the last user message to search for relevant memories
      const lastUserMessage = messages
        .filter((msg) => msg.role === "user")
        .pop();

      if (!lastUserMessage) {
        return messages;
      }

      const textContent = this.extractTextContent(lastUserMessage.content);

      if (!textContent || textContent.trim().length === 0) {
        return messages;
      }

      // Retrieve relevant memories from Mem0
      const memories = await this.retrieveMemories(userId, textContent);

      if (memories && memories.length > 0) {
        // Add memory context as a system message
        const memoryContext = {
          role: "system",
          content: `Previous context about this user: ${memories.join(". ")}`,
        };

        return [memoryContext, ...messages];
      }

      return messages;
    } catch (error) {
      console.error("Error adding memory context:", error);
      return messages;
    }
  }

  extractTextContent(content) {
    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const textParts = content
        .filter((part) => part.type === "text")
        .map((part) => part.text)
        .join(" ");
      return textParts;
    }

    return "";
  }

  async storeMemory(messages, response, userId) {
    try {
      if (!this.mem0Client || !userId) {
        return;
      }

      const conversationMessages = messages.map((msg) => ({
        role: msg.role,
        content: this.extractTextContent(msg.content),
      }));

      if (response) {
        conversationMessages.push({
          role: "assistant",
          content: response,
        });
      }

      // Store the conversation in Mem0
      await this.mem0Client.add(conversationMessages, {
        user_id: userId,
        metadata: {
          timestamp: new Date().toISOString(),
          app_id: "xero",
        },
      });

      console.log("Memory stored successfully for user:", userId);
    } catch (error) {
      console.error("Error storing memory:", error);
    }
  }

  async retrieveMemories(userId, query) {
    try {
      if (!this.mem0Client) {
        return [];
      }

      // Search for relevant memories
      const searchResult = await this.mem0Client.search(query, {
        user_id: userId,
        limit: 5,
      });

      if (searchResult && searchResult.results) {
        return searchResult.results.map((item) => item.memory);
      }

      return [];
    } catch (error) {
      console.error("Error retrieving memories:", error);
      return [];
    }
  }

  async getUserMemories(userId, limit = 10) {
    try {
      if (!this.mem0Client || !userId) {
        return [];
      }

      const memories = await this.mem0Client.getAll({
        user_id: userId,
        limit: limit,
      });

      return memories || [];
    } catch (error) {
      console.error("Error getting user memories:", error);
      return [];
    }
  }

  async deleteUserMemories(userId) {
    try {
      if (!this.mem0Client || !userId) {
        return false;
      }

      await this.mem0Client.deleteAll({
        user_id: userId,
      });

      console.log("All memories deleted for user:", userId);
      return true;
    } catch (error) {
      console.error("Error deleting user memories:", error);
      return false;
    }
  }

  calculateTokens(text, model = "gpt-3.5-turbo") {
    try {
      return openaiTokenCounter.text(text, model);
    } catch (error) {
      console.error("Error calculating tokens:", error);
      return Math.ceil(text.length / 4);
    }
  }

  trimContextWindow(messages, maxTokens = 4000) {
    if (!messages || messages.length === 0) {
      return messages;
    }

    let totalTokens = 0;
    const trimmedMessages = [];

    // Always keep system messages
    const systemMessages = messages.filter((msg) => msg.role === "system");
    const conversationMessages = messages.filter(
      (msg) => msg.role !== "system"
    );

    // Add system messages first
    for (const msg of systemMessages) {
      const tokens = this.calculateTokens(this.extractTextContent(msg.content));
      totalTokens += tokens;
      trimmedMessages.push(msg);
    }

    // If no conversation messages, return system messages
    if (conversationMessages.length === 0) {
      return trimmedMessages;
    }

    // Always include the most recent message, even if it exceeds token limit
    const mostRecentMessage = conversationMessages[conversationMessages.length - 1];
    const mostRecentTokens = this.calculateTokens(this.extractTextContent(mostRecentMessage.content));
    trimmedMessages.push(mostRecentMessage);
    totalTokens += mostRecentTokens;

    // Add older conversation messages from most recent, within token limit
    for (let i = conversationMessages.length - 2; i >= 0; i--) {
      const tokens = this.calculateTokens(this.extractTextContent(conversationMessages[i].content));
      if (totalTokens + tokens > maxTokens) {
        break;
      }
      totalTokens += tokens;
      trimmedMessages.splice(-1, 0, conversationMessages[i]); // Insert before the most recent message
    }

    // Maintain chronological order
    const systemMsgs = trimmedMessages.filter(msg => msg.role === "system");
    const otherMsgs = trimmedMessages.filter(msg => msg.role !== "system");
    
    return [...systemMsgs, ...otherMsgs];
  }

  async getAvailableModels() {
    const models = [];

    const freeModels = [
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      "gemini-2.0-flash",
    ];

    const premiumModels = [
      "gpt-3.5-turbo",
      "gpt-4",
      "gpt-4-turbo",
      "gpt-4o",
      "claude-3-5-sonnet",
      "claude-3-haiku",
      "claude-3-opus",
    ];

    for (const provider of this.providers) {
      for (const [modelKey, modelValue] of Object.entries(provider.models)) {
        if (freeModels.includes(modelKey)) {
          models.push({
            id: modelKey,
            name: this.getModelDisplayName(modelKey, provider.name),
            description: this.getModelDescription(modelKey, provider.name),
            provider: provider.name,
            maxTokens: this.getModelMaxTokens(modelKey),
            isFree: true,
          });
        }
      }
    }

    for (const provider of this.providers) {
      for (const [modelKey, modelValue] of Object.entries(provider.models)) {
        if (premiumModels.includes(modelKey)) {
          models.push({
            id: modelKey,
            name: this.getModelDisplayName(modelKey, provider.name),
            description: this.getModelDescription(modelKey, provider.name),
            provider: provider.name,
            maxTokens: this.getModelMaxTokens(modelKey),
            isFree: false,
          });
        }
      }
    }

    return models;
  }

  getModelDisplayName(modelId, provider) {
    const displayNames = {
      "gpt-3.5-turbo": "GPT-3.5 Turbo",
      "gpt-4": "GPT-4",
      "gpt-4-turbo": "GPT-4 Turbo",
      "gpt-4o": "GPT-4o",
      "gemini-1.5-flash": "Gemini 1.5 Flash",
      "gemini-1.5-pro": "Gemini 1.5 Pro",
      "gemini-2.0-flash": "Gemini 2.0 Flash",
      "claude-3-5-sonnet": "Claude 3.5 Sonnet",
      "claude-3-haiku": "Claude 3 Haiku",
      "claude-3-opus": "Claude 3 Opus",
    };

    return displayNames[modelId] || `${modelId} (${provider})`;
  }

  getModelDescription(modelId, provider) {
    const descriptions = {
      "gpt-3.5-turbo": "Fast and efficient for most tasks",
      "gpt-4": "More capable, better at complex tasks",
      "gpt-4-turbo": "Latest GPT-4 with improved performance",
      "gpt-4o": "Most advanced OpenAI model",
      "gemini-1.5-flash": "Fast and efficient Google model",
      "gemini-1.5-pro": "Advanced Google model for complex tasks",
      "gemini-2.0-flash": "Latest fast Google model",
      "claude-3-5-sonnet": "Balanced performance and speed",
      "claude-3-haiku": "Fast and cost-effective",
      "claude-3-opus": "Most capable Claude model",
    };

    return descriptions[modelId] || `${provider} model`;
  }

  getModelMaxTokens(modelId) {
    const maxTokens = {
      "gpt-3.5-turbo": 4096,
      "gpt-4": 8192,
      "gpt-4-turbo": 128000,
      "gpt-4o": 128000,
      "gemini-1.5-flash": 1000000,
      "gemini-1.5-pro": 2000000,
      "gemini-2.0-flash": 1000000,
      "claude-3-5-sonnet": 200000,
      "claude-3-haiku": 200000,
      "claude-3-opus": 200000,
    };

    return maxTokens[modelId] || 4096;
  }

  getClientWithCustomKey(provider, customApiKeys = {}) {
    const customKey = customApiKeys[provider.name];
    if (customKey) {
      console.log(`Using custom API key for ${provider.name}`);
      switch (provider.name) {
        case "openai":
          return createOpenAI({ apiKey: customKey });
        case "gemini":
          return createGoogleGenerativeAI({ apiKey: customKey });
        case "claude":
          return createAnthropic({ apiKey: customKey });
        default:
          return provider.client;
      }
    }

    return provider.client;
  }

  addFileBuffersToMessages(messages, fileBuffers) {
    if (!fileBuffers || fileBuffers.length === 0) {
      return messages;
    }

    const processedMessages = [...messages];
    const lastUserMessageIndex = processedMessages
      .map((m) => m.role)
      .lastIndexOf("user");

    if (lastUserMessageIndex !== -1) {
      const lastUserMessage = processedMessages[lastUserMessageIndex];

      const content = [{ type: "text", text: lastUserMessage.content }];

      for (const fileBuffer of fileBuffers) {
        if (fileBuffer.mimetype.startsWith("image/")) {
          content.push({
            type: "image",
            image: fileBuffer.buffer.toString("base64"),
            mimeType: fileBuffer.mimetype,
          });
        }
      }

      processedMessages[lastUserMessageIndex] = {
        ...lastUserMessage,
        content: content,
      };
    }

    return processedMessages;
  }
}

module.exports = new AIService();
