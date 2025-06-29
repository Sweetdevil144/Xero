"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import Sidebar from "./Sidebar";
import ChatArea from "./ChatArea";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";
import { UploadedFile } from "@/lib/file-service";

export interface Conversation {
  id: string;
  title: string;
  model: string;
  createdAt: string;
  lastMessageAt: string;
}

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  model?: string;
  attachments?: UploadedFile[];
  isEdited?: boolean;
}

export default function ChatInterface() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gemini-1.5-flash");
  const [attachedFiles, setAttachedFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      loadConversations();
    }
  }, [isLoaded, isSignedIn]);

  const loadConversations = async () => {
    try {
      const token = await getToken();
      if (!token) return;

      const data = await apiClient.getConversations(token);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      toast.error("Failed to load conversations");
    }
  };

  const createNewConversation = async (
    title?: string
  ): Promise<Conversation | null> => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return null;
      }

      const newConversation = await apiClient.createConversation(
        {
          title: title || "New Conversation",
          model: selectedModel,
        },
        token
      );

      setConversations((prev) => [newConversation, ...prev]);
      setCurrentConversation(newConversation);
      setMessages([]);

      return newConversation;
    } catch (error) {
      console.error("Error creating conversation:", error);
      toast.error("Failed to create conversation");
      return null;
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    try {
      setCurrentConversation(conversation);
      setIsLoading(true);
      setAttachedFiles([]); // Clear attached files when switching conversations

      const token = await getToken();
      if (!token) return;

      const data = await apiClient.getMessages(conversation.id, token);
      setMessages(data.messages || []);

      // Update selected model to match conversation model
      setSelectedModel(conversation.model);
    } catch (error) {
      console.error("Error loading conversation:", error);
      toast.error("Failed to load conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUploaded = (file: UploadedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
  };

  const handleRemoveAttachment = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const sendMessage = async (content: string) => {
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      let conversationToUse = currentConversation;

      // Only create new conversation if none exists AND no conversations in the list
      if (!conversationToUse && conversations.length === 0) {
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        conversationToUse = await createNewConversation(title);

        if (!conversationToUse) {
          toast.error("Failed to create conversation");
          return;
        }
      } else if (!conversationToUse && conversations.length > 0) {
        // If there are conversations but none selected, select the first one
        conversationToUse = conversations[0];
        setCurrentConversation(conversationToUse);

        // Load messages for this conversation
        try {
          const data = await apiClient.getMessages(conversationToUse.id, token);
          setMessages(data.messages || []);
        } catch (error) {
          console.error("Error loading conversation messages:", error);
        }
      } else if (!conversationToUse) {
        // Fallback: create new conversation
        const title = content.slice(0, 50) + (content.length > 50 ? "..." : "");
        conversationToUse = await createNewConversation(title);

        if (!conversationToUse) {
          toast.error("Failed to create conversation");
          return;
        }
      }

      // Add user message immediately with attachments
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content,
        timestamp: new Date().toISOString(),
        attachments: attachedFiles.length > 0 ? [...attachedFiles] : undefined,
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);

      // Clear attached files after sending
      setAttachedFiles([]);

      // Create assistant message placeholder
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const customApiKeys: Record<string, string> = {};
        const providers = ["openai", "gemini", "claude"];

        providers.forEach((provider) => {
          const apiKey = localStorage.getItem(`${provider}_api_key`);
          if (apiKey) {
            customApiKeys[provider] = apiKey;
          }
        });

        // Send message to API with streaming using selected model
        const response = await apiClient.sendMessage(
          conversationToUse.id,
          {
            content: content,
            model: selectedModel,
            customApiKeys,
            attachments: attachedFiles.length > 0 ? [...attachedFiles] : [],
          },
          token
        );

        if (!response.body) {
          throw new Error("No response body received");
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          // Update the assistant message with accumulated content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }

        // Reload conversations to get updated lastMessageAt
        loadConversations();
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        // Update message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, there was an error processing your request. Please try again.",
                }
              : msg
          )
        );
        toast.error("Failed to get AI response");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const token = await getToken();
      if (!token) return;

      await apiClient.deleteConversation(conversationId, token);

      setConversations((prev) => prev.filter((c) => c.id !== conversationId));

      if (currentConversation?.id === conversationId) {
        setCurrentConversation(null);
        setMessages([]);
        setAttachedFiles([]); // Clear attached files when deleting current conversation
      }

      toast.success("Conversation deleted");
    } catch (error) {
      console.error("Error deleting conversation:", error);
      toast.error("Failed to delete conversation");
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    if (!currentConversation) {
      toast.error("No conversation selected");
      return;
    }

    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      // Update the message content immediately in the UI
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId
            ? { ...msg, content: newContent, isEdited: true }
            : msg
        )
      );

      // Remove all messages after the edited one
      const messageIndex = messages.findIndex((msg) => msg.id === messageId);
      if (messageIndex !== -1) {
        setMessages((prev) => prev.slice(0, messageIndex + 1));
      }

      setIsLoading(true);

      // Create assistant message placeholder for regenerated response
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        timestamp: new Date().toISOString(),
        model: selectedModel,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const customApiKeys: Record<string, string> = {};
        const providers = ["openai", "gemini", "claude"];

        providers.forEach((provider) => {
          const apiKey = localStorage.getItem(`${provider}_api_key`);
          if (apiKey) {
            customApiKeys[provider] = apiKey;
          }
        });

        // Send edit request to API with streaming
        const response = await apiClient.editMessage(
          currentConversation.id,
          messageId,
          {
            content: newContent,
            model: selectedModel,
            customApiKeys,
          },
          token
        );

        if (!response.body) {
          throw new Error("No response body received");
        }

        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          // Update the assistant message with accumulated content
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: assistantContent }
                : msg
            )
          );
        }

        // Reload conversations to get updated lastMessageAt
        loadConversations();
        toast.success("Message edited and response regenerated");
      } catch (streamError) {
        console.error("Streaming error:", streamError);
        // Update message with error
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId
              ? {
                  ...msg,
                  content:
                    "Sorry, there was an error regenerating the response. Please try again.",
                }
              : msg
          )
        );
        toast.error("Failed to regenerate AI response");
      }

      setIsLoading(false);
    } catch (error) {
      console.error("Error editing message:", error);
      toast.error("Failed to edit message");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-white dark:bg-gray-900">
      {!isLoaded ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      ) : (
        <>
          <Sidebar
            conversations={conversations}
            currentConversation={currentConversation}
            onNewConversation={() => createNewConversation()}
            onSelectConversation={selectConversation}
            onDeleteConversation={deleteConversation}
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
          />

          <ChatArea
            currentConversation={currentConversation || ({} as Conversation)}
            messages={messages}
            onSendMessage={sendMessage}
            onEditMessage={editMessage}
            isLoading={isLoading}
            sidebarOpen={sidebarOpen}
            onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            attachedFiles={attachedFiles}
            onFileUploaded={handleFileUploaded}
            onRemoveAttachment={handleRemoveAttachment}
          />
        </>
      )}
    </div>
  );
}
