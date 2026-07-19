import fs from "fs";
import path from "path";
import { loadSinglePDF } from "../rag/pdfLoader.js";
import { splitDocuments } from "../rag/chunker.js";
import {
  addChunksToStore,
  deleteDocumentsByFilename,
  reindexDocument as reindexInStore,
  hasIndexedChunks,
} from "../rag/vectorStore.js";

const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.resolve("uploads/documents");

/**
 * POST /api/documents/upload
 * Accepts a PDF saved to disk by Multer middleware (expected to be
 * configured with destination: "uploads/documents" and a PDF-only
 * fileFilter at the route level). Validates the file is a PDF and
 * confirms it was saved, without indexing it yet - indexing is a
 * separate, explicit step via indexDocument below.
 */
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      console.warn("[documentController] uploadDocument called with no file attached.");
      return res.status(400).json({ message: "No file uploaded." });
    }

    const isPdf =
      req.file.mimetype === "application/pdf" ||
      path.extname(req.file.originalname).toLowerCase() === ".pdf";

    if (!isPdf) {
      // Clean up the invalid file if it somehow made it to disk.
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.warn(`[documentController] Rejected non-PDF upload: ${req.file.originalname}`);
      return res.status(400).json({ message: "Only PDF files are allowed." });
    }

    console.log(`[documentController] Uploaded "${req.file.filename}" to ${DOCUMENTS_DIR}.`);

    return res.status(201).json({
      message: "File uploaded successfully.",
      fileName: req.file.filename,
    });
  } catch (error) {
    console.error(`[documentController] uploadDocument failed: ${error.message}`);
    return res.status(500).json({ message: "Failed to upload document.", error: error.message });
  }
};

/**
 * POST /api/documents/index
 * body: { fileName, company?, uploadDate? }
 *
 * Verifies the given file exists in uploads/documents, then runs the
 * full pipeline: load PDF pages -> chunk them -> embed and store in
 * Chroma. Returns counts describing what happened at each stage.
 */
export const indexDocument = async (req, res) => {
  try {
    const { fileName, company, uploadDate } = req.body;

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required." });
    }

    const filePath = path.join(DOCUMENTS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`[documentController] indexDocument: file not found: ${filePath}`);
      return res.status(404).json({ message: `File "${fileName}" not found in uploads/documents.` });
    }

    console.log(`[documentController] Indexing "${fileName}" ...`);

    const pages = await loadSinglePDF(filePath, { company, uploadDate });
    const chunks = await splitDocuments(pages);
    const result = await addChunksToStore(chunks);

    console.log(
      `[documentController] Indexed "${fileName}": ${pages.length} page(s), ${chunks.length} chunk(s) created, ${result.added} added, ${result.skipped} skipped.`
    );

    return res.status(200).json({
      fileName,
      pagesIndexed: pages.length,
      chunksCreated: chunks.length,
      chunksAdded: result.added,
      chunksSkipped: result.skipped,
    });
  } catch (error) {
    console.error(`[documentController] indexDocument failed: ${error.message}`);
    return res.status(500).json({ message: "Failed to index document.", error: error.message });
  }
};

/**
 * POST /api/documents/reindex
 * body: { fileName, company?, uploadDate? }
 *
 * Same load-and-chunk steps as indexDocument, but deletes all existing
 * vectors for this filename first (via vectorStore's reindexDocument),
 * then adds the fresh set - so no stale data from a previous version
 * of the file remains searchable.
 */
export const reindexDocument = async (req, res) => {
  try {
    const { fileName, company, uploadDate } = req.body;

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required." });
    }

    const filePath = path.join(DOCUMENTS_DIR, fileName);
    if (!fs.existsSync(filePath)) {
      console.warn(`[documentController] reindexDocument: file not found: ${filePath}`);
      return res.status(404).json({ message: `File "${fileName}" not found in uploads/documents.` });
    }

    console.log(`[documentController] Re-indexing "${fileName}" ...`);

    const pages = await loadSinglePDF(filePath, { company, uploadDate });
    const chunks = await splitDocuments(pages);
    const result = await reindexInStore(fileName, chunks);

    console.log(
      `[documentController] Re-indexed "${fileName}": ${pages.length} page(s), ${chunks.length} chunk(s) created, ${result.added} added, ${result.skipped} skipped.`
    );

    return res.status(200).json({
      fileName,
      pagesIndexed: pages.length,
      chunksCreated: chunks.length,
      chunksAdded: result.added,
      chunksSkipped: result.skipped,
    });
  } catch (error) {
    console.error(`[documentController] reindexDocument failed: ${error.message}`);
    return res.status(500).json({ message: "Failed to re-index document.", error: error.message });
  }
};

/**
 * DELETE /api/documents/:fileName
 *
 * Removes a document entirely: deletes its vectors from Chroma first,
 * then deletes the physical PDF from uploads/documents. Vector
 * deletion happens first so that if it fails, the source file is
 * still on disk to retry rather than being lost with orphaned vectors
 * still searchable.
 */
export const deleteDocument = async (req, res) => {
  try {
    const { fileName } = req.params;

    if (!fileName) {
      return res.status(400).json({ message: "fileName is required." });
    }

    const filePath = path.join(DOCUMENTS_DIR, fileName);

    await deleteDocumentsByFilename(fileName);
    console.log(`[documentController] Deleted vectors for "${fileName}" from Chroma.`);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`[documentController] Deleted file "${fileName}" from ${DOCUMENTS_DIR}.`);
    } else {
      console.warn(`[documentController] File "${fileName}" was not found on disk (vectors were still deleted).`);
    }

    return res.status(200).json({ message: `Document "${fileName}" deleted successfully.` });
  } catch (error) {
    console.error(`[documentController] deleteDocument failed: ${error.message}`);
    return res.status(500).json({ message: "Failed to delete document.", error: error.message });
  }
};

export const listDocuments = async (req, res) => {
  try {
    if (!fs.existsSync(DOCUMENTS_DIR)) {
      return res.status(200).json([]);
    }

    const files = fs
      .readdirSync(DOCUMENTS_DIR)
      .filter((file) => file.toLowerCase().endsWith(".pdf"));

    const documents = await Promise.all(
      files.map(async (fileName) => {
        const filePath = path.join(DOCUMENTS_DIR, fileName);
        const stats = await fs.promises.stat(filePath);

        const indexed = await hasIndexedChunks(fileName);

        return {
          fileName,
          uploadDate: stats.mtime.toISOString(),
          indexed,
        };
      })
    );

    return res.status(200).json(documents);
  } catch (error) {
    console.error(`[documentController] listDocuments failed: ${error.message}`);
    return res.status(500).json({
      message: "Failed to list documents.",
      error: error.message,
    });
  }
};