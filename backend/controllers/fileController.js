const { getAuth } = require("@clerk/express");
const fileService = require("../services/fileService");
const multer = require("multer");
const logger = require("../utils/logger");

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (fileService.validateFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`), false);
    }
  },
});

class FileController {
  async uploadFile(req, res, next) {
    try {
      // Use multer middleware to handle file upload
      upload.single("file")(req, res, async (err) => {
        if (err) {
          if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
              return res
                .status(400)
                .json({ error: "File too large. Maximum size is 10MB." });
            }
          }
          return res.status(400).json({ error: err.message });
        }

        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        const auth = getAuth(req);
        const userId = auth.userId;

        const result = await fileService.uploadFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype,
          userId
        );

        res.status(201).json({
          message: "File uploaded successfully",
          file: result,
        });
      });
    } catch (error) {
      logger.error("Upload file error:", error);
      next(error);
    }
  }

  async getFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      const file = await fileService.getFileById(fileId, userId);

      res.json(file);
    } catch (error) {
      logger.error("Get file error:", error);
      if (error.message === "File not found or access denied") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }

  async getUserFiles(req, res, next) {
    try {
      const auth = getAuth(req);
      const userId = auth.userId;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;

      const result = await fileService.getUserFiles(userId, page, limit);

      res.json(result);
    } catch (error) {
      logger.error("Get user files error:", error);
      next(error);
    }
  }

  async deleteFile(req, res, next) {
    try {
      const { fileId } = req.params;
      const auth = getAuth(req);
      const userId = auth.userId;

      await fileService.deleteFile(fileId, userId);

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      logger.error("Delete file error:", error);
      if (error.message === "File not found or access denied") {
        return res.status(404).json({ error: error.message });
      }
      next(error);
    }
  }
}

module.exports = new FileController();
