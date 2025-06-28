"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Brain, Trash2, RefreshCw, X } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api";

interface Memory {
  id: string;
  memory: string;
  created_at: string;
}

interface MemoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryPanel({ isOpen, onClose }: MemoryPanelProps) {
  const { getToken } = useAuth();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadMemories();
    }
  }, [isOpen]);

  const loadMemories = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await apiClient.getUserMemories(token);
      setMemories(data.memories || []);
    } catch (error) {
      console.error("Error loading memories:", error);
      toast.error("Failed to load memories");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAllMemories = async () => {
    if (
      !confirm(
        "Are you sure you want to delete all memories? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = await getToken();
      if (!token) return;

      await apiClient.deleteUserMemories(token);
      setMemories([]);
      toast.success("All memories deleted successfully");
    } catch (error) {
      console.error("Error deleting memories:", error);
      toast.error("Failed to delete memories");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-purple-600" />
            <h2 className="text-xl font-semibold text-gray-900">AI Memory</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadMemories}
              disabled={isLoading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh memories"
            >
              <RefreshCw
                className={`h-5 w-5 text-gray-600 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-4">
              Xero remembers important details from your conversations to
              provide more personalized responses. These memories help maintain
              context across different chat sessions.
            </p>

            {memories.length > 0 && (
              <button
                onClick={deleteAllMemories}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete All Memories</span>
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading memories...</span>
            </div>
          ) : memories.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 mb-2">No memories yet</p>
              <p className="text-sm text-gray-400">
                Start chatting with Xero to build up your conversation memory
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {memories.map((memory) => (
                <div
                  key={memory.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <p className="text-sm text-gray-900 mb-2">{memory.memory}</p>
                  <p className="text-xs text-gray-500">
                    {formatDate(memory.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-500 text-center">
            Memories are stored securely and used only to improve your chat
            experience
          </p>
        </div>
      </div>
    </div>
  );
}
