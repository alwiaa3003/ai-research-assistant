import { queryCollection } from "./vectorStore.js";
import { getEmbeddings } from "./embeddings.js";

const DEFAULT_TOP_K = Number(process.env.RAG_TOP_K) || 5;
const MIN_SIMILARITY_SCORE = Number(process.env.RAG_MIN_SCORE) || 0.3;

/**
 * Embeds the user's query text into a vector using Gemini, via the
 * shared GeminiEmbeddings instance from embeddings.js.
 */
const getQueryEmbedding = async (query) => {
  try {
    const embeddings = getEmbeddings();
    return await embeddings.embedQuery(query);
  } catch (error) {
    console.error("[retriever] Failed to embed query:", error);
    throw error;
    }
};

/**
 * Removes duplicate chunks from the result set, keeping only the first
 * occurrence of each unique piece of text. Duplicates can legitimately
 * occur because chunker.js uses 200-character overlap between chunks,
 * so two adjacent chunks can be near-identical and both match a query.
 */
const deduplicateResults = (results) => {
  const seen = new Set();
  const deduped = [];

  for (const result of results) {
    const key = `${result.metadata.fileName}-${result.metadata.pageNumber}-${result.metadata.chunkIndex}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(result);
    }
  }

  const removed = results.length - deduped.length;
  if (removed > 0) {
    console.log(`[retriever] Removed ${removed} duplicate chunk(s).`);
  }

  return deduped;
};

/**
 * Drops any result whose similarity score is below the minimum
 * threshold, so weakly-related chunks don't get passed to Gemini as
 * if they were solid context.
 */
const filterByConfidence = (results, minScore) => {
  const filtered = results.filter(
  (r) => r.score !== null && r.score >= minScore
);
  const removed = results.length - filtered.length;
  if (removed > 0) {
    console.log(`[retriever] Filtered out ${removed} low-confidence chunk(s) (score < ${minScore}).`);
  }

  return filtered;
};

/**
 * Retrieves the top relevant chunks for a user's question.
 *
 * Flow: embed query -> search Chroma (optionally filtered by company)
 * -> remove duplicates -> filter out low-confidence matches -> return.
 *
 * @param {string} query - the user's question
 * @param {{ company?: string, topK?: number, minScore?: number }} [options]
 * @returns {Promise<Array<{ text: string, metadata: object, score: number|null }>>}
 */
export const retrieveContext = async (query, options = {}) => {
  const { company, topK = DEFAULT_TOP_K, minScore = MIN_SIMILARITY_SCORE } = options;

  if (!query || !query.trim()) {
    console.log("[retriever] Empty query received, returning no results.");
    return [];
  }

  try {
    console.log(`[retriever] Retrieving context for query: "${query}"${company ? ` (company: ${company})` : ""}`);

    const queryEmbedding = await getQueryEmbedding(query);

    const rawResults = await queryCollection({ queryEmbedding, topK, company });
    console.log(`[retriever] Chroma returned ${rawResults.length} raw match(es).`);

    const deduped = deduplicateResults(rawResults);
    const confident = filterByConfidence(deduped, minScore);

    const finalResults = confident.map((r) => ({
      text: r.text,
      metadata: r.metadata,
      score: r.score,
    }));

    console.log(`[retriever] Returning ${finalResults.length} chunk(s) after dedup + confidence filtering.`);

    return finalResults;
  } catch (error) {
    console.error("[retriever] Retrieval failed:", error);
    throw error;
    }
};