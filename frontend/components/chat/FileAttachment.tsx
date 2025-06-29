"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { UploadedFile, fileService } from "@/lib/file-service";

interface FileAttachmentProps {
  file: UploadedFile;
  showRemove?: boolean;
  onRemove?: () => void;
  compact?: boolean;
}

export default function FileAttachment({
  file,
  showRemove = false,
  onRemove,
  compact = false,
}: FileAttachmentProps) {
  const [imageError, setImageError] = useState(false);

  const isImage = fileService.isImageFile(file.mimetype);
  const isVideo = fileService.isVideoFile(file.mimetype);
  const isAudio = fileService.isAudioFile(file.mimetype);
  const isPdf = file.mimetype === "application/pdf";
  const isDocument =
    file.mimetype.includes("document") ||
    file.mimetype.includes("word") ||
    file.mimetype.includes("excel") ||
    file.mimetype.includes("powerpoint");

  if (compact) {
    return (
      <div className="inline-flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-2 max-w-xs">
        <span className="text-lg">
          {fileService.getFileIcon(file.mimetype)}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {file.originalName}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {fileService.formatFileSize(file.size)}
          </p>
        </div>
        {showRemove && onRemove && (
          <button
            onClick={onRemove}
            className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
          >
            <X className="h-3 w-3 text-gray-500 dark:text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden max-w-sm">
      {/* Preview */}
      {isImage && !imageError ? (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
          <img
            src={file.url}
            alt={file.originalName}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>
      ) : isVideo ? (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800">
          <video
            src={file.url}
            className="w-full h-full object-cover"
            controls
            preload="metadata"
          />
        </div>
      ) : isAudio ? (
        <div className="p-4 bg-gray-50 dark:bg-gray-800">
          <audio
            src={file.url}
            className="w-full"
            controls
            preload="metadata"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <div className="text-center">
            <span className="text-4xl mb-2 block">
              {fileService.getFileIcon(file.mimetype)}
            </span>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {file.mimetype.split("/")[1]?.toUpperCase() || "FILE"}
            </p>
            {(isPdf || isDocument) && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                Content processed for AI analysis
              </p>
            )}
          </div>
        </div>
      )}

      {/* File Info */}
      <div className="p-3 bg-white dark:bg-gray-800">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {file.originalName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {fileService.formatFileSize(file.size)} • {file.mimetype}
            </p>
            {(isPdf || isDocument) && (
              <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                ✓ Content extracted for AI analysis
              </p>
            )}
          </div>

          <div className="flex items-center space-x-1 ml-2">
            {showRemove && onRemove && (
              <button
                onClick={onRemove}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                title="Remove file"
              >
                <X className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
