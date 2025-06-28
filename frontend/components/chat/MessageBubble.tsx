"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Copy, Check, User, Bot, Edit2, X, Save } from "lucide-react";
import { Message } from "./ChatInterface";
import MessageContent from "./MessageContent";
import FileAttachment from "./FileAttachment";

interface MessageBubbleProps {
  message: Message;
  onEditMessage?: (messageId: string, newContent: string) => void;
}

export default function MessageBubble({
  message,
  onEditMessage,
}: MessageBubbleProps) {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditContent(message.content);
  };

  const handleSaveEdit = () => {
    if (onEditMessage && editContent.trim() !== message.content) {
      onEditMessage(message.id, editContent.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(message.content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isUser = message.role === "user";

  return (
    <div
      className={`group w-full ${
        isUser ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-900"
      } border-b border-gray-100 dark:border-gray-700`}
    >
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-start space-x-4">
          {/* Avatar */}
          <div
            className={`
            w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
            ${
              isUser
                ? "bg-black dark:bg-white text-white dark:text-black"
                : "bg-green-600 text-white"
            }
          `}
          >
            {isUser ? (
              user?.imageUrl ? (
                <img
                  src={user.imageUrl}
                  alt="User"
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User className="h-4 w-4" />
              )
            ) : (
              <Bot className="h-4 w-4" />
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-gray-900 dark:text-white">
                {isUser ? user?.firstName || "You" : "Assistant"}
              </span>
              {message.model && !isUser && (
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                  {message.model}
                </span>
              )}
              {message.isEdited && (
                <span className="text-xs text-gray-500 dark:text-gray-400 italic">
                  (edited)
                </span>
              )}
            </div>

            {/* File Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {message.attachments.map((file) => (
                    <FileAttachment key={file.id} file={file} />
                  ))}
                </div>
              </div>
            )}

            {/* Message Content with Markdown Support or Edit Mode */}
            {message.content && (
              <div className="text-gray-900 dark:text-white leading-relaxed">
                {isEditing ? (
                  <div className="space-y-3">
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                      rows={Math.max(3, editContent.split("\n").length)}
                      autoFocus
                    />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                      >
                        <Save className="h-3 w-3" />
                        <span>Save & Regenerate</span>
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex items-center space-x-1 px-3 py-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                      >
                        <X className="h-3 w-3" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <MessageContent
                    content={message.content}
                    role={message.role}
                  />
                )}
              </div>
            )}

            {/* Message Actions */}
            <div className="flex items-center justify-between mt-3 pt-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {formatTime(message.timestamp)}
              </span>

              {!isEditing && message.content && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {isUser && onEditMessage && (
                    <button
                      onClick={handleEdit}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Edit message"
                    >
                      <Edit2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                  {!isUser && (
                    <button
                      onClick={copyToClipboard}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                      title="Copy message"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
