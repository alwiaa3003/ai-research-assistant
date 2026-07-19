import express from "express";
import multer from "multer";
import path from "path";

import {
  uploadDocument,
  indexDocument,
  reindexDocument,
  deleteDocument,
  listDocuments,
} from "../controllers/documentController.js";

const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.resolve("uploads/documents");
import fs from "fs";

if (!fs.existsSync(DOCUMENTS_DIR)) {
  fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
}
const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

/**
 * Multer storage config: saves every uploaded PDF into uploads/documents,
 * with a timestamp + random suffix in the filename so two uploads with
 * the same original name never collide or overwrite each other.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, DOCUMENTS_DIR),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

/**
 * Rejects anything that isn't a PDF, checking both the reported MIME
 * type and the file extension.
 */
const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExt = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (isPdfMime && isPdfExt) {
    return cb(null, true);
  }

  return cb(new Error("Only PDF files are allowed."));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES },
});

/**
 * Wraps Multer's single-file upload middleware so its errors (file too
 * large, wrong file type) come back as clean 400 JSON responses instead
 * of an unhandled exception. Anything Multer didn't cause is passed on
 * to the app's existing error-handling middleware via next(err).
 */
const handleUpload = (req, res, next) => {
  const middleware = upload.single("file");

  middleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.warn(`[documentRoutes] Multer error: ${err.message}`);
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "File is too large. Maximum size is 20 MB." });
      }
      return res.status(400).json({ message: err.message });
    }

    if (err) {
      console.warn(`[documentRoutes] Upload rejected: ${err.message}`);
      return res.status(400).json({ message: err.message });
    }

    next();
  });
};

const router = express.Router();

router.get("/", listDocuments);
router.post("/upload", handleUpload, uploadDocument);
router.post("/index", indexDocument);
router.post("/reindex", reindexDocument);
router.delete("/:fileName", deleteDocument);

export default router;