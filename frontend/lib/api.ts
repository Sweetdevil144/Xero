/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://xero-4jqd.onrender.com/api";

class ApiClient {
  private async getAuthHeaders(): Promise<Record<string, string>> {
    try {
      return {
        "Content-Type": "application/json",
      };
    } catch (error) {
      console.error("Error getting auth headers:", error);
      return {
        "Content-Type": "application/json",
      };
    }
  }

  async request(endpoint: string, options: RequestInit = {}, token?: string) {
    const baseHeaders: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      baseHeaders["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        ...baseHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  }

  // Auth endpoints
  async verifyAuth(token: string) {
    const response = await this.request(
      "/auth/verify",
      {
        method: "POST",
      },
      token
    );
    return response.json();
  }

  async logout(token: string) {
    const response = await this.request(
      "/auth/logout",
      {
        method: "POST",
      },
      token
    );
    return response.json();
  }

  // Chat endpoints
  async getConversations(token: string) {
    const response = await this.request("/chat/conversations", {}, token);
    return response.json();
  }

  async createConversation(
    data: { title?: string; model?: string },
    token: string
  ) {
    const response = await this.request(
      "/chat/conversations",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
    return response.json();
  }

  async getConversation(id: string, token: string) {
    const response = await this.request(`/chat/conversations/${id}`, {}, token);
    return response.json();
  }

  async getMessages(conversationId: string, token: string) {
    const response = await this.request(
      `/chat/conversations/${conversationId}/messages`,
      {},
      token
    );
    return response.json();
  }

  async sendMessage(
    conversationId: string,
    data: {
      content: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      customApiKeys?: Record<string, string>;
      attachments?: any[];
    },
    token: string
  ) {
    const response = await this.request(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      token
    );
    return response;
  }

  async editMessage(
    conversationId: string,
    messageId: string,
    data: {
      content: string;
      model?: string;
      temperature?: number;
      maxTokens?: number;
      customApiKeys?: Record<string, string>;
      attachments?: any[];
    },
    token: string
  ) {
    const response = await this.request(
      `/chat/conversations/${conversationId}/messages/${messageId}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
      token
    );
    return response;
  }

  async deleteConversation(id: string, token: string) {
    const response = await this.request(
      `/chat/conversations/${id}`,
      {
        method: "DELETE",
      },
      token
    );
    return response.json();
  }

  async getAvailableModels(token: string) {
    const response = await this.request("/chat/models", {}, token);
    return response.json();
  }

  // File endpoints
  async uploadFile(file: File, token: string) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/files/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      throw new Error(
        `Upload failed: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getUserFiles(token: string) {
    const response = await this.request("/files", {}, token);
    return response.json();
  }

  async deleteFile(fileId: string, token: string) {
    const response = await this.request(
      `/files/${fileId}`,
      {
        method: "DELETE",
      },
      token
    );
    return response.json();
  }

  // User endpoints
  async getUserProfile(token: string) {
    const response = await this.request("/users/profile", {}, token);
    return response.json();
  }

  async getUserMemories(token: string) {
    const response = await this.request("/users/memories", {}, token);
    return response.json();
  }

  async deleteUserMemories(token: string) {
    const response = await this.request(
      "/users/memories",
      {
        method: "DELETE",
      },
      token
    );
    return response.json();
  }
}

export const apiClient = new ApiClient();
