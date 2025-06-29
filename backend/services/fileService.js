const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const File = require("../models/File");
const User = require("../models/User");
const logger = require("../utils/logger");
const axios = require("axios");
const pdf = require("pdf-parse");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const verifyCloudinaryConfig = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();

  if (!cloud_name || !api_key || !api_secret) {
    logger.error("Cloudinary configuration incomplete:", {
      cloud_name: !!cloud_name,
      api_key: !!api_key,
      api_secret: !!api_secret,
    });
    logger.warn(
      "Cloudinary configuration incomplete. File upload features may not work properly."
    );
    return false;
  }

  logger.info("Cloudinary configured successfully", {
    cloud_name,
    api_key: api_key.substring(0, 4) + "***",
  });
  return true;
};

// Test Cloudinary connectivity
const testCloudinaryConnection = async () => {
  try {
    if (!verifyCloudinaryConfig()) {
      return false;
    }

    // Test connection by calling the ping API
    const result = await cloudinary.api.ping();
    logger.info("Cloudinary connection test successful:", result);
    return true;
  } catch (error) {
    logger.error("Cloudinary connection test failed:", error.message);
    return false;
  }
};

verifyCloudinaryConfig();

// Test connection on startup
testCloudinaryConnection();

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "xero",
    allowed_formats: [
      "jpg",
      "jpeg",
      "png",
      "gif",
      "pdf",
      "doc",
      "txt",
      "mp3",
      "mp4",
      "wav",
    ],
    resource_type: "auto",
    access_mode: "public",
    transformation: [
      { width: 1000, height: 1000, crop: "limit", quality: "auto" },
    ],
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

class FileService {
  async uploadFile(fileBuffer, filename, mimetype, userId) {
    try {
      if (!verifyCloudinaryConfig()) {
        throw new Error("Cloudinary not configured properly");
      }

      return new Promise((resolve, reject) => {
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");

        const uploadOptions = {
          folder: "xero",
          public_id: `${Date.now()}_${nameWithoutExt}`,
          resource_type: "auto",
          access_mode: "public",
          transformation: [
            { width: 1000, height: 1000, crop: "limit", quality: "auto" },
          ],
        };

        cloudinary.uploader
          .upload_stream(uploadOptions, async (error, result) => {
            if (error) {
              logger.error("Cloudinary upload error:", error);
              reject(new Error("File upload failed"));
              return;
            }

            try {
              // Save file record to database
              const fileRecord = new File({
                filename: filename,
                originalName: filename,
                mimetype: mimetype,
                size: result.bytes,
                cloudinaryId: result.public_id,
                url: result.secure_url,
                uploadedBy: userId,
              });

              await fileRecord.save();
              logger.info(
                `File uploaded successfully: ${filename} -> ${result.public_id}`
              );

              resolve({
                id: fileRecord._id,
                filename: fileRecord.filename,
                originalName: fileRecord.originalName,
                mimetype: fileRecord.mimetype,
                size: fileRecord.size,
                url: fileRecord.url,
                uploadedAt: fileRecord.uploadedAt,
                cloudinaryId: fileRecord.cloudinaryId,
              });
            } catch (dbError) {
              logger.error("Database save error:", dbError);
              // Clean up Cloudinary upload
              await this.deleteFromCloudinary(result.public_id);
              reject(new Error("Failed to save file record"));
            }
          })
          .end(fileBuffer);
      });
    } catch (error) {
      logger.error("File upload service error:", error);
      throw error;
    }
  }

  async getFileById(fileId, userId) {
    try {
      const file = await File.findOne({
        _id: fileId,
        uploadedBy: userId,
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      return {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        mimetype: file.mimetype,
        size: file.size,
        url: file.url,
        uploadedAt: file.uploadedAt,
        cloudinaryId: file.cloudinaryId,
      };
    } catch (error) {
      logger.error("Get file error:", error);
      throw error;
    }
  }

  async getUserFiles(userId, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const files = await File.find({ uploadedBy: userId })
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(limit);

      const total = await File.countDocuments({ uploadedBy: userId });

      return {
        files: files.map((file) => ({
          id: file._id,
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          url: file.url,
          uploadedAt: file.uploadedAt,
        })),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error("Get user files error:", error);
      throw error;
    }
  }

  async deleteFile(fileId, userId) {
    try {
      const file = await File.findOne({
        _id: fileId,
        uploadedBy: userId,
      });

      if (!file) {
        throw new Error("File not found or access denied");
      }

      // Delete from Cloudinary
      await this.deleteFromCloudinary(file.cloudinaryId);

      // Delete from database
      await File.findByIdAndDelete(fileId);

      logger.info(`File deleted successfully: ${file.filename}`);
      return true;
    } catch (error) {
      logger.error("Delete file error:", error);
      throw error;
    }
  }

  async deleteFromCloudinary(publicId) {
    try {
      if (!verifyCloudinaryConfig()) {
        logger.warn("Cannot delete from Cloudinary - not configured");
        return;
      }

      const result = await cloudinary.uploader.destroy(publicId);
      logger.info(`Cloudinary deletion result for ${publicId}:`, result);
    } catch (error) {
      logger.error("Cloudinary deletion error:", error);
      // Don't throw here as it's cleanup
    }
  }

  getMulterUpload() {
    return upload;
  }

  validateFileType(mimetype) {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "audio/mpeg",
      "audio/wav",
      "video/mp4",
    ];

    return allowedTypes.includes(mimetype);
  }

  formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  async extractFileContent(fileUrl, mimetype) {
    try {
      logger.info(`Extracting content from file: ${fileUrl} (${mimetype})`);

      let buffer;

      if (fileUrl.includes("cloudinary.com")) {
        buffer = await this.getCloudinaryFileBuffer(fileUrl);
      } else {
        // For non-Cloudinary URLs, download directly
        const response = await axios.get(fileUrl, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Xero/1.0",
          },
          maxRedirects: 5,
          validateStatus: function (status) {
            return status >= 200 && status < 300;
          },
        });
        buffer = Buffer.from(response.data);
      }

      switch (mimetype) {
        case "application/pdf":
          return await this.extractPdfContent(buffer);

        case "text/plain":
          return buffer.toString("utf-8");

        case "application/msword":
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          return `[Word Document]\nNote: Word document content extraction is not yet implemented. Please convert to PDF or plain text for full content analysis.`;

        default:
          return `[${mimetype} file]\nNote: This file type requires visual/audio analysis capabilities.`;
      }
    } catch (error) {
      logger.error(`Error extracting file content: ${error.message}`);
      return `[File: ${fileUrl}]\nNote: Unable to extract content from this file. Error: ${error.message}`;
    }
  }

  // Debug: List recent Cloudinary resources
  async debugListCloudinaryResources() {
    try {
      logger.info("Listing recent Cloudinary resources for debugging...");

      // List recent raw resources
      const rawResources = await cloudinary.api.resources({
        resource_type: "raw",
        type: "upload",
        max_results: 10,
        prefix: "xero/",
      });

      logger.info(
        "Recent raw resources:",
        rawResources.resources.map((r) => ({
          public_id: r.public_id,
          format: r.format,
          created_at: r.created_at,
          secure_url: r.secure_url,
        }))
      );

      return rawResources.resources;
    } catch (error) {
      logger.error("Failed to list Cloudinary resources:", error.message);
      return [];
    }
  }

  // Updated: Get file buffer using Cloudinary URL generation
  async getCloudinaryFileBuffer(publicId, mimetype = null) {
    const resourceType = mimetype
      ? this.getCloudinaryResourceType(mimetype)
      : "raw";
    // Declare outside try for catch blocks
    let cleanPublicId = publicId;

    try {
      logger.info(
        `Fetching file from Cloudinary: ${publicId} (${resourceType})`
      );

      // For raw resources, Cloudinary expects the file extension in the URL
      let formatExt = null;
      if (resourceType === "raw") {
        // Derive extension from mimetype if possible
        if (mimetype && mimetype.includes("/")) {
          const extMap = {
            "application/pdf": "pdf",
            "text/plain": "txt",
            "text/csv": "csv",
            "audio/mpeg": "mp3",
            "audio/wav": "wav",
            "video/mp4": "mp4",
          };
          formatExt = extMap[mimetype] || mimetype.split("/")[1];
        }

        // Ensure publicId has no extension (Cloudinary will add it via format option)
        if (cleanPublicId.includes(".")) {
          cleanPublicId = cleanPublicId.replace(/\.[^/.]+$/, "");
        }
      }

      logger.info(
        `Using public ID: ${cleanPublicId} format: ${formatExt || "auto"}`
      );

      // Generate the Cloudinary URL using the SDK
      const cloudinaryUrl = cloudinary.url(cleanPublicId, {
        resource_type: resourceType,
        type: "upload",
        secure: true,
        format: formatExt || undefined,
      });

      logger.info(
        `Generated Cloudinary URL (${resourceType}): ${cloudinaryUrl}`
      );

      // Download the file using the generated URL
      const response = await axios.get(cloudinaryUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
        headers: {
          "User-Agent": "Xero/1.0",
        },
        maxRedirects: 5,
        validateStatus: function (status) {
          return status >= 200 && status < 400;
        },
      });

      logger.info(
        `Successfully downloaded file from Cloudinary: ${response.data.length} bytes`
      );
      return Buffer.from(response.data);
    } catch (error) {
      // If unauthorized when accessing PDFs, try signed private URL
      if (
        (error.response?.status === 401 || error.response?.status === 403) &&
        mimetype === "application/pdf"
      ) {
        try {
          logger.info(`Attempting private_download_url for PDF: ${publicId}`);
          const signedUrl = cloudinary.utils.private_download_url(
            cleanPublicId,
            "pdf",
            {
              resource_type: "image",
              type: "upload",
              expires_at: Math.floor(Date.now() / 1000) + 60, // 1 min expiry
            }
          );

          logger.info(`Generated signed PDF URL: ${signedUrl}`);

          const signedResp = await axios.get(signedUrl, {
            responseType: "arraybuffer",
            timeout: 30000,
            headers: {
              "User-Agent": "Xero/1.0",
            },
            maxRedirects: 5,
          });

          logger.info(
            `Private URL download success: ${signedResp.data.length} bytes`
          );
          return Buffer.from(signedResp.data);
        } catch (privErr) {
          logger.error(`Private download also failed: ${privErr.message}`);
          // continue to existing fallback flow
        }
      }

      logger.error(`Cloudinary file access error: ${error.message}`);
      logger.error(`Error details:`, {
        publicId,
        cleanPublicId,
        resourceType,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
      });

      // Fallback: Try using Admin API to get resource info
      try {
        logger.info(`Trying fallback with Admin API for: ${publicId}`);

        // Try both with and without extension for existing files
        let resourceInfo;
        try {
          resourceInfo = await cloudinary.api.resource(cleanPublicId, {
            resource_type: resourceType,
            type: "upload",
          });
        } catch (adminError) {
          logger.info(
            `Admin API failed with clean ID, trying original: ${publicId}`
          );
          resourceInfo = await cloudinary.api.resource(publicId, {
            resource_type: resourceType,
            type: "upload",
          });
        }

        logger.info(
          `Fallback: Found resource with URL: ${resourceInfo.secure_url}`
        );

        const fallbackResponse = await axios.get(resourceInfo.secure_url, {
          responseType: "arraybuffer",
          timeout: 30000,
          headers: {
            "User-Agent": "Xero/1.0",
          },
          maxRedirects: 5,
        });

        logger.info(
          `Fallback successful: ${fallbackResponse.data.length} bytes`
        );
        return Buffer.from(fallbackResponse.data);
      } catch (fallbackError) {
        logger.error(`Fallback also failed: ${fallbackError.message}`);
        logger.error(`Fallback error details:`, {
          message: fallbackError.message,
          response: fallbackError.response?.data,
          status: fallbackError.response?.status,
        });
        throw new Error(
          `Failed to access Cloudinary file: ${error.message}. Fallback error: ${fallbackError.message}`
        );
      }
    }
  }

  async extractPdfContent(buffer) {
    try {
      const data = await pdf(buffer);

      if (!data.text || data.text.trim().length === 0) {
        return "[PDF file with no extractable text content. The PDF may contain only images or be password protected.]";
      }

      // Clean up the extracted text
      let text = data.text
        .replace(/\s+/g, " ") // Replace multiple spaces with single space
        .replace(/\n\s*\n/g, "\n\n") // Clean up multiple newlines
        .trim();

      if (text.length > 8000) {
        text =
          text.substring(0, 8000) + "\n\n[Content truncated due to length...]";
      }

      return text;
    } catch (error) {
      logger.error(`PDF extraction error: ${error.message}`);
      return `[PDF file - extraction failed: ${error.message}]`;
    }
  }

  async processFileForAI(fileUrl, mimetype, originalName) {
    try {
      const content = await this.extractFileContent(fileUrl, mimetype);

      return {
        type: "file_content",
        filename: originalName,
        mimetype: mimetype,
        url: fileUrl,
        content: content,
        extractable: this.isContentExtractable(mimetype),
      };
    } catch (error) {
      logger.error(`Error processing file for AI: ${error.message}`);
      return {
        type: "file_reference",
        filename: originalName,
        mimetype: mimetype,
        url: fileUrl,
        content: `[File: ${originalName}]\nNote: Unable to process file content. Error: ${error.message}`,
        extractable: false,
      };
    }
  }

  isContentExtractable(mimetype) {
    const extractableMimes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "text/html",
      "application/json",
    ];
    return extractableMimes.includes(mimetype);
  }

  // NEW: Process file directly from Cloudinary
  async processFileFromCloudinary(fileId) {
    try {
      const file = await File.findById(fileId);
      if (!file) {
        throw new Error("File not found");
      }

      logger.info(
        `Processing file from Cloudinary: ${file.cloudinaryId} (${file.mimetype})`
      );

      // Debug: List recent resources to see what's actually stored
      await this.debugListCloudinaryResources();

      // Get file buffer from Cloudinary using Admin API
      const buffer = await this.getCloudinaryFileBuffer(
        file.cloudinaryId,
        file.mimetype
      );

      switch (file.mimetype) {
        case "application/pdf":
          const pdfContent = await this.extractPdfContent(buffer);
          return {
            type: "file_content",
            filename: file.originalName,
            mimetype: file.mimetype,
            content: pdfContent,
            buffer: buffer, // Include buffer for LLM
            extractable: true,
          };

        case "text/plain":
        case "text/csv":
          const textContent = buffer.toString("utf-8");
          return {
            type: "file_content",
            filename: file.originalName,
            mimetype: file.mimetype,
            content: textContent,
            buffer: buffer,
            extractable: true,
          };

        default:
          // For images, videos, etc. - return buffer for LLM processing
          return {
            type: "file_content",
            filename: file.originalName,
            mimetype: file.mimetype,
            content: `[${file.mimetype} file: ${file.originalName}]`,
            buffer: buffer,
            extractable: false,
          };
      }
    } catch (error) {
      logger.error(`Error processing file from Cloudinary: ${error.message}`);
      throw error;
    }
  }

  // Helper: Determine Cloudinary resource type based on mimetype
  getCloudinaryResourceType(mimetype) {
    if (!mimetype) return "raw";

    if (mimetype.startsWith("image/")) {
      return "image";
    }

    // Cloudinary treats PDFs as images for delivery
    if (mimetype === "application/pdf") {
      return "image";
    }

    if (mimetype.startsWith("video/") || mimetype.startsWith("audio/")) {
      return "video";
    }

    return "raw"; // default fallback for other docs
  }
}

module.exports = new FileService();
