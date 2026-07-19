import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const CHUNK_SIZE = Number(process.env.RAG_CHUNK_SIZE) || 1000;
const CHUNK_OVERLAP = Number(process.env.RAG_CHUNK_OVERLAP) || 200;

let _splitter = null;

/**
 * Returns a shared RecursiveCharacterTextSplitter instance, configured
 * for 1000-character chunks with 200-character overlap between them.
 */
const getSplitter = () => {
  if (!_splitter) {
    _splitter = new RecursiveCharacterTextSplitter({
      chunkSize: CHUNK_SIZE,
      chunkOverlap: CHUNK_OVERLAP,
    });
  }
  return _splitter;
};

/**
 * Splits an array of page-level Documents (from pdfLoader.js) into
 * smaller chunked Documents.
 *
 * Metadata from each source page (fileName, company, uploadDate,
 * pageNumber) is automatically preserved on every chunk produced from
 * that page. A chunkIndex (0-based, reset per page) is added on top,
 * so you can distinguish multiple chunks that came from the same page
 * when building citations later.
 *
 * @param {Array<{pageContent: string, metadata: object}>} documents
 * @returns {Promise<Array<{pageContent: string, metadata: object}>>}
 */
export const splitDocuments = async (documents) => {
  if (!documents || documents.length === 0) {
    return [];
  }

  try {
    const splitter = getSplitter();
    const chunkedDocs = [];

    for (const doc of documents) {
      const chunksForPage = await splitter.splitDocuments([doc]);

      chunksForPage.forEach((chunk, index) => {
        chunk.metadata = {
          ...chunk.metadata,
          chunkIndex: index,
        };
      });

      chunkedDocs.push(...chunksForPage);
    }

    return chunkedDocs;
  } catch (error) {
    throw new Error(`Failed to split documents into chunks: ${error.message}`);
  }
};

/**
 * Splits a single raw text string using the same chunkSize/overlap
 * config, attaching the given metadata to every resulting chunk.
 * Useful if you ever need to chunk text that didn't come from
 * pdfLoader.js (e.g. pasted text or scraped news).
 *
 * @param {string} text
 * @param {object} [metadata]
 * @returns {Promise<Array<{pageContent: string, metadata: object}>>}
 */
export const splitSingleText = async (text, metadata = {}) => {
  if (!text || !text.trim()) {
    return [];
  }

  try {
    const splitter = getSplitter();
    const chunks = await splitter.createDocuments([text], [metadata]);

    chunks.forEach((chunk, index) => {
      chunk.metadata = {
        ...chunk.metadata,
        chunkIndex: index,
      };
    });

    return chunks;
  } catch (error) {
    throw new Error(`Failed to split text into chunks: ${error.message}`);
  }
};