import { ChromaClient } from "chromadb";
import { getEmbeddings } from "./embeddings.js";

const CHROMA_URL = process.env.CHROMA_URL || "http://localhost:8000";
const COLLECTION_NAME = process.env.CHROMA_COLLECTION || "stock_documents";

const chroma = new ChromaClient({
  path: process.env.CHROMA_URL || "http://localhost:8000",
});

let _collection = null;

/**
 * Connects to (or creates) the Chroma collection used to store all
 * indexed PDF chunks. Cached after the first call so repeated
 * operations don't reconnect every time.
 */
const getCollection = async () => {
  if (!_collection) {
    try {
      _collection = await chroma.getOrCreateCollection({
          name: COLLECTION_NAME,
          embeddingFunction: null
      });
      console.log(`[vectorStore] Connected to Chroma collection "${COLLECTION_NAME}" at ${CHROMA_URL}`);
    } catch (error) {
      throw new Error(
        `Could not connect to Chroma at ${CHROMA_URL}. Is "chroma run" running? (${error.message})`
      );
    }
  }
  return _collection;
};

/**
 * Builds a deterministic ID for a chunk from its metadata, e.g.
 * "TCS_Q4_2026.pdf-page3-chunk1". Same file + page + chunk index
 * always produces the same ID, which is what makes duplicate
 * detection possible below.
 */
const buildChunkId = (metadata) => {
  const { fileName, pageNumber, chunkIndex } = metadata;
  return `${fileName}-page${pageNumber}-chunk${chunkIndex}`;
};

/**
 * Given a list of candidate IDs, returns only the ones that do NOT
 * already exist in the collection. Logs how many were skipped as
 * duplicates.
 */
const filterOutExistingIds = async (collection, ids) => {
  if (ids.length === 0) return [];

  try {
    const existing = await collection.get({ ids });
    const existingIds = new Set(existing.ids || []);
    const newIds = ids.filter((id) => !existingIds.has(id));

    const skipped = ids.length - newIds.length;
    if (skipped > 0) {
      console.log(`[vectorStore] Skipped ${skipped} already-indexed chunk(s) (duplicate prevention).`);
    }

    return newIds;
  } catch (error) {
    // If the collection is empty or brand new, .get() may throw instead
    // of returning an empty result - treat that as "nothing exists yet".
    console.log(`[vectorStore] No existing chunks found to compare against (${error.message}).`);
    return ids;
  }
};

/**
 * Embeds and stores an array of chunked Documents (from chunker.js) in
 * Chroma. Skips any chunk whose deterministic ID already exists, so
 * re-running ingestion on the same file never creates duplicates.
 *
 * @param {Array<{pageContent: string, metadata: object}>} chunks
 */
export const addChunksToStore = async (chunks) => {
  if (!chunks || chunks.length === 0) {
    console.log("[vectorStore] No chunks provided, nothing to add.");
    return { added: 0, skipped: 0 };
  }

  try {
    const collection = await getCollection();
    const embeddings = getEmbeddings();

    const candidateIds = chunks.map((chunk) => buildChunkId(chunk.metadata));
    const newIds = await filterOutExistingIds(collection, candidateIds);

    if (newIds.length === 0) {
      console.log("[vectorStore] All chunks were already indexed. Nothing new to add.");
      return { added: 0, skipped: chunks.length };
    }

    const newIdSet = new Set(newIds);
    const chunksToAdd = chunks.filter((chunk) => newIdSet.has(buildChunkId(chunk.metadata)));

    console.log(`[vectorStore] Embedding ${chunksToAdd.length} new chunk(s) ...`);
    const texts = chunksToAdd.map((chunk) => chunk.pageContent);
    const vectors = await embeddings.embedDocuments(texts);

    const ids = chunksToAdd.map((chunk) => buildChunkId(chunk.metadata));
    const documents = texts;
    const metadatas = chunksToAdd.map((chunk) => ({
    fileName: chunk.metadata.fileName,
    company: chunk.metadata.company,
    pageNumber: chunk.metadata.pageNumber,
    uploadDate: chunk.metadata.uploadDate,
    chunkIndex: chunk.metadata.chunkIndex,
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
    }));

    await collection.add({ ids, embeddings: vectors, metadatas, documents });

    console.log(`[vectorStore] Added ${ids.length} new chunk(s) to "${COLLECTION_NAME}".`);
    return { added: ids.length, skipped: chunks.length - ids.length };
  } catch (error) {
    console.error("[vectorStore] Failed to add chunks:", error);
    throw error;
    }
};

/**
 * Deletes every chunk in the collection belonging to the given
 * filename. Use this to remove a document's data entirely, e.g.
 * before re-indexing it or if it was uploaded by mistake.
 *
 * @param {string} fileName
 */
export const deleteDocumentsByFilename = async (fileName) => {
  try {
    const collection = await getCollection();
    await collection.delete({ where: { fileName } });
    console.log(`[vectorStore] Deleted all chunks for "${fileName}".`);
    return { deleted: fileName };
  } catch (error) {
    console.error(`[vectorStore] Failed to delete chunks for "${fileName}":`, error);
    throw error;
  }
};

/**
 * Re-indexes a single PDF: deletes any existing chunks for that
 * filename first, then adds the freshly chunked set. Guarantees no
 * stale or duplicate data lingers from a previous version of the file.
 *
 * @param {string} fileName
 * @param {Array<{pageContent: string, metadata: object}>} chunks
 */
export const reindexDocument = async (fileName, chunks) => {
  console.log(`[vectorStore] Re-indexing "${fileName}" ...`);
  await deleteDocumentsByFilename(fileName);
  return addChunksToStore(chunks);
};

/**
 * Low-level similarity search. Embeds the query text is NOT done here -
 * callers (e.g. retriever.js) pass in an already-computed queryEmbedding.
 * Optionally filters results to a single company.
 *
 * @param {{ queryEmbedding: number[], topK?: number, company?: string }} params
 */
export const queryCollection = async ({ queryEmbedding, topK = 5, company }) => {
  try {
    const collection = await getCollection();
    const results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: company ? { company } : undefined,
    });

    const docs = results.documents?.[0] || [];
    const metas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    return docs.map((text, i) => ({
    text,
    metadata: metas[i] || {},
    score: distances[i] ?? null,
    }));
  } catch (error) {
    console.error(`[vectorStore] Query failed: ${error.message}`);
    throw new Error(`Chroma query failed: ${error.message}`);
  }
};

/**
 * Checks whether any indexed chunks exist in the collection for the
 * given filename. Used by documentController.js to report a document's
 * "Indexed" / "Not Indexed" status without needing its own separate
 * Chroma connection.
 *
 * @param {string} fileName
 * @returns {Promise<boolean>}
 */
export const hasIndexedChunks = async (fileName) => {
  try {
    const collection = await getCollection();
    const result = await collection.get({ where: { fileName }, limit: 1 });
    return (result.ids || []).length > 0;
  } catch (error) {
    console.warn(`[vectorStore] Could not check indexed status for "${fileName}": ${error.message}`);
    return false;
  }
};