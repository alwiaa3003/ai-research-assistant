import Document from "../models/Document.js";
import { extractTextFromPDF } from "../utils/pdfParser.js";
import { chunkText } from "../utils/chunkText.js";
import { upsertChunks } from "../services/vectorService.js";

// @route POST /api/upload
// form-data: file, company
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { company } = req.body;
    if (!company) {
      return res.status(400).json({ message: "Company is required" });
    }

    const document = await Document.create({
      company,
      fileName: req.file.originalname,
      filePath: req.file.path,
      uploadedBy: req.user._id,
      embeddingStatus: "processing",
    });

    // Extract + chunk + embed (fire and forget so upload responds fast;
    // for production move this to a queue/worker)
    (async () => {
      try {
        const text = await extractTextFromPDF(req.file.path);
        const chunks = chunkText(text);
        await upsertChunks({ documentId: document._id, company, chunks });
        document.embeddingStatus = "completed";
        await document.save();
      } catch (err) {
        document.embeddingStatus = "failed";
        await document.save();
        console.error("Embedding pipeline failed:", err.message);
      }
    })();

    return res.status(201).json(document);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
