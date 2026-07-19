import path from "path";
import fs from "fs";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

const DOCUMENTS_DIR = process.env.DOCUMENTS_DIR || path.resolve("uploads/documents");

/**
 * Best-effort guess at the company name from a filename like
 * "TCS_Q4_2026.pdf" -> "TCS". Used as a fallback when no explicit
 * company is passed in (e.g. during bulk folder ingestion).
 */
const guessCompanyFromFilename = (fileName) => {
  const base = path.basename(fileName, path.extname(fileName));
  return base.split("_")[0].toUpperCase();
};

/**
 * Loads a single PDF, page by page, attaching metadata needed for
 * citations and future re-indexing: fileName, company, uploadDate,
 * and pageNumber.
 *
 * @param {string} filePath - absolute path to the PDF on disk
 * @param {{ company?: string, uploadDate?: string }} [overrides] - explicit
 *   values to use instead of the guessed/derived defaults (the upload
 *   controller will pass these in since it already knows the company).
 */
export const loadSinglePDF = async (filePath, overrides = {}) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`PDF file not found: ${filePath}`);
  }

  try {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);

    const loader = new PDFLoader(filePath, { splitPages: true });
    const pages = await loader.load();

    return pages.map((doc, index) => ({
      ...doc,
      metadata: {
        ...doc.metadata,
        fileName,
        company: overrides.company || guessCompanyFromFilename(fileName),
        uploadDate: overrides.uploadDate || stats.mtime.toISOString(),
        pageNumber: doc.metadata?.loc?.pageNumber ?? index + 1,
      },
    }));
  } catch (error) {
    throw new Error(`Failed to load PDF ${filePath}: ${error.message}`);
  }
};

/**
 * Manually walks backend/uploads/documents with fs.readdir() and loads
 * each PDF individually via loadSinglePDF (no DirectoryLoader), so every
 * page keeps rich per-file metadata.
 *
 * @param {string[]} [onlyFiles] - if provided, only these filenames
 *   (exact match, relative to DOCUMENTS_DIR) are loaded - use this to
 *   re-index just newly uploaded files instead of the whole library.
 */
export const loadAllPDFs = async (onlyFiles) => {
  if (!fs.existsSync(DOCUMENTS_DIR)) {
    throw new Error(
      `Documents directory not found: ${DOCUMENTS_DIR}. Create backend/uploads/documents and add PDFs.`
    );
  }

  try {
    const allFiles = fs.readdirSync(DOCUMENTS_DIR);
    const pdfFiles = allFiles.filter((f) => f.toLowerCase().endsWith(".pdf"));

    const targetFiles =
      onlyFiles && onlyFiles.length > 0
        ? pdfFiles.filter((f) => onlyFiles.includes(f))
        : pdfFiles;

    if (targetFiles.length === 0) {
      console.warn(`No matching PDFs found in ${DOCUMENTS_DIR}`);
      return [];
    }

    let allDocs = [];
    for (const fileName of targetFiles) {
      const filePath = path.join(DOCUMENTS_DIR, fileName);
      const pages = await loadSinglePDF(filePath);
      allDocs = allDocs.concat(pages);
    }

    return allDocs;
  } catch (error) {
    throw new Error(`Failed to load PDFs from ${DOCUMENTS_DIR}: ${error.message}`);
  }
};