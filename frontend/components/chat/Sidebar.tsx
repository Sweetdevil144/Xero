"use client";

import { useState } from "react";
import { useUser, UserButton, useAuth, useClerk } from "@clerk/nextjs";
import {
  Plus,
  MessageSquare,
  Trash2,
  Brain,
  ChevronLeft,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { Conversation } from "./ChatInterface";
import MemoryPanel from "./MemoryPanel";
import { useTheme } from "@/lib/theme-context";
import { apiClient } from "@/lib/api";
import { toast } from "sonner";

interface SidebarProps {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  onNewConversation: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteConversation: (conversationId: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export default function Sidebar({
  conversations,
  currentConversation,
  onNewConversation,
  onSelectConversation,
  onDeleteConversation,
  isOpen,
  onToggle,
}: SidebarProps) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { signOut } = useClerk();
  const { theme, toggleTheme } = useTheme();
  const [hoveredConversation, setHoveredConversation] = useState<string | null>(
    null
  );
  const [memoryPanelOpen, setMemoryPanelOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const token = await getToken();
      if (token) {
        await apiClient.logout(token);
      }

      // Clear any local storage
      localStorage.clear();

      // Sign out with Clerk
      await signOut();

      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Error during logout");

      // Still try to sign out even if API call fails
      try {
        await signOut();
      } catch (signOutError) {
        console.error("Sign out error:", signOutError);
      }
    } finally {
      setIsLoggingOut(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";

    const date = new Date(dateString);

    // Check if date is invalid
    if (isNaN(date.getTime())) {
      return "Unknown";
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays} days ago`;

    try {
      return date.toLocaleDateString();
    } catch (error) {
      console.error("Error formatting date:", error);
      return `${date}`;
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed lg:relative z-50 lg:z-0
        h-full bg-gray-900 dark:bg-gray-800 text-white flex flex-col
        transition-all duration-300 ease-in-out
        ${
          isOpen
            ? "w-80 translate-x-0"
            : "w-0 lg:w-12 -translate-x-full lg:translate-x-0"
        }
      `}
      >
        {/* Collapsed state - only show toggle buttons */}
        {!isOpen && (
          <div className="hidden lg:flex flex-col h-full items-center py-4 space-y-2">
            <button
              onClick={onToggle}
              className="p-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="Open sidebar"
            >
              <MessageSquare className="h-5 w-5" />
            </button>
            <button
              onClick={onNewConversation}
              className="p-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="h-5 w-5" />
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
            </button>

            {/* Spacer to push logout to bottom */}
            <div className="flex-1" />

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="p-2 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Expanded state */}
        {isOpen && (
          <>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700 dark:border-gray-600">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-6 w-6" />
                <span className="font-semibold">Xero Clone</span>
              </div>
              <button
                onClick={onToggle}
                className="p-1.5 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
                title="Close sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="p-4 space-y-2">
              <button
                onClick={onNewConversation}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors group"
              >
                <Plus className="h-5 w-5" />
                <span>New Chat</span>
              </button>

              <button
                onClick={() => setMemoryPanelOpen(true)}
                className="w-full flex items-center space-x-3 p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                <Brain className="h-5 w-5" />
                <span>AI Memory</span>
              </button>

              <button
                onClick={toggleTheme}
                className="w-full flex items-center space-x-3 p-3 bg-gray-800 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                {theme === "light" ? (
                  <Moon className="h-5 w-5" />
                ) : (
                  <Sun className="h-5 w-5" />
                )}
                <span>{theme === "light" ? "Dark Mode" : "Light Mode"}</span>
              </button>
            </div>

            {/* Conversations List */}
            <div className="flex-1 overflow-y-auto">
              <div className="px-4 pb-4">
                {conversations.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No conversations yet</p>
                    <p className="text-sm">Start a new chat to begin</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {conversations.map((conversation) => (
                      <div
                        key={conversation.id}
                        className={`
                          group relative flex items-center p-3 rounded-lg cursor-pointer transition-all duration-200
                          ${
                            currentConversation?.id === conversation.id
                              ? "bg-gray-700 dark:bg-gray-600 shadow-sm"
                              : "hover:bg-gray-800 dark:hover:bg-gray-700"
                          }
                        `}
                        onClick={() => onSelectConversation(conversation)}
                        onMouseEnter={() =>
                          setHoveredConversation(conversation.id)
                        }
                        onMouseLeave={() => setHoveredConversation(null)}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {conversation.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {formatDate(conversation.lastMessageAt)} •{" "}
                            {conversation.model}
                          </p>
                        </div>

                        {(hoveredConversation === conversation.id ||
                          currentConversation?.id === conversation.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteConversation(conversation.id);
                            }}
                            className="p-1.5 hover:bg-gray-600 dark:hover:bg-gray-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
                            title="Delete conversation"
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-400" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* User Section */}
            <div className="border-t border-gray-700 dark:border-gray-600 p-4">
              <div className="flex items-center space-x-3 mb-3">
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "w-8 h-8",
                    },
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    {user?.emailAddresses[0]?.emailAddress}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full flex items-center space-x-3 p-2 text-red-400 hover:bg-red-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? "Logging out..." : "Logout"}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Memory Panel */}
      <MemoryPanel
        isOpen={memoryPanelOpen}
        onClose={() => setMemoryPanelOpen(false)}
      />
    </>
  );
}
