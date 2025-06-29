"use client";

import { useState, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import { fileService, UploadedFile } from "@/lib/file-service";
import { toast } from "sonner";

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
  onClose: () => void;
  isOpen: boolean;
}

export default function FileUpload({
  onFileUploaded,
  onClose,
  isOpen,
}: FileUploadProps) {
  const { getToken } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      toast.error("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    try {
      const token = await getToken();
      if (!token) {
        toast.error("Authentication required");
        return;
      }

      const uploadedFile = await fileService.uploadFile(file, token);
      onFileUploaded(uploadedFile);
      toast.success("File uploaded successfully");
      onClose();
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Upload File
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isUploading}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Upload Area */}
        <div className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
              ${
                isDragging
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
              }
              ${isUploading ? "pointer-events-none opacity-50" : ""}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              disabled={isUploading}
              accept="image/*,video/*,audio/*,.pdf,.doc,.txt,.csv,.xlsx,.ppt,.pptx,.zip,.rar"
            />

            {isUploading ? (
              <div className="flex flex-col items-center space-y-3">
                <Loader2 className="h-12 w-12 text-green-600 animate-spin" />
                <p className="text-gray-600 dark:text-gray-300">Uploading...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  {isDragging ? (
                    <Upload className="h-6 w-6 text-green-600" />
                  ) : (
                    <FileIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {isDragging
                      ? "Drop file here"
                      : "Choose file or drag and drop"}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Images, videos, documents up to 10MB
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Supported formats */}
          <div className="mt-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Supported formats: JPG, PNG, GIF, MP4, MP3, PDF, DOC, XLS, PPT,
              ZIP
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
