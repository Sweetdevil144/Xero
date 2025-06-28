const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://xero-4jqd.onrender.com";

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  cloudinaryId: string;
  userId: string;
  uploadedAt: string;
}

export interface FileUploadResponse {
  message: string;
  file: UploadedFile;
}

class FileService {
  async uploadFile(file: File, token: string): Promise<UploadedFile> {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_BASE_URL}/api/files/upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Upload failed");
      }

      const data: FileUploadResponse = await response.json();
      return data.file;
    } catch (error) {
      console.error("File upload error:", error);
      throw error;
    }
  }

  async getUserFiles(
    token: string,
    page = 1,
    limit = 10
  ): Promise<{
    files: UploadedFile[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/files?page=${page}&limit=${limit}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch files");
      }

      return await response.json();
    } catch (error) {
      console.error("Get files error:", error);
      throw error;
    }
  }

  async deleteFile(fileId: string, token: string): Promise<void> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/files/${fileId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Delete failed");
      }
    } catch (error) {
      console.error("File delete error:", error);
      throw error;
    }
  }

  getFileIcon(mimetype: string): string {
    if (mimetype.startsWith("image/")) return "🖼️";
    if (mimetype.startsWith("video/")) return "🎥";
    if (mimetype.startsWith("audio/")) return "🎵";
    if (mimetype.includes("pdf")) return "📄";
    if (mimetype.includes("word") || mimetype.includes("document")) return "📝";
    if (mimetype.includes("excel") || mimetype.includes("spreadsheet"))
      return "📊";
    if (mimetype.includes("powerpoint") || mimetype.includes("presentation"))
      return "📈";
    if (mimetype.includes("zip") || mimetype.includes("archive")) return "📦";
    return "📎";
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  isImageFile(mimetype: string): boolean {
    return mimetype.startsWith("image/");
  }

  isVideoFile(mimetype: string): boolean {
    return mimetype.startsWith("video/");
  }

  isAudioFile(mimetype: string): boolean {
    return mimetype.startsWith("audio/");
  }
}

export const fileService = new FileService();
