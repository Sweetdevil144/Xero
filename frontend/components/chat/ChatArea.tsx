/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, Send, Paperclip, Loader2, Bot, Sparkles } from "lucide-react";
import { Conversation, Message } from "./ChatInterface";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";
import ModelSelector from "./ModelSelector";
import FileUpload from "./FileUpload";
import FileAttachment from "./FileAttachment";
import { UploadedFile } from "@/lib/file-service";

interface ChatAreaProps {
  currentConversation: Conversation;
  messages: Message[];
  onSendMessage: (content: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  isLoading: boolean;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  attachedFiles: UploadedFile[];
  onFileUploaded: (file: UploadedFile) => void;
  onRemoveAttachment: (fileId: string) => void;
}

export default function ChatArea({
  currentConversation,
  messages,
  onSendMessage,
  onEditMessage,
  isLoading,
  sidebarOpen,
  onToggleSidebar,
  selectedModel,
  onModelChange,
  attachedFiles,
  onFileUploaded,
  onRemoveAttachment,
}: ChatAreaProps) {
  const [inputValue, setInputValue] = useState("");
  const [fileUploadOpen, setFileUploadOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(
        textareaRef.current.scrollHeight,
        200
      )}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && attachedFiles.length === 0) || isLoading) return;

    const messageContent = inputValue.trim() || "Here are the attached files:";
    onSendMessage(messageContent);
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as React.FormEvent);
    }
  };

  const getModelDisplayName = (modelId: string) => {
    const modelNames: Record<string, string> = {
      "gpt-3.5-turbo": "GPT-3.5",
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
    return modelNames[modelId] || modelId;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-white dark:bg-gray-900 relative">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700 px-3 sm:px-4 py-2 sm:py-3 shadow-sm">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
            {!sidebarOpen && (
              <button
                onClick={onToggleSidebar}
                className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                title="Open sidebar"
              >
                <Menu className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600 dark:text-gray-300" />
              </button>
            )}
            <div className="flex items-center space-x-2 min-w-0">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                  Xero
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {getModelDisplayName(selectedModel)}
                </p>
              </div>
            </div>
          </div>

          {/* Model Selector */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center min-h-0 px-4 py-8">
            <div className="text-center max-w-2xl mx-auto w-full">
              <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
                How can I help you today?
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 mb-6 sm:mb-8 px-2">
                I&apos;m here to assist you with questions, creative writing,
                analysis, coding, and much more. Let&apos;s start a conversation!
              </p>

              {/* Suggested prompts */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-w-2xl mx-auto px-2">
                {[
                  "Explain quantum computing in simple terms",
                  "Write a creative story about time travel",
                  "Help me debug this code",
                  "Plan a 7-day trip to Japan",
                ].map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(prompt)}
                    className="p-3 sm:p-4 text-left border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {prompt}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="pb-32 sm:pb-36">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onEditMessage={onEditMessage}
              />
            ))}
            {isLoading && (
              <div className="group w-full bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-700">
                <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                  <div className="flex items-start space-x-3 sm:space-x-4">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
                          Assistant
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                          {getModelDisplayName(selectedModel)}
                        </span>
                      </div>
                      <TypingIndicator />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-white dark:from-gray-900 via-white dark:via-gray-900 to-transparent pt-4 sm:pt-6">
        <div className="px-3 sm:px-4 pb-4 sm:pb-6">
          <div className="max-w-3xl mx-auto">
            {/* Attached Files */}
            {attachedFiles.length > 0 && (
              <div className="mb-3 sm:mb-4">
                <div className="flex flex-wrap gap-2">
                  {attachedFiles.map((file) => (
                    <FileAttachment
                      key={file.id}
                      file={file}
                      compact
                      showRemove
                      onRemove={() => onRemoveAttachment(file.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="relative">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Message Xero..."
                  className="w-full resize-none border border-gray-300 dark:border-gray-600 rounded-2xl pl-10 sm:pl-12 pr-12 sm:pr-16 py-3 sm:py-4 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent shadow-lg max-h-[150px] sm:max-h-[200px] bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 text-sm sm:text-base"
                  rows={1}
                  disabled={isLoading}
                />

                {/* Attachment button */}
                <button
                  type="button"
                  onClick={() => setFileUploadOpen(true)}
                  className="absolute left-2 sm:left-3 bottom-3 sm:bottom-4 p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  disabled={isLoading}
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 dark:text-gray-500" />
                </button>

                {/* Send button */}
                <button
                  type="submit"
                  disabled={
                    (!inputValue.trim() && attachedFiles.length === 0) ||
                    isLoading
                  }
                  className="absolute right-3 sm:right-5 bottom-2.5 sm:bottom-3 w-7 h-7 sm:w-8 sm:h-8 bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  title="Send message"
                >
                  {isLoading ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
            </form>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 sm:mt-3 px-2">
              Xero can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Modal */}
      <FileUpload
        isOpen={fileUploadOpen}
        onClose={() => setFileUploadOpen(false)}
        onFileUploaded={onFileUploaded}
      />
    </div>
  );
}
