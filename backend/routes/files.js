const express = require("express");
const router = express.Router();
const { requireAuth } = require("@clerk/express");
const fileController = require("../controllers/fileController");

// All file routes require authentication
router.use(requireAuth());

// Get user files
router.get("/", fileController.getUserFiles);

// Upload file
router.post("/upload", fileController.uploadFile);

// Get file by ID
router.get("/:fileId", fileController.getFile);

// Delete file
router.delete("/:fileId", fileController.deleteFile);

module.exports = router;
